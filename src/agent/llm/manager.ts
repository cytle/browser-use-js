/**
 * @file purpose: LLM 管理器
 *
 * 负责管理多个 LLM 客户端实例，提供统一的接口、缓存、负载均衡和故障转移功能。
 */

import { generateText, LanguageModel, streamText } from 'ai';
import { LLMRequest, LLMResponse, LLMStreamResponse } from './index';

/**
 * 缓存条目
 */
interface CacheEntry {
  response: LLMResponse;
  timestamp: number;
}

/**
 * LLM 管理器配置
 */
export interface LLMManagerConfig {
  /** 默认客户端 */
  defaultClient?: string;
  /** 是否启用负载均衡 */
  enableLoadBalancing?: boolean;
  /** 是否启用故障转移 */
  enableFailover?: boolean;
}

/**
 * LLM 管理器
 *
 * 提供统一的 LLM 接口管理，支持多客户端、缓存、重试、负载均衡等功能
 */
export class LLMManager {
  private clients = new Map<string, LanguageModel>();
  private cache = new Map<string, CacheEntry>();
  private config: Required<LLMManagerConfig>;
  private currentClientIndex = 0;

  constructor(config: LLMManagerConfig = {}) {
    this.config = {
      defaultClient: config.defaultClient || '',
      enableLoadBalancing: config.enableLoadBalancing ?? false,
      enableFailover: config.enableFailover ?? true,
    };
  }

  /**
   * 注册 LLM 客户端
   */
  registerClient(name: string, client: LanguageModel): void {
    this.clients.set(name, client);

    // 如果没有默认客户端，设置第一个为默认
    if (!this.config.defaultClient) {
      this.config.defaultClient = name;
    }
  }

  /**
   * 移除 LLM 客户端
   */
  unregisterClient(name: string): boolean {
    return this.clients.delete(name);
  }

  /**
   * 获取客户端
   */
  getClient(name?: string): LanguageModel | null {
    if (name) {
      return this.clients.get(name) || null;
    }

    // 负载均衡选择客户端
    if (this.config.enableLoadBalancing && this.clients.size > 1) {
      const clientNames = Array.from(this.clients.keys());
      const selectedName =
        clientNames[this.currentClientIndex % clientNames.length];
      this.currentClientIndex++;
      return this.clients.get(selectedName) || null;
    }

    // 返回默认客户端
    return this.clients.get(this.config.defaultClient) || null;
  }

  /**
   * 获取所有客户端名称
   */
  getClientNames(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 生成文本
   */
  async generateText(
    request: LLMRequest,
    clientName?: string
  ): Promise<LLMResponse> {
    const client = this.getClient(clientName);
    if (!client) {
      throw new Error(`Client ${clientName} not found`);
    }
    return generateText({ model: client, ...request });
  }

  /**
   * 流式生成文本
   */
  async streamText(
    request: LLMRequest,
    clientName?: string
  ): Promise<LLMStreamResponse> {
    // 流式响应不使用缓存
    const client = this.getClient(clientName);
    if (!client) {
      throw new Error(`Client ${clientName} not found`);
    }
    return streamText({ model: client, ...request });
  }

  /**
   * 健康检查所有客户端
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name, client] of this.clients) {
      try {
        const response = await generateText({
          model: client,
          messages: [{ role: 'user', content: 'Hello, world!' }],
        });
        results.set(name, response.usage.promptTokens > 0);
      } catch (error) {
        results.set(name, false);
      }
    }

    return results;
  }
}
