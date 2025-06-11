/**
 * @file purpose: 类型定义模块入口点
 *
 * 这个模块包含了整个项目的核心类型定义，为类型安全提供保障。
 * 所有模块都应该使用这里定义的类型来确保一致性。
 */

// 临时导出，确保模块结构正确
export const TYPES_MODULE_VERSION = '0.1.0';

/**
 * 通用结果类型
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * 配置基础接口
 */
export interface BaseConfig {
  /** 调试模式 */
  debug?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}
