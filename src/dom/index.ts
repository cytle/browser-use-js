/**
 * @file purpose: DOM 处理模块入口点
 *
 * 这个模块负责 DOM 树的分析、元素识别和页面结构理解。
 * 它为 AI 代理提供了理解和操作网页结构的能力。
 */

// 临时导出，确保模块结构正确
export const DOM_MODULE_VERSION = '0.1.0';

/**
 * DOM 元素信息接口
 */
export interface ElementInfo {
  /** 元素标签名 */
  tagName: string;
  /** 元素 ID */
  id?: string;
  /** CSS 类名 */
  className?: string;
  /** 元素文本内容 */
  textContent?: string;
  /** 是否可见 */
  visible: boolean;
  /** 是否可交互 */
  interactive: boolean;
}
