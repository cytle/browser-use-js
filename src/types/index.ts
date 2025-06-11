/**
 * @file purpose: 类型定义模块入口点
 *
 * 这个模块包含了整个项目的核心类型定义，为类型安全提供保障。
 * 所有模块都应该使用这里定义的类型来确保一致性。
 */

// 模块版本
export const TYPES_MODULE_VERSION = '0.1.0';

// ============================================================================
// 通用基础类型
// ============================================================================

/**
 * 通用结果类型，用于处理可能失败的操作
 */
export interface Result<T, E = Error> {
  /** 操作是否成功 */
  success: boolean;
  /** 成功时的数据 */
  data?: T;
  /** 失败时的错误信息 */
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

/**
 * 坐标点类型
 */
export interface Point {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
}

/**
 * 矩形区域类型
 */
export interface Rectangle {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

// ============================================================================
// DOM 相关类型
// ============================================================================

/**
 * DOM 元素选择器类型
 */
export type ElementSelector = string | HTMLElement;

/**
 * 元素可见性状态
 */
export enum ElementVisibility {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  PARTIALLY_VISIBLE = 'partially_visible',
  OUT_OF_VIEWPORT = 'out_of_viewport',
}

/**
 * 可交互元素类型
 */
export enum InteractableElementType {
  BUTTON = 'button',
  LINK = 'link',
  INPUT = 'input',
  SELECT = 'select',
  TEXTAREA = 'textarea',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FORM = 'form',
  CUSTOM = 'custom',
}

/**
 * 可交互元素信息
 */
export interface InteractableElement {
  /** 元素引用 */
  element: HTMLElement;
  /** 元素类型 */
  type: InteractableElementType;
  /** 元素选择器 */
  selector: string;
  /** 元素文本内容 */
  text?: string;
  /** 元素位置 */
  bounds: Rectangle;
  /** 可见性状态 */
  visibility: ElementVisibility;
  /** 是否可点击 */
  clickable: boolean;
  /** 元素属性 */
  attributes: Record<string, string>;
}

/**
 * DOM 处理器配置
 */
export interface DOMProcessorConfig extends BaseConfig {
  /** 是否包含隐藏元素 */
  includeHidden?: boolean;
  /** 最大处理元素数量 */
  maxElements?: number;
  /** 是否处理 Shadow DOM */
  includeShadowDOM?: boolean;
}

/**
 * DOM 核心处理器选项
 */
export interface ProcessorOptions {
  /** 最大遍历深度 */
  maxDepth: number;
  /** 是否启用缓存 */
  enableCache: boolean;
  /** 是否包含 Shadow DOM */
  includeShadowDOM: boolean;
  /** 性能模式（跳过一些昂贵的检查） */
  performanceMode: boolean;
}

/**
 * 元素信息接口
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
  /** CSS 选择器 */
  selector: string;
  /** 元素位置信息 */
  position: Rectangle;
  /** 相关属性 */
  attributes: Record<string, string>;
  /** ARIA 角色 */
  role: string;
  /** ARIA 标签 */
  ariaLabel?: string;
}

/**
 * 选择器信息接口
 */
export interface SelectorInfo {
  /** CSS 选择器 */
  selector: string;
  /** 选择器类型 */
  type: 'id' | 'class' | 'attribute' | 'path' | 'xpath';
  /** 选择器优先级 */
  priority: number;
  /** 是否唯一 */
  unique: boolean;
}

/**
 * DOM 分析结果接口
 */
export interface DOMAnalysisResult {
  /** 总元素数量 */
  totalElements: number;
  /** 可交互元素数量 */
  interactiveElements: number;
  /** 可见元素数量 */
  visibleElements: number;
  /** 所有元素信息 */
  elements: ElementInfo[];
  /** 页面结构分析 */
  structure: PageStructure;
  /** 处理时间（毫秒） */
  processingTime: number;
}

/**
 * 页面结构接口
 */
export interface PageStructure {
  /** 页面地标 */
  landmarks: ElementInfo[];
  /** 标题元素 */
  headings: ElementInfo[];
  /** 表单元素 */
  forms: ElementInfo[];
  /** 导航元素 */
  navigation: ElementInfo[];
}

// ============================================================================
// 浏览器交互类型
// ============================================================================

/**
 * 鼠标按钮类型
 */
export enum MouseButton {
  LEFT = 'left',
  RIGHT = 'right',
  MIDDLE = 'middle',
}

/**
 * 键盘修饰键
 */
export interface KeyboardModifiers {
  /** Ctrl 键 */
  ctrl?: boolean;
  /** Alt 键 */
  alt?: boolean;
  /** Shift 键 */
  shift?: boolean;
  /** Meta 键 (Cmd/Win) */
  meta?: boolean;
}

/**
 * 点击选项
 */
export interface ClickOptions {
  /** 鼠标按钮 */
  button?: MouseButton;
  /** 点击次数 */
  clickCount?: number;
  /** 键盘修饰键 */
  modifiers?: KeyboardModifiers;
  /** 点击位置偏移 */
  offset?: Point;
  /** 是否强制点击 */
  force?: boolean;
}

/**
 * 输入选项
 */
export interface TypeOptions {
  /** 输入延迟（毫秒） */
  delay?: number;
  /** 是否清空现有内容 */
  clear?: boolean;
  /** 键盘修饰键 */
  modifiers?: KeyboardModifiers;
}

/**
 * 滚动选项
 */
export interface ScrollOptions {
  /** 滚动行为 */
  behavior?: 'auto' | 'smooth';
  /** 滚动到的位置 */
  block?: 'start' | 'center' | 'end' | 'nearest';
  /** 水平滚动位置 */
  inline?: 'start' | 'center' | 'end' | 'nearest';
}

/**
 * 浏览器状态
 */
export interface BrowserState {
  /** 当前 URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** 页面加载状态 */
  loading: boolean;
  /** 是否可以后退 */
  canGoBack: boolean;
  /** 是否可以前进 */
  canGoForward: boolean;
  /** 视口大小 */
  viewport: Rectangle;
}

// ============================================================================
// 动作系统类型
// ============================================================================

/**
 * 动作类型枚举
 */
export enum ActionType {
  CLICK = 'click',
  TYPE = 'type',
  SCROLL = 'scroll',
  NAVIGATE = 'navigate',
  WAIT = 'wait',
  SCREENSHOT = 'screenshot',
  EXTRACT = 'extract',
  CUSTOM = 'custom',
}

/**
 * 动作参数基础接口
 */
export interface BaseActionParams {
  /** 动作类型 */
  type: ActionType;
  /** 动作描述 */
  description?: string;
}

/**
 * 点击动作参数
 */
export interface ClickActionParams extends BaseActionParams {
  type: ActionType.CLICK;
  /** 目标元素选择器 */
  selector: ElementSelector;
  /** 点击选项 */
  options?: ClickOptions;
}

/**
 * 输入动作参数
 */
export interface TypeActionParams extends BaseActionParams {
  type: ActionType.TYPE;
  /** 目标元素选择器 */
  selector: ElementSelector;
  /** 输入文本 */
  text: string;
  /** 输入选项 */
  options?: TypeOptions;
}

/**
 * 滚动动作参数
 */
export interface ScrollActionParams extends BaseActionParams {
  type: ActionType.SCROLL;
  /** 目标元素选择器（可选，默认为页面） */
  selector?: ElementSelector;
  /** 滚动距离或目标位置 */
  target: Point | 'top' | 'bottom';
  /** 滚动选项 */
  options?: ScrollOptions;
}

/**
 * 导航动作参数
 */
export interface NavigateActionParams extends BaseActionParams {
  type: ActionType.NAVIGATE;
  /** 目标 URL */
  url: string;
  /** 等待加载完成 */
  waitForLoad?: boolean;
}

/**
 * 等待动作参数
 */
export interface WaitActionParams extends BaseActionParams {
  type: ActionType.WAIT;
  /** 等待时间（毫秒）或条件 */
  condition: number | string | (() => boolean | Promise<boolean>);
}

/**
 * 截图动作参数
 */
export interface ScreenshotActionParams extends BaseActionParams {
  type: ActionType.SCREENSHOT;
  /** 截图区域（可选，默认全屏） */
  clip?: Rectangle;
  /** 截图质量 */
  quality?: number;
}

/**
 * 提取动作参数
 */
export interface ExtractActionParams extends BaseActionParams {
  type: ActionType.EXTRACT;
  /** 提取目标 */
  target: 'text' | 'html' | 'attributes' | 'links';
  /** 目标元素选择器（可选） */
  selector?: ElementSelector;
}

/**
 * 自定义动作参数
 */
export interface CustomActionParams extends BaseActionParams {
  type: ActionType.CUSTOM;
  /** 自定义动作名称 */
  name: string;
  /** 自定义参数 */
  params: Record<string, unknown>;
}

/**
 * 动作参数联合类型
 */
export type ActionParams =
  | ClickActionParams
  | TypeActionParams
  | ScrollActionParams
  | NavigateActionParams
  | WaitActionParams
  | ScreenshotActionParams
  | ExtractActionParams
  | CustomActionParams;

/**
 * 动作执行结果
 */
export interface ActionResult {
  /** 执行是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 提取的内容 */
  extractedContent?: unknown;
  /** 是否包含在记忆中 */
  includeInMemory?: boolean;
  /** 执行时间（毫秒） */
  duration?: number;
  /** 截图数据 */
  screenshot?: string;
  /** 额外数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 动作处理函数类型
 */
export type ActionHandler<T extends ActionParams = ActionParams> = (
  params: T
) => Promise<ActionResult>;

// ============================================================================
// AI 代理类型
// ============================================================================

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

/**
 * LLM 模型类型
 */
export enum LLMModelType {
  GPT_4O = 'gpt-4o',
  GPT_4 = 'gpt-4',
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  GEMINI_PRO = 'gemini-pro',
}

/**
 * LLM 配置
 */
export interface LLMConfig {
  /** 模型类型 */
  model: LLMModelType;
  /** API 密钥 */
  apiKey: string;
  /** API 基础 URL */
  baseURL?: string;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 温度参数 */
  temperature?: number;
  /** 超时时间 */
  timeout?: number;
}

/**
 * 消息角色
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * LLM 消息
 */
export interface LLMMessage {
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 消息时间戳 */
  timestamp?: number;
  /** 消息元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 记忆项
 */
export interface MemoryItem {
  /** 记忆 ID */
  id: string;
  /** 记忆内容 */
  content: string;
  /** 记忆类型 */
  type: 'observation' | 'action' | 'result' | 'goal';
  /** 重要性评分 */
  importance: number;
  /** 创建时间 */
  timestamp: number;
  /** 相关标签 */
  tags?: string[];
}

/**
 * 代理配置
 */
export interface AgentConfig extends BaseConfig {
  /** LLM 配置 */
  llm: LLMConfig;
  /** 最大步骤数 */
  maxSteps?: number;
  /** 最大记忆项数 */
  maxMemoryItems?: number;
  /** 是否启用截图 */
  enableScreenshots?: boolean;
  /** 自定义系统提示 */
  systemPrompt?: string;
}

/**
 * 任务状态
 */
export interface TaskState {
  /** 任务 ID */
  id: string;
  /** 任务描述 */
  description: string;
  /** 当前状态 */
  status: AgentStatus;
  /** 当前步骤 */
  currentStep: number;
  /** 总步骤数 */
  totalSteps?: number;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 错误信息 */
  error?: string;
}

// ============================================================================
// 控制器类型
// ============================================================================

/**
 * 控制器配置
 */
export interface ControllerConfig extends BaseConfig {
  /** DOM 处理器配置 */
  domProcessor?: DOMProcessorConfig;
  /** 浏览器配置 */
  browser?: BrowserConfig;
}

/**
 * 浏览器配置
 */
export interface BrowserConfig {
  /** 视口大小 */
  viewport?: {
    width: number;
    height: number;
  };
  /** 用户代理 */
  userAgent?: string;
  /** 是否启用 JavaScript */
  javascript?: boolean;
  /** 是否启用图片 */
  images?: boolean;
}

/**
 * 动作注册表接口
 */
export interface IActionRegistry {
  /**
   * 注册动作
   * @param name 动作名称
   * @param handler 动作处理函数
   * @param description 动作描述
   */
  register<T extends ActionParams>(
    name: string,
    handler: ActionHandler<T>,
    description?: string
  ): void;

  /**
   * 执行动作
   * @param name 动作名称
   * @param params 动作参数
   */
  execute(name: string, params: ActionParams): Promise<ActionResult>;

  /**
   * 获取所有已注册的动作
   */
  getActions(): Record<
    string,
    {
      handler: ActionHandler;
      description?: string;
    }
  >;

  /**
   * 检查动作是否已注册
   * @param name 动作名称
   */
  hasAction(name: string): boolean;
}

// ============================================================================
// 事件系统类型
// ============================================================================

/**
 * 事件类型
 */
export enum EventType {
  AGENT_STATUS_CHANGED = 'agent_status_changed',
  ACTION_STARTED = 'action_started',
  ACTION_COMPLETED = 'action_completed',
  ACTION_FAILED = 'action_failed',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  MEMORY_UPDATED = 'memory_updated',
  ERROR_OCCURRED = 'error_occurred',
}

/**
 * 事件数据基础接口
 */
export interface BaseEventData {
  /** 事件时间戳 */
  timestamp: number;
  /** 事件源 */
  source?: string;
}

/**
 * 代理状态变更事件数据
 */
export interface AgentStatusChangedEventData extends BaseEventData {
  /** 旧状态 */
  oldStatus: AgentStatus;
  /** 新状态 */
  newStatus: AgentStatus;
  /** 任务 ID */
  taskId?: string;
}

/**
 * 动作事件数据
 */
export interface ActionEventData extends BaseEventData {
  /** 动作名称 */
  actionName: string;
  /** 动作参数 */
  params: ActionParams;
  /** 动作结果（仅在完成时） */
  result?: ActionResult;
  /** 错误信息（仅在失败时） */
  error?: string;
}

/**
 * 任务事件数据
 */
export interface TaskEventData extends BaseEventData {
  /** 任务状态 */
  taskState: TaskState;
  /** 错误信息（仅在失败时） */
  error?: string;
}

/**
 * 记忆更新事件数据
 */
export interface MemoryUpdatedEventData extends BaseEventData {
  /** 新增的记忆项 */
  newItems: MemoryItem[];
  /** 总记忆项数 */
  totalItems: number;
}

/**
 * 错误事件数据
 */
export interface ErrorEventData extends BaseEventData {
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 错误上下文 */
  context?: Record<string, unknown>;
}

/**
 * 事件数据联合类型
 */
export type EventData =
  | AgentStatusChangedEventData
  | ActionEventData
  | TaskEventData
  | MemoryUpdatedEventData
  | ErrorEventData;

/**
 * 事件监听器类型
 */
export type EventListener<T extends EventData = EventData> = (
  data: T
) => void | Promise<void>;

/**
 * 事件发射器接口
 */
export interface IEventEmitter {
  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  on<T extends EventData>(event: EventType, listener: EventListener<T>): void;

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  off<T extends EventData>(event: EventType, listener: EventListener<T>): void;

  /**
   * 发射事件
   * @param event 事件类型
   * @param data 事件数据
   */
  emit<T extends EventData>(event: EventType, data: T): void;
}

// ============================================================================
// 类型定义完成
// ============================================================================

// 所有类型已在上方定义并导出，可以直接使用

/**
 * 交互能力类型
 */
export type InteractionCapability =
  | 'click'
  | 'type'
  | 'focus'
  | 'blur'
  | 'check'
  | 'uncheck'
  | 'select'
  | 'navigate'
  | 'drag'
  | 'context-menu';

/**
 * 可点击性分析结果
 */
export interface ClickabilityAnalysis {
  /** 是否可点击 */
  isClickable: boolean;
  /** 置信度 (0-1) */
  confidence: number;
  /** 判断原因 */
  reasons: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 可点击元素信息接口
 */
export interface ClickableElementInfo extends ElementInfo {
  /** DOM 元素引用 */
  element: Element;
  /** 可点击区域信息 */
  clickableArea: {
    width: number;
    height: number;
    area: number;
    center: { x: number; y: number };
  };
  /** 交互类型 */
  interactionType: string;
  /** 交互能力列表 */
  capabilities: InteractionCapability[];
  /** 可访问性信息 */
  accessibility: {
    hasLabel: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    tabIndex?: number;
    role?: string;
  };
  /** 检测到的框架 */
  framework?: string;
  /** 是否可见 */
  visible: boolean;
  /** 是否启用 */
  enabled: boolean;
  /** 可点击性分析结果 */
  analysis: ClickabilityAnalysis;
}
