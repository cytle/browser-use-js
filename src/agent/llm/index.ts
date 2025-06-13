/**
 * @file purpose: LLM 集成接口模块
 *
 * 这个模块提供与各种大语言模型的统一集成接口，支持 GPT-4o、Claude、Gemini 等主流模型。
 * 实现了统一的 API 接口、错误处理、重试机制和速率限制等功能。
 */

import { generateText, streamText } from 'ai';

/**
 * LLM 提供商枚举
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  CUSTOM = 'custom',
}

/**
 * LLM 请求参数
 */
export type LLMRequest = Omit<Parameters<typeof generateText>[0], 'model'>;

/**
 * LLM 响应结果
 */
export type LLMResponse = ReturnType<typeof generateText>;

/**
 * 流式响应接口
 */
export type LLMStreamResponse = ReturnType<typeof streamText>;

/**
 * LLM 错误类型
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public provider?: LLMProvider
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * 速率限制错误
 */
export class RateLimitError extends LLMError {
  constructor(
    message: string,
    public retryAfter?: number,
    provider?: LLMProvider
  ) {
    super(message, 'RATE_LIMIT', 429, provider);
    this.name = 'RateLimitError';
  }
}

/**
 * API 密钥错误
 */
export class APIKeyError extends LLMError {
  constructor(message: string, provider?: LLMProvider) {
    super(message, 'INVALID_API_KEY', 401, provider);
    this.name = 'APIKeyError';
  }
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始延迟时间（毫秒） */
  initialDelay: number;
  /** 延迟倍数 */
  backoffMultiplier: number;
  /** 最大延迟时间（毫秒） */
  maxDelay: number;
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

// 导出核心类
export { LLMManager } from './manager';
