/**
 * 源文件: browser_use/browser/views.py
 * 功能描述: 定义浏览器相关的视图类型，包括标签页信息、浏览器状态、历史记录和异常类
 */

import { z } from 'zod';
import type { DOMState } from '../dom/views.js';
import type { DOMHistoryElement } from '../dom/history-tree-processor/views.js';

// ================================
// Pydantic Models (使用 Zod)
// ================================

/**
 * 标签页信息
 * 表示浏览器标签页的信息
 */
export const TabInfoSchema = z.object({
  pageId: z.number().int().describe('页面 ID'),
  url: z.string().describe('页面 URL'),
  title: z.string().describe('页面标题'),
  parentPageId: z
    .number()
    .int()
    .optional()
    .describe('包含此弹窗或跨域 iframe 的父页面 ID'),
});

export type TabInfo = z.infer<typeof TabInfoSchema>;

// ================================
// Dataclass Models (使用接口和类)
// ================================

/**
 * 浏览器状态摘要
 * 为 LLM 处理而设计的浏览器当前状态摘要
 */
export interface BrowserStateSummary extends DOMState {
  // 从 DOMState 继承:
  // elementTree: DOMElementNode
  // selectorMap: SelectorMap

  url: string;
  title: string;
  tabs: TabInfo[];
  screenshot?: string | null;
  pixelsAbove?: number;
  pixelsBelow?: number;
  browserErrors?: string[];
}

/**
 * BrowserStateSummary 的实现类
 */
export class BrowserStateSummaryImpl implements BrowserStateSummary {
  public elementTree: any; // 临时使用 any，实际应该是 DOMElementNode
  public selectorMap: any; // 临时使用 any，实际应该是 SelectorMap
  public url: string;
  public title: string;
  public tabs: TabInfo[];
  public screenshot?: string | null = null;
  public pixelsAbove: number = 0;
  public pixelsBelow: number = 0;
  public browserErrors: string[] = [];

  constructor(data: BrowserStateSummary) {
    this.elementTree = data.elementTree;
    this.selectorMap = data.selectorMap;
    this.url = data.url;
    this.title = data.title;
    this.tabs = data.tabs;
    this.screenshot = data.screenshot;
    this.pixelsAbove = data.pixelsAbove || 0;
    this.pixelsBelow = data.pixelsBelow || 0;
    this.browserErrors = data.browserErrors || [];
  }
}

/**
 * 浏览器状态历史
 * 在过去时间点的浏览器状态摘要，用于 LLM 消息历史
 */
export interface BrowserStateHistory {
  url: string;
  title: string;
  tabs: TabInfo[];
  interactedElement: (DOMHistoryElement | null)[] | null[];
  screenshot?: string | null;
}

/**
 * BrowserStateHistory 的实现类
 */
export class BrowserStateHistoryImpl implements BrowserStateHistory {
  public url: string;
  public title: string;
  public tabs: TabInfo[];
  public interactedElement: (DOMHistoryElement | null)[] | null[];
  public screenshot?: string | null = null;

  constructor(data: BrowserStateHistory) {
    this.url = data.url;
    this.title = data.title;
    this.tabs = data.tabs;
    this.interactedElement = data.interactedElement;
    this.screenshot = data.screenshot;
  }

  /**
   * 转换为字典对象
   */
  public toDict(): Record<string, any> {
    return {
      tabs: this.tabs.map(tab => TabInfoSchema.parse(tab)),
      screenshot: this.screenshot,
      interactedElement: this.interactedElement.map(el =>
        el && 'toDict' in el && typeof el.toDict === 'function'
          ? el.toDict()
          : el
      ),
      url: this.url,
      title: this.title,
    };
  }
}

// ================================
// Exception Classes
// ================================

/**
 * 浏览器异常基类
 * 所有浏览器错误的基类
 */
export class BrowserError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'BrowserError';
  }
}

/**
 * URL 不被允许异常
 * 当 URL 不被允许时抛出的错误
 */
export class URLNotAllowedError extends BrowserError {
  constructor(message?: string) {
    super(message);
    this.name = 'URLNotAllowedError';
  }
}

// ================================
// Helper Functions
// ================================

/**
 * 创建标签页信息
 */
export function createTabInfo(
  pageId: number,
  url: string,
  title: string,
  parentPageId?: number
): TabInfo {
  return TabInfoSchema.parse({
    pageId,
    url,
    title,
    parentPageId,
  });
}

/**
 * 验证标签页信息
 */
export function validateTabInfo(data: any): TabInfo {
  return TabInfoSchema.parse(data);
}

/**
 * 创建浏览器状态摘要
 */
export function createBrowserStateSummary(
  data: BrowserStateSummary
): BrowserStateSummaryImpl {
  return new BrowserStateSummaryImpl(data);
}

/**
 * 创建浏览器状态历史
 */
export function createBrowserStateHistory(
  data: BrowserStateHistory
): BrowserStateHistoryImpl {
  return new BrowserStateHistoryImpl(data);
}
