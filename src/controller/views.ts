/**
 * 源文件: browser_use/controller/views.py
 * 功能描述: 定义所有动作类型，用于浏览器自动化控制
 */

import { z } from 'zod';

// ================================
// Action Input Models
// ================================

/**
 * 搜索 Google 动作
 */
export const SearchGoogleActionSchema = z.object({
  query: z.string().describe('要搜索的查询字符串'),
});

export type SearchGoogleAction = z.infer<typeof SearchGoogleActionSchema>;

/**
 * 访问 URL 动作
 */
export const GoToUrlActionSchema = z.object({
  url: z.string().url().describe('要访问的 URL'),
});

export type GoToUrlAction = z.infer<typeof GoToUrlActionSchema>;

/**
 * 点击元素动作
 */
export const ClickElementActionSchema = z.object({
  index: z.number().int().describe('要点击的元素索引'),
  xpath: z.string().optional().describe('元素的 XPath（可选）'),
});

export type ClickElementAction = z.infer<typeof ClickElementActionSchema>;

/**
 * 输入文本动作
 */
export const InputTextActionSchema = z.object({
  index: z.number().int().describe('要输入文本的元素索引'),
  text: z.string().describe('要输入的文本内容'),
  xpath: z.string().optional().describe('元素的 XPath（可选）'),
});

export type InputTextAction = z.infer<typeof InputTextActionSchema>;

/**
 * 完成动作
 */
export const DoneActionSchema = z.object({
  text: z.string().describe('完成时的描述文本'),
  success: z.boolean().describe('任务是否成功完成'),
  filesToDisplay: z
    .array(z.string())
    .optional()
    .default([])
    .describe('要显示的文件列表'),
});

export type DoneAction = z.infer<typeof DoneActionSchema>;

/**
 * 切换标签页动作
 */
export const SwitchTabActionSchema = z.object({
  pageId: z.number().int().describe('要切换到的页面 ID'),
});

export type SwitchTabAction = z.infer<typeof SwitchTabActionSchema>;

/**
 * 打开新标签页动作
 */
export const OpenTabActionSchema = z.object({
  url: z.string().url().describe('在新标签页中打开的 URL'),
});

export type OpenTabAction = z.infer<typeof OpenTabActionSchema>;

/**
 * 关闭标签页动作
 */
export const CloseTabActionSchema = z.object({
  pageId: z.number().int().describe('要关闭的页面 ID'),
});

export type CloseTabAction = z.infer<typeof CloseTabActionSchema>;

/**
 * 滚动动作
 */
export const ScrollActionSchema = z.object({
  amount: z
    .number()
    .int()
    .optional()
    .describe('要滚动的像素数。如果为 null，则向下/向上滚动一页'),
});

export type ScrollAction = z.infer<typeof ScrollActionSchema>;

/**
 * 发送按键动作
 */
export const SendKeysActionSchema = z.object({
  keys: z.string().describe('要发送的按键序列'),
});

export type SendKeysAction = z.infer<typeof SendKeysActionSchema>;

/**
 * 提取页面内容动作
 */
export const ExtractPageContentActionSchema = z.object({
  value: z.string().describe('要提取的内容标识符'),
});

export type ExtractPageContentAction = z.infer<
  typeof ExtractPageContentActionSchema
>;

/**
 * 无参数动作
 * 接受任何传入数据并丢弃它，使最终解析的模型为空
 */
export const NoParamsActionSchema = z.object({}).passthrough();

export type NoParamsAction = z.infer<typeof NoParamsActionSchema>;

/**
 * 位置坐标
 */
export const PositionSchema = z.object({
  x: z.number().int().describe('X 坐标'),
  y: z.number().int().describe('Y 坐标'),
});

export type Position = z.infer<typeof PositionSchema>;

/**
 * 拖拽动作
 */
export const DragDropActionSchema = z.object({
  // 基于元素的方式
  elementSource: z
    .string()
    .optional()
    .describe('要拖拽的元素的 CSS 选择器或 XPath'),
  elementTarget: z
    .string()
    .optional()
    .describe('要拖放到的元素的 CSS 选择器或 XPath'),
  elementSourceOffset: PositionSchema.optional().describe(
    '源元素内开始拖拽的精确位置（从左上角开始的像素偏移）'
  ),
  elementTargetOffset: PositionSchema.optional().describe(
    '目标元素内放置的精确位置（从左上角开始的像素偏移）'
  ),

  // 基于坐标的方式（如果未提供选择器则使用）
  coordSourceX: z
    .number()
    .int()
    .optional()
    .describe('页面上开始拖拽的绝对 X 坐标（像素）'),
  coordSourceY: z
    .number()
    .int()
    .optional()
    .describe('页面上开始拖拽的绝对 Y 坐标（像素）'),
  coordTargetX: z
    .number()
    .int()
    .optional()
    .describe('页面上放置的绝对 X 坐标（像素）'),
  coordTargetY: z
    .number()
    .int()
    .optional()
    .describe('页面上放置的绝对 Y 坐标（像素）'),

  // 通用选项
  steps: z
    .number()
    .int()
    .optional()
    .default(10)
    .describe('平滑移动的中间点数量（推荐 5-20）'),
  delayMs: z
    .number()
    .int()
    .optional()
    .default(5)
    .describe('步骤间的延迟毫秒数（0 最快，10-20 更自然）'),
});

export type DragDropAction = z.infer<typeof DragDropActionSchema>;

// ================================
// Action Union Types
// ================================

/**
 * 所有可用的动作类型联合
 */
export type BrowserAction =
  | SearchGoogleAction
  | GoToUrlAction
  | ClickElementAction
  | InputTextAction
  | DoneAction
  | SwitchTabAction
  | OpenTabAction
  | CloseTabAction
  | ScrollAction
  | SendKeysAction
  | ExtractPageContentAction
  | NoParamsAction
  | DragDropAction;

/**
 * 动作类型名称枚举
 */
export enum ActionType {
  SEARCH_GOOGLE = 'search_google',
  GO_TO_URL = 'go_to_url',
  CLICK_ELEMENT = 'click_element',
  INPUT_TEXT = 'input_text',
  DONE = 'done',
  SWITCH_TAB = 'switch_tab',
  OPEN_TAB = 'open_tab',
  CLOSE_TAB = 'close_tab',
  SCROLL = 'scroll',
  SEND_KEYS = 'send_keys',
  EXTRACT_PAGE_CONTENT = 'extract_page_content',
  NO_PARAMS = 'no_params',
  DRAG_DROP = 'drag_drop',
}

/**
 * 动作模式映射
 */
export const ActionSchemaMap = {
  [ActionType.SEARCH_GOOGLE]: SearchGoogleActionSchema,
  [ActionType.GO_TO_URL]: GoToUrlActionSchema,
  [ActionType.CLICK_ELEMENT]: ClickElementActionSchema,
  [ActionType.INPUT_TEXT]: InputTextActionSchema,
  [ActionType.DONE]: DoneActionSchema,
  [ActionType.SWITCH_TAB]: SwitchTabActionSchema,
  [ActionType.OPEN_TAB]: OpenTabActionSchema,
  [ActionType.CLOSE_TAB]: CloseTabActionSchema,
  [ActionType.SCROLL]: ScrollActionSchema,
  [ActionType.SEND_KEYS]: SendKeysActionSchema,
  [ActionType.EXTRACT_PAGE_CONTENT]: ExtractPageContentActionSchema,
  [ActionType.NO_PARAMS]: NoParamsActionSchema,
  [ActionType.DRAG_DROP]: DragDropActionSchema,
} as const;

/**
 * 带类型的动作
 */
export interface TypedAction<T extends ActionType = ActionType> {
  type: T;
  data: T extends keyof typeof ActionSchemaMap
    ? z.infer<(typeof ActionSchemaMap)[T]>
    : never;
}

/**
 * 动作执行结果
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}
