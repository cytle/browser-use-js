/**
 * @file purpose: AI 代理模块入口点
 *
 * 这个文件是 AI 代理模块的主要入口点，负责导出所有代理相关的功能。
 * AI 代理是整个系统的核心，负责理解任务、制定计划并执行网页交互。
 */

// 临时导出，确保模块结构正确
export const AGENT_MODULE_VERSION = '0.1.0';

/**
 * AI 代理模块配置接口
 */
export interface AgentConfig {
  /** LLM 模型配置 */
  model?: string;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 任务超时时间（毫秒） */
  timeout?: number;
}

/**
 * 代理状态枚举
 */
export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  ACTING = 'acting',
  COMPLETED = 'completed',
  ERROR = 'error',
}
