/**
 * DOM 模块导出
 */

export * from './views.js';
export * from './service.js';

// 简单的ViewportInfo类型定义
export interface ViewportInfo {
  width: number;
  height: number;
  scrollX?: number;
  scrollY?: number;
}
