/**
 * Browser-Use JS OAuth2 设备授权模块
 *
 * 源文件: browser_use/sync/auth.py
 * 功能描述: 实现 OAuth2 设备授权授权流程客户端
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../logging.js';

const logger = getLogger('sync.auth');

// 预认证事件的临时用户ID（与云后端匹配）
export const TEMP_USER_ID = '99999999-9999-9999-9999-999999999999';

/**
 * 云认证配置
 */
export interface CloudAuthConfig {
  apiToken?: string | null;
  userId?: string | null;
  authorizedAt?: Date | null;
}

/**
 * 云认证配置类
 */
export class CloudAuthConfigManager {
  /**
   * 从本地文件加载认证配置
   */
  static loadFromFile(): CloudAuthConfig {
    const configPath = this.getConfigPath();

    if (fs.existsSync(configPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return {
          apiToken: data.apiToken || null,
          userId: data.userId || null,
          authorizedAt: data.authorizedAt ? new Date(data.authorizedAt) : null,
        };
      } catch (error) {
        // 如果文件损坏，返回空配置
        logger.debug(`Failed to load auth config: ${error}`);
      }
    }

    return {};
  }

  /**
   * 保存认证配置到本地文件
   */
  static saveToFile(config: CloudAuthConfig): void {
    const configDir = this.getConfigDir();
    fs.mkdirSync(configDir, { recursive: true });

    const configPath = this.getConfigPath();
    const data = {
      ...config,
      authorizedAt: config.authorizedAt?.toISOString(),
    };

    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

    // 设置限制性权限（仅所有者读/写）以确保安全
    try {
      fs.chmodSync(configPath, 0o600);
    } catch (error) {
      // 某些系统可能不支持 chmod，继续执行
      logger.debug(`Failed to set file permissions: ${error}`);
    }
  }

  private static getConfigDir(): string {
    return path.join(os.homedir(), '.config', 'browser_use');
  }

  private static getConfigPath(): string {
    return path.join(this.getConfigDir(), 'cloud_auth.json');
  }
}

/**
 * HTTP 客户端接口
 */
interface HttpClient {
  post(
    url: string,
    options: {
      data?: Record<string, any>;
      json?: Record<string, any>;
      headers?: Record<string, string>;
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
    // 模拟响应
    logger.debug(`Mock HTTP POST to ${url}`, options);

    if (url.includes('/device/authorize')) {
      return {
        status: 200,
        json: async () => ({
          device_code: 'mock_device_code',
          user_code: 'MOCK123',
          verification_uri: 'https://example.com/device',
          verification_uri_complete:
            'https://example.com/device?user_code=MOCK123',
          expires_in: 1800,
          interval: 5,
        }),
        text: async () => '{"device_code":"mock_device_code"}',
      };
    }

    if (url.includes('/device/token')) {
      return {
        status: 200,
        json: async () => ({
          access_token: 'mock_access_token',
          token_type: 'Bearer',
          user_id: 'mock_user_id',
        }),
        text: async () => '{"access_token":"mock_access_token"}',
      };
    }

    return {
      status: 404,
      json: async () => ({ error: 'Not found' }),
      text: async () => 'Not found',
    };
  }
}

/**
 * OAuth2 设备授权流程客户端
 */
export class DeviceAuthClient {
  private baseUrl: string;
  private clientId = 'library';
  private scope = 'read write';
  private httpClient: HttpClient;
  private tempUserId = TEMP_USER_ID;
  private authConfig: CloudAuthConfig;

  constructor(baseUrl?: string, httpClient?: HttpClient) {
    // 后端 API URL，用于 OAuth 请求 - 可以直接传递或默认为环境变量
    this.baseUrl =
      baseUrl ||
      process.env.BROWSER_USE_CLOUD_URL ||
      'https://cloud.browser-use.com';

    // 如果没有提供客户端，我们将为每个请求创建一个
    this.httpClient = httpClient || new MockHttpClient();

    // 加载现有认证（如果可用）
    this.authConfig = CloudAuthConfigManager.loadFromFile();
  }

  /**
   * 检查是否有有效的认证
   */
  get isAuthenticated(): boolean {
    return !!(this.authConfig.apiToken && this.authConfig.userId);
  }

  /**
   * 获取当前 API 令牌
   */
  get apiToken(): string | null {
    return this.authConfig.apiToken || null;
  }

  /**
   * 获取当前用户ID（临时或真实）
   */
  get userId(): string {
    return this.authConfig.userId || this.tempUserId;
  }

  /**
   * 开始设备授权流程
   * 返回包括用户代码和验证URL的设备授权详情
   */
  async startDeviceAuthorization(
    agentSessionId?: string
  ): Promise<Record<string, any>> {
    const response = await this.httpClient.post(
      `${this.baseUrl.replace(/\/$/, '')}/api/v1/oauth/device/authorize`,
      {
        data: {
          client_id: this.clientId,
          scope: this.scope,
          agent_session_id: agentSessionId,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Authorization request failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * 轮询访问令牌
   * 当授权时返回令牌信息，超时时返回 null
   */
  async pollForToken(
    deviceCode: string,
    interval = 5,
    timeout = 1800
  ): Promise<Record<string, any> | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout * 1000) {
      try {
        const response = await this.httpClient.post(
          `${this.baseUrl.replace(/\/$/, '')}/api/v1/oauth/device/token`,
          {
            data: {
              grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
              device_code: deviceCode,
              client_id: this.clientId,
            },
          }
        );

        if (response.status === 200) {
          const data = await response.json();

          // 检查待授权状态
          if (data.error === 'authorization_pending') {
            await this.sleep(interval * 1000);
            continue;
          }

          // 检查减速
          if (data.error === 'slow_down') {
            interval = data.interval || interval * 2;
            await this.sleep(interval * 1000);
            continue;
          }

          // 检查其他错误
          if (data.error) {
            logger.error(`Error: ${data.error_description || data.error}`);
            return null;
          }

          // 成功！我们有一个令牌
          if (data.access_token) {
            return data;
          }
        } else if (response.status === 400) {
          // 错误响应
          const data = await response.json();
          if (!['authorization_pending', 'slow_down'].includes(data.error)) {
            logger.error(`Error: ${data.error_description || 'Unknown error'}`);
            return null;
          }
        } else {
          logger.error(`Unexpected status code: ${response.status}`);
          return null;
        }
      } catch (error) {
        logger.error(`Error polling for token: ${error}`);
      }

      await this.sleep(interval * 1000);
    }

    return null;
  }

  /**
   * 运行完整的认证流程
   * 如果认证成功返回 true
   */
  async authenticate(
    agentSessionId?: string,
    showInstructions = true
  ): Promise<boolean> {
    try {
      // 开始设备授权
      const deviceAuth = await this.startDeviceAuthorization(agentSessionId);

      // 使用前端URL用于面向用户的链接
      const frontendUrl = process.env.BROWSER_USE_CLOUD_UI_URL || this.baseUrl;

      // 在验证URI中用前端URL替换后端URL
      const verificationUri = deviceAuth.verification_uri.replace(
        this.baseUrl,
        frontendUrl
      );
      const verificationUriComplete =
        deviceAuth.verification_uri_complete.replace(this.baseUrl, frontendUrl);

      if (showInstructions) {
        logger.info('\n\n' + '─'.repeat(70));
        logger.info('🌐  View the details of this run in Browser Use Cloud:');
        logger.info(`    👉  ${verificationUriComplete}`);
        logger.info('─'.repeat(70) + '\n');
      }

      // 轮询令牌
      const tokenData = await this.pollForToken(
        deviceAuth.device_code,
        deviceAuth.interval || 5
      );

      if (tokenData?.access_token) {
        // 保存认证
        this.authConfig.apiToken = tokenData.access_token;
        this.authConfig.userId = tokenData.user_id || this.tempUserId;
        this.authConfig.authorizedAt = new Date();
        CloudAuthConfigManager.saveToFile(this.authConfig);

        if (showInstructions) {
          logger.info(
            '✅  Authentication successful! Cloud sync is now enabled.'
          );
        }

        return true;
      }
    } catch (error: any) {
      // 记录错误详情以供调试
      if (error.response) {
        logger.debug(
          `Failed to get pre-auth token for cloud sync: HTTP ${error.response.status} - ${error.response.text?.slice(0, 200)}`
        );
      } else {
        logger.debug(
          `Failed to get pre-auth token for cloud sync: ${error.constructor.name}: ${error.message}`
        );
      }
    }

    if (showInstructions) {
      logger.info('❌ Authentication failed or timed out');
    }

    return false;
  }

  /**
   * 获取API请求的头部
   */
  getHeaders(): Record<string, string> {
    if (this.apiToken) {
      return { Authorization: `Bearer ${this.apiToken}` };
    }
    return {};
  }

  /**
   * 清除存储的认证
   */
  clearAuth(): void {
    this.authConfig = {};
    CloudAuthConfigManager.saveToFile(this.authConfig);
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
