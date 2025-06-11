/**
 * @file purpose: 控制器模块入口点
 *
 * 这个模块负责动作的注册、执行和结果处理。
 * 它是 AI 代理和具体浏览器操作之间的桥梁。
 */

// 临时导出，确保模块结构正确
export const CONTROLLER_MODULE_VERSION = '0.1.0';

/**
 * 动作执行结果接口
 */
export interface ActionResult {
  /** 执行是否成功 */
  success: boolean;
  /** 提取的内容 */
  extractedContent?: string;
  /** 是否包含在记忆中 */
  includeInMemory?: boolean;
  /** 错误信息 */
  error?: string;
}
