/**
 * 源文件: browser_use/dom/history_tree_processor/view.py
 * 功能描述: 定义历史树处理器相关的视图类型，包括哈希元素、坐标、视口信息等
 */

import { z } from 'zod';

/**
 * DOM 元素哈希
 * 用作唯一标识符的 DOM 元素哈希
 */
export interface HashedDomElement {
  branchPathHash: string;
  attributesHash: string;
  xpathHash: string;
  // textHash: string; // 注释掉的字段
}

/**
 * 坐标类
 */
export const CoordinatesSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

/**
 * 坐标集合类
 * 包含元素的各个角落和中心的坐标信息
 */
export const CoordinateSetSchema = z.object({
  topLeft: CoordinatesSchema,
  topRight: CoordinatesSchema,
  bottomLeft: CoordinatesSchema,
  bottomRight: CoordinatesSchema,
  center: CoordinatesSchema,
  width: z.number().int(),
  height: z.number().int(),
});

export type CoordinateSet = z.infer<typeof CoordinateSetSchema>;

/**
 * 视口信息类
 * 包含视口的滚动位置和尺寸信息
 */
export const ViewportInfoSchema = z.object({
  scrollX: z.number().int().optional().default(0),
  scrollY: z.number().int().optional().default(0),
  width: z.number().int(),
  height: z.number().int(),
});

export type ViewportInfo = z.infer<typeof ViewportInfoSchema>;

/**
 * DOM 历史元素类
 * 用于存储 DOM 元素的历史信息
 */
export interface DOMHistoryElement {
  tagName: string;
  xpath: string;
  highlightIndex: number | null;
  entireParentBranchPath: string[];
  attributes: Record<string, string>;
  shadowRoot: boolean;
  cssSelector: string | null;
  pageCoordinates: CoordinateSet | null;
  viewportCoordinates: CoordinateSet | null;
  viewportInfo: ViewportInfo | null;
}

/**
 * DOMHistoryElement 的辅助类，提供序列化方法
 */
export class DOMHistoryElementImpl implements DOMHistoryElement {
  public tagName: string;
  public xpath: string;
  public highlightIndex: number | null;
  public entireParentBranchPath: string[];
  public attributes: Record<string, string>;
  public shadowRoot: boolean = false;
  public cssSelector: string | null = null;
  public pageCoordinates: CoordinateSet | null = null;
  public viewportCoordinates: CoordinateSet | null = null;
  public viewportInfo: ViewportInfo | null = null;

  constructor(data: DOMHistoryElement) {
    this.tagName = data.tagName;
    this.xpath = data.xpath;
    this.highlightIndex = data.highlightIndex;
    this.entireParentBranchPath = data.entireParentBranchPath;
    this.attributes = data.attributes;
    this.shadowRoot = data.shadowRoot;
    this.cssSelector = data.cssSelector;
    this.pageCoordinates = data.pageCoordinates;
    this.viewportCoordinates = data.viewportCoordinates;
    this.viewportInfo = data.viewportInfo;
  }

  /**
   * 转换为字典对象
   */
  public toDict(): Record<string, any> {
    return {
      tagName: this.tagName,
      xpath: this.xpath,
      highlightIndex: this.highlightIndex,
      entireParentBranchPath: this.entireParentBranchPath,
      attributes: this.attributes,
      shadowRoot: this.shadowRoot,
      cssSelector: this.cssSelector,
      pageCoordinates: this.pageCoordinates,
      viewportCoordinates: this.viewportCoordinates,
      viewportInfo: this.viewportInfo,
    };
  }
}
