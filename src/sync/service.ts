/**
 * Browser-Use JS 云同步服务
 *
 * 源文件: browser_use/sync/service.py
 * 功能描述: 用于将事件同步到 Browser Use 云端的服务
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getLogger } from '../logging.js';
import { TEMP_USER_ID, DeviceAuthClient } from './auth.js';

const logger = getLogger('sync.service');

/**
 * 基础事件接口
 */
export interface BaseEvent {
  eventType: string;
  id?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * HTTP 客户端接口
 */
interface HttpClient {
  post(
    url: string,
    options: {
      json?: any;
      headers?: Record<string, string>;
      timeout?: number;
    }
  ): Promise<{
    status: number;
    json(): Promise<any>;
    text(): Promise<string>;
  }>;
}

/**
 * 模拟 HTTP 客户端
 */
class MockHttpClient implements HttpClient {
  async post(url: string, options: any): Promise<any> {
    logger.debug(`Mock HTTP POST to ${url}`, {
      hasJson: !!options.json,
      headers: options.headers,
      timeout: options.timeout,
    });

    // 模拟成功响应
    return {
      status: 200,
      json: async () => ({ success: true }),
      text: async () => '{"success": true}',
    };
  }
}

/**
 * 云同步服务
 * 用于将事件同步到 Browser Use 云端
 */
export class CloudSync {
  private baseUrl: string;
  private enableAuth: boolean;
  private authClient: DeviceAuthClient | null;
  private pendingEvents: Record<string, any>[] = [];
  private authTask: Promise<void> | null = null;
  private sessionId: string | null = null;
  private httpClient: HttpClient;

  constructor(baseUrl?: string, enableAuth = true, httpClient?: HttpClient) {
    // 后端 API URL，用于所有 API 请求 - 可以直接传递或默认为环境变量
    this.baseUrl =
      baseUrl ||
      process.env.BROWSER_USE_CLOUD_URL ||
      'https://cloud.browser-use.com';
    this.enableAuth = enableAuth;
    this.authClient = enableAuth ? new DeviceAuthClient(this.baseUrl) : null;
    this.httpClient = httpClient || new MockHttpClient();
  }

  /**
   * 通过将事件发送到云端来处理事件
   */
  async handleEvent(event: BaseEvent): Promise<void> {
    try {
      // 从 CreateAgentSessionEvent 提取会话ID
      if (event.eventType === 'CreateAgentSession' && event.id) {
        this.sessionId = event.id;

        // 如果启用且未认证，则启动认证流程
        if (
          this.enableAuth &&
          this.authClient &&
          !this.authClient.isAuthenticated
        ) {
          // 在后台启动认证
          this.authTask = this.backgroundAuth(this.sessionId);
        }
      }

      // 准备事件数据
      const eventData = this.prepareEventData(event);

      // 发送事件到云端
      await this.sendEvent(eventData);
    } catch (error) {
      logger.error(
        `Failed to handle ${event.eventType} event: ${error instanceof Error ? error.constructor.name : 'Error'}: ${error}`,
        error
      );
    }
  }

  /**
   * 为云API准备事件数据
   */
  private prepareEventData(event: BaseEvent): Record<string, any> {
    // 从认证客户端获取 user_id 或使用临时ID
    const userId = this.authClient?.userId || TEMP_USER_ID;

    // 直接在事件上设置 user_id（修改事件）
    // 使用属性赋值来处理 user_id 可能不是定义字段的情况
    const eventCopy = { ...event, userId };

    // 直接返回事件作为字典
    return eventCopy;
  }

  /**
   * 发送事件到云API
   */
  private async sendEvent(eventData: Record<string, any>): Promise<void> {
    try {
      const headers: Record<string, string> = {};

      // 如果可用，添加认证头部
      if (this.authClient) {
        Object.assign(headers, this.authClient.getHeaders());
      }

      // 发送事件（批量格式，直接使用 BaseEvent 序列化）
      const response = await this.httpClient.post(
        `${this.baseUrl.replace(/\/$/, '')}/api/v1/events/`,
        {
          json: { events: [eventData] },
          headers,
          timeout: 10000,
        }
      );

      if (
        response.status === 401 &&
        this.authClient &&
        !this.authClient.isAuthenticated
      ) {
        // 存储事件以在认证后重试
        this.pendingEvents.push(eventData);
      } else if (response.status >= 400) {
        // 记录错误但不抛出 - 我们希望静默失败
        const text = await response.text();
        logger.warn(
          `Failed to send event to cloud: HTTP ${response.status} - ${text.slice(0, 200)}`
        );
      }
    } catch (error: any) {
      if (error.code === 'TIMEOUT' || error.name === 'TimeoutError') {
        logger.warn(
          `Event send timed out after 10 seconds - event_type=${eventData.eventType || 'unknown'}`
        );
      } else if (
        error.code === 'ECONNREFUSED' ||
        error.name === 'ConnectError'
      ) {
        logger.warn(
          `Failed to connect to cloud service at ${this.baseUrl}: ${error.message}`
        );
      } else if (error.name === 'HTTPError') {
        logger.warn(
          `HTTP error sending event: ${error.constructor.name}: ${error.message}`
        );
      } else {
        logger.warn(
          `Unexpected error sending ${eventData.eventType || 'unknown'} event: ${error.constructor.name}: ${error.message}`
        );
      }
    }
  }

  /**
   * 在后台运行认证
   */
  private async backgroundAuth(agentSessionId: string): Promise<void> {
    try {
      if (!this.authClient) return;

      // 运行认证
      const success = await this.authClient.authenticate(agentSessionId, true);

      if (success) {
        // 重新发送任何待处理的事件
        await this.resendPendingEvents();

        // 用真实 user_id 更新 WAL 事件
        await this.updateWalUserIds(agentSessionId);
      }
    } catch (error) {
      logger.warn(`Background authentication failed: ${error}`);
    }
  }

  /**
   * 重新发送在认证期间排队的事件
   */
  private async resendPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) {
      return;
    }

    // 更新待处理事件中的 user_id
    const userId = this.authClient?.userId;
    for (const eventData of this.pendingEvents) {
      eventData.userId = userId;
    }

    // 发送所有待处理的事件
    for (const eventData of this.pendingEvents) {
      try {
        await this.sendEvent(eventData);
      } catch (error) {
        logger.warn(`Failed to resend pending event: ${error}`);
      }
    }

    this.pendingEvents = [];
  }

  /**
   * 认证后更新 WAL 文件中的用户ID
   */
  private async updateWalUserIds(sessionId: string): Promise<void> {
    try {
      const configDir = path.join(os.homedir(), '.config', 'browser_use');
      const walPath = path.join(configDir, 'events', `${sessionId}.jsonl`);

      try {
        await fs.access(walPath);
      } catch {
        return; // 文件不存在
      }

      // 读取所有事件
      const content = await fs.readFile(walPath, 'utf-8');
      const events = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      // 更新 user_id
      const userId = this.authClient?.userId;
      for (const event of events) {
        if ('userId' in event) {
          event.userId = userId;
        }
      }

      // 写回
      const updatedContent =
        events.map(event => JSON.stringify(event)).join('\n') + '\n';
      await fs.writeFile(walPath, updatedContent);
    } catch (error) {
      logger.warn(`Failed to update WAL user IDs: ${error}`);
    }
  }

  /**
   * 等待认证完成（如果正在进行中）
   */
  async waitForAuth(): Promise<void> {
    if (this.authTask) {
      await this.authTask;
    }
  }

  /**
   * 与云服务认证
   */
  async authenticate(showInstructions = true): Promise<boolean> {
    if (!this.authClient) {
      return false;
    }

    return await this.authClient.authenticate(
      this.sessionId || undefined,
      showInstructions
    );
  }
}
