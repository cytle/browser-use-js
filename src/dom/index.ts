/**
 * @file purpose: DOM 处理模块入口点
 *
 * 这个模块负责 DOM 树的分析、元素识别和页面结构理解。
 * 它为 AI 代理提供了理解和操作网页结构的能力。
 */

// 导出核心处理器
export { DOMCoreProcessor } from './core-processor';

// 导出类型定义
export type {
  ElementInfo,
  SelectorInfo,
  DOMAnalysisResult,
  PageStructure,
  ProcessorOptions,
} from '../types';

// 模块版本
export const DOM_MODULE_VERSION = '0.1.0';
