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
export interface BrowserConfig extends BaseConfig {
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
// 历史树处理器相关类型
// ============================================================================

/**
 * DOM 变更类型
 */
export enum DOMChangeType {
  /** 节点添加 */
  NODE_ADDED = 'node_added',
  /** 节点移除 */
  NODE_REMOVED = 'node_removed',
  /** 属性变更 */
  ATTRIBUTE_CHANGED = 'attribute_changed',
  /** 文本内容变更 */
  TEXT_CHANGED = 'text_changed',
  /** 样式变更 */
  STYLE_CHANGED = 'style_changed',
}

/**
 * DOM 变更记录
 */
export interface DOMChangeRecord {
  /** 变更 ID */
  id: string;
  /** 变更类型 */
  type: DOMChangeType;
  /** 目标元素选择器 */
  targetSelector: string;
  /** 变更时间戳 */
  timestamp: number;
  /** 变更前的值 */
  oldValue?: string;
  /** 变更后的值 */
  newValue?: string;
  /** 变更的属性名（仅属性变更时） */
  attributeName?: string;
  /** 相关的父元素选择器 */
  parentSelector?: string;
  /** 变更描述 */
  description?: string;
}

/**
 * DOM 状态快照
 */
export interface DOMSnapshot {
  /** 快照 ID */
  id: string;
  /** 快照时间戳 */
  timestamp: number;
  /** 快照描述 */
  description?: string;
  /** 页面 URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** DOM 结构哈希 */
  structureHash: string;
  /** 关键元素状态 */
  keyElements: Array<{
    selector: string;
    tagName: string;
    attributes: Record<string, string>;
    textContent?: string;
    visible: boolean;
  }>;
  /** 快照大小（字节） */
  size: number;
}

/**
 * 历史树节点
 */
export interface HistoryTreeNode {
  /** 节点 ID */
  id: string;
  /** 父节点 ID */
  parentId?: string;
  /** 子节点 ID 列表 */
  childrenIds: string[];
  /** 关联的快照 */
  snapshot: DOMSnapshot;
  /** 导致此状态的变更记录 */
  changes: DOMChangeRecord[];
  /** 节点深度 */
  depth: number;
  /** 是否为叶子节点 */
  isLeaf: boolean;
}

/**
 * 历史树配置
 */
export interface HistoryTreeConfig extends BaseConfig {
  /** 最大历史记录数 */
  maxHistorySize?: number;
  /** 最大快照数 */
  maxSnapshots?: number;
  /** 自动清理阈值 */
  autoCleanupThreshold?: number;
  /** 是否启用压缩 */
  enableCompression?: boolean;
  /** 快照间隔（毫秒） */
  snapshotInterval?: number;
  /** 是否监听所有变更 */
  observeAllChanges?: boolean;
  /** 忽略的元素选择器 */
  ignoreSelectors?: string[];
}

/**
 * 历史树统计信息
 */
export interface HistoryTreeStats {
  /** 总节点数 */
  totalNodes: number;
  /** 总快照数 */
  totalSnapshots: number;
  /** 总变更记录数 */
  totalChanges: number;
  /** 内存使用量（字节） */
  memoryUsage: number;
  /** 最早记录时间 */
  earliestTimestamp: number;
  /** 最新记录时间 */
  latestTimestamp: number;
  /** 平均节点深度 */
  averageDepth: number;
}

/**
 * 回滚选项
 */
export interface RollbackOptions {
  /** 目标快照 ID 或时间戳 */
  target: string | number;
  /** 是否验证回滚 */
  validate?: boolean;
  /** 回滚超时时间 */
  timeout?: number;
  /** 是否创建回滚前快照 */
  createSnapshot?: boolean;
}

/**
 * 回滚结果
 */
export interface RollbackResult {
  /** 回滚是否成功 */
  success: boolean;
  /** 目标快照 */
  targetSnapshot?: DOMSnapshot;
  /** 回滚前快照 */
  beforeSnapshot?: DOMSnapshot;
  /** 应用的变更数量 */
  appliedChanges: number;
  /** 回滚耗时（毫秒） */
  duration: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 历史树处理器接口
 */
export interface IHistoryTreeProcessor {
  /**
   * 开始监听 DOM 变更
   */
  startObserving(): void;

  /**
   * 停止监听 DOM 变更
   */
  stopObserving(): void;

  /**
   * 创建当前状态快照
   * @param description 快照描述
   */
  createSnapshot(description?: string): Promise<DOMSnapshot>;

  /**
   * 获取历史记录
   * @param limit 限制数量
   */
  getHistory(limit?: number): HistoryTreeNode[];

  /**
   * 获取指定快照
   * @param snapshotId 快照 ID
   */
  getSnapshot(snapshotId: string): DOMSnapshot | undefined;

  /**
   * 回滚到指定状态
   * @param options 回滚选项
   */
  rollback(options: RollbackOptions): Promise<RollbackResult>;

  /**
   * 清理历史记录
   * @param beforeTimestamp 清理此时间戳之前的记录
   */
  cleanup(beforeTimestamp?: number): Promise<void>;

  /**
   * 获取统计信息
   */
  getStats(): HistoryTreeStats;

  /**
   * 导出历史数据
   */
  exportHistory(): Promise<string>;

  /**
   * 导入历史数据
   * @param data 历史数据
   */
  importHistory(data: string): Promise<void>;
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

// ============================================================================
// Iframe 沙盒系统类型
// ============================================================================

/**
 * Iframe 沙盒权限枚举
 */
export enum IframeSandboxPermission {
  /** 允许表单提交 */
  ALLOW_FORMS = 'allow-forms',
  /** 允许模态窗口 */
  ALLOW_MODALS = 'allow-modals',
  /** 允许方向锁定 */
  ALLOW_ORIENTATION_LOCK = 'allow-orientation-lock',
  /** 允许指针锁定 */
  ALLOW_POINTER_LOCK = 'allow-pointer-lock',
  /** 允许弹窗 */
  ALLOW_POPUPS = 'allow-popups',
  /** 允许弹窗逃逸沙盒 */
  ALLOW_POPUPS_TO_ESCAPE_SANDBOX = 'allow-popups-to-escape-sandbox',
  /** 允许展示 */
  ALLOW_PRESENTATION = 'allow-presentation',
  /** 允许同源 */
  ALLOW_SAME_ORIGIN = 'allow-same-origin',
  /** 允许脚本 */
  ALLOW_SCRIPTS = 'allow-scripts',
  /** 允许存储访问 */
  ALLOW_STORAGE_ACCESS_BY_USER_ACTIVATION = 'allow-storage-access-by-user-activation',
  /** 允许顶级导航 */
  ALLOW_TOP_NAVIGATION = 'allow-top-navigation',
  /** 允许顶级导航（用户激活） */
  ALLOW_TOP_NAVIGATION_BY_USER_ACTIVATION = 'allow-top-navigation-by-user-activation',
}

/**
 * Iframe 状态枚举
 */
export enum IframeStatus {
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 加载中 */
  LOADING = 'loading',
  /** 已就绪 */
  READY = 'ready',
  /** 错误状态 */
  ERROR = 'error',
  /** 已销毁 */
  DESTROYED = 'destroyed',
}

/**
 * Iframe 配置接口
 */
export interface IframeConfig extends BaseConfig {
  /** Iframe ID */
  id?: string;
  /** 目标 URL */
  url: string;
  /** 沙盒权限 */
  sandbox?: IframeSandboxPermission[];
  /** 宽度 */
  width?: number | string;
  /** 高度 */
  height?: number | string;
  /** 是否允许全屏 */
  allowFullscreen?: boolean;
  /** 加载超时时间（毫秒） */
  loadTimeout?: number;
  /** 自定义样式 */
  style?: Partial<CSSStyleDeclaration>;
  /** 自定义属性 */
  attributes?: Record<string, string>;
  /** 是否隐藏 */
  hidden?: boolean;
}

/**
 * Iframe 实例信息
 */
export interface IframeInstance {
  /** 实例 ID */
  id: string;
  /** Iframe 元素 */
  element: HTMLIFrameElement;
  /** 配置信息 */
  config: IframeConfig;
  /** 当前状态 */
  status: IframeStatus;
  /** 创建时间 */
  createdAt: number;
  /** 最后活动时间 */
  lastActivity: number;
  /** 错误信息 */
  error?: string;
  /** 是否已建立通信 */
  communicationEstablished: boolean;
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 握手消息 */
  HANDSHAKE = 'handshake',
  /** 握手响应 */
  HANDSHAKE_RESPONSE = 'handshake_response',
  /** DOM 操作 */
  DOM_OPERATION = 'dom_operation',
  /** DOM 操作响应 */
  DOM_OPERATION_RESPONSE = 'dom_operation_response',
  /** 事件通知 */
  EVENT_NOTIFICATION = 'event_notification',
  /** 错误报告 */
  ERROR_REPORT = 'error_report',
  /** 心跳检测 */
  HEARTBEAT = 'heartbeat',
  /** 心跳响应 */
  HEARTBEAT_RESPONSE = 'heartbeat_response',
  /** 自定义消息 */
  CUSTOM = 'custom',
}

/**
 * 消息基础接口
 */
export interface BaseMessage {
  /** 消息 ID */
  id: string;
  /** 消息类型 */
  type: MessageType;
  /** 时间戳 */
  timestamp: number;
  /** 源 Iframe ID */
  sourceId?: string;
  /** 目标 Iframe ID */
  targetId?: string;
}

/**
 * DOM 操作类型枚举
 */
export enum DOMOperationType {
  /** 查询元素 */
  QUERY_ELEMENT = 'query_element',
  /** 点击元素 */
  CLICK_ELEMENT = 'click_element',
  /** 输入文本 */
  TYPE_TEXT = 'type_text',
  /** 获取元素信息 */
  GET_ELEMENT_INFO = 'get_element_info',
  /** 滚动页面 */
  SCROLL_PAGE = 'scroll_page',
  /** 获取页面信息 */
  GET_PAGE_INFO = 'get_page_info',
  /** 执行脚本 */
  EXECUTE_SCRIPT = 'execute_script',
  /** 截图 */
  TAKE_SCREENSHOT = 'take_screenshot',
}

/**
 * DOM 操作消息
 */
export interface DOMOperationMessage extends BaseMessage {
  type: MessageType.DOM_OPERATION;
  /** 操作类型 */
  operation: DOMOperationType;
  /** 操作参数 */
  params: Record<string, unknown>;
  /** 是否需要响应 */
  expectResponse?: boolean;
}

/**
 * DOM 操作响应消息
 */
export interface DOMOperationResponseMessage extends BaseMessage {
  type: MessageType.DOM_OPERATION_RESPONSE;
  /** 原始消息 ID */
  originalMessageId: string;
  /** 操作是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: unknown;
  /** 错误信息 */
  error?: string;
}

/**
 * 事件通知消息
 */
export interface EventNotificationMessage extends BaseMessage {
  type: MessageType.EVENT_NOTIFICATION;
  /** 事件类型 */
  eventType: string;
  /** 事件数据 */
  eventData: Record<string, unknown>;
}

/**
 * 错误报告消息
 */
export interface ErrorReportMessage extends BaseMessage {
  type: MessageType.ERROR_REPORT;
  /** 错误消息 */
  message: string;
  /** 错误堆栈 */
  stack?: string;
  /** 错误上下文 */
  context?: Record<string, unknown>;
}

/**
 * 心跳消息
 */
export interface HeartbeatMessage extends BaseMessage {
  type: MessageType.HEARTBEAT | MessageType.HEARTBEAT_RESPONSE;
  /** 负载数据 */
  payload?: Record<string, unknown>;
}

/**
 * 握手消息
 */
export interface HandshakeMessage extends BaseMessage {
  type: MessageType.HANDSHAKE | MessageType.HANDSHAKE_RESPONSE;
  /** 协议版本 */
  protocolVersion: string;
  /** 能力列表 */
  capabilities: string[];
  /** 配置信息 */
  config?: Record<string, unknown>;
}

/**
 * 自定义消息
 */
export interface CustomMessage extends BaseMessage {
  type: MessageType.CUSTOM;
  /** 自定义类型 */
  customType: string;
  /** 消息数据 */
  data: unknown;
}

/**
 * 消息联合类型
 */
export type IframeMessage =
  | DOMOperationMessage
  | DOMOperationResponseMessage
  | EventNotificationMessage
  | ErrorReportMessage
  | HeartbeatMessage
  | HandshakeMessage
  | CustomMessage;

/**
 * 消息处理器类型
 */
export type MessageHandler<T extends IframeMessage = IframeMessage> = (
  message: T,
  source: IframeInstance
) => Promise<void> | void;

/**
 * 消息桥接配置
 */
export interface MessageBridgeConfig extends BaseConfig {
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 消息超时时间（毫秒） */
  messageTimeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 是否启用消息队列 */
  enableQueue?: boolean;
  /** 队列最大长度 */
  maxQueueSize?: number;
  /** 是否启用消息压缩 */
  enableCompression?: boolean;
}

/**
 * 跨域代理配置
 */
export interface ProxyConfig extends BaseConfig {
  /** 代理服务器 URL */
  proxyUrl?: string;
  /** 允许的域名列表 */
  allowedDomains?: string[];
  /** 禁止的域名列表 */
  blockedDomains?: string[];
  /** 请求头白名单 */
  allowedHeaders?: string[];
  /** 缓存配置 */
  cache?: {
    enabled: boolean;
    maxAge: number;
    maxSize: number;
  };
  /** 重试配置 */
  retry?: {
    maxAttempts: number;
    delay: number;
    backoff: number;
  };
}

/**
 * 安全策略配置
 */
export interface SecurityConfig extends BaseConfig {
  /** CSP 策略 */
  contentSecurityPolicy?: string;
  /** 允许的脚本源 */
  allowedScriptSources?: string[];
  /** 允许的样式源 */
  allowedStyleSources?: string[];
  /** 允许的图片源 */
  allowedImageSources?: string[];
  /** 是否启用脚本检测 */
  enableScriptDetection?: boolean;
  /** 恶意代码检测规则 */
  malwareDetectionRules?: string[];
  /** 最大执行时间（毫秒） */
  maxExecutionTime?: number;
  /** 最大内存使用（字节） */
  maxMemoryUsage?: number;
}

/**
 * Iframe 管理器接口
 */
export interface IIframeManager {
  /**
   * 创建 Iframe 实例
   * @param config Iframe 配置
   */
  createIframe(config: IframeConfig): Promise<IframeInstance>;

  /**
   * 销毁 Iframe 实例
   * @param id Iframe ID
   */
  destroyIframe(id: string): Promise<void>;

  /**
   * 获取 Iframe 实例
   * @param id Iframe ID
   */
  getIframe(id: string): IframeInstance | undefined;

  /**
   * 获取所有 Iframe 实例
   */
  getAllIframes(): IframeInstance[];

  /**
   * 检查 Iframe 健康状态
   * @param id Iframe ID
   */
  checkHealth(id: string): Promise<boolean>;

  /**
   * 清理无效的 Iframe
   */
  cleanup(): Promise<void>;
}

/**
 * 消息桥接接口
 */
export interface IMessageBridge {
  /**
   * 发送消息
   * @param targetId 目标 Iframe ID
   * @param message 消息内容
   */
  sendMessage(targetId: string, message: IframeMessage): Promise<void>;

  /**
   * 广播消息
   * @param message 消息内容
   * @param excludeIds 排除的 Iframe ID 列表
   */
  broadcastMessage(
    message: IframeMessage,
    excludeIds?: string[]
  ): Promise<void>;

  /**
   * 注册消息处理器
   * @param type 消息类型
   * @param handler 处理器函数
   */
  registerHandler<T extends IframeMessage>(
    type: MessageType,
    handler: MessageHandler<T>
  ): void;

  /**
   * 移除消息处理器
   * @param type 消息类型
   * @param handler 处理器函数
   */
  removeHandler<T extends IframeMessage>(
    type: MessageType,
    handler: MessageHandler<T>
  ): void;

  /**
   * 启动心跳检测
   */
  startHeartbeat(): void;

  /**
   * 停止心跳检测
   */
  stopHeartbeat(): void;
}

/**
 * 跨域代理接口
 */
export interface ICrossOriginProxy {
  /**
   * 代理请求
   * @param url 目标 URL
   * @param options 请求选项
   */
  proxyRequest(url: string, options?: RequestInit): Promise<Response>;

  /**
   * 检查域名是否被允许
   * @param domain 域名
   */
  isDomainAllowed(domain: string): boolean;

  /**
   * 添加允许的域名
   * @param domain 域名
   */
  addAllowedDomain(domain: string): void;

  /**
   * 移除允许的域名
   * @param domain 域名
   */
  removeAllowedDomain(domain: string): void;

  /**
   * 清理缓存
   */
  clearCache(): void;
}

/**
 * 安全管理器接口
 */
export interface ISecurityManager {
  /**
   * 验证脚本安全性
   * @param script 脚本内容
   */
  validateScript(script: string): Promise<boolean>;

  /**
   * 检测恶意代码
   * @param content 内容
   */
  detectMalware(content: string): Promise<boolean>;

  /**
   * 应用安全策略
   * @param iframe Iframe 实例
   */
  applySecurityPolicy(iframe: IframeInstance): Promise<void>;

  /**
   * 监控资源使用
   * @param iframe Iframe 实例
   */
  monitorResourceUsage(iframe: IframeInstance): Promise<void>;

  /**
   * 生成安全报告
   * @param iframe Iframe 实例
   */
  generateSecurityReport(iframe: IframeInstance): Promise<SecurityReport>;
}

/**
 * DOM 操作适配器接口
 */
export interface IDOMAdapter {
  /**
   * 在 Iframe 中查询元素
   * @param iframeId Iframe ID
   * @param selector 选择器
   */
  queryElement(iframeId: string, selector: string): Promise<ElementInfo | null>;

  /**
   * 在 Iframe 中点击元素
   * @param iframeId Iframe ID
   * @param selector 选择器
   * @param options 点击选项
   */
  clickElement(
    iframeId: string,
    selector: string,
    options?: ClickOptions
  ): Promise<ActionResult>;

  /**
   * 在 Iframe 中输入文本
   * @param iframeId Iframe ID
   * @param selector 选择器
   * @param text 文本内容
   * @param options 输入选项
   */
  typeText(
    iframeId: string,
    selector: string,
    text: string,
    options?: TypeOptions
  ): Promise<ActionResult>;

  /**
   * 获取 Iframe 页面信息
   * @param iframeId Iframe ID
   */
  getPageInfo(iframeId: string): Promise<PageInfo>;

  /**
   * 在 Iframe 中执行脚本
   * @param iframeId Iframe ID
   * @param script 脚本内容
   */
  executeScript(iframeId: string, script: string): Promise<unknown>;

  /**
   * 截取 Iframe 截图
   * @param iframeId Iframe ID
   * @param options 截图选项
   */
  takeScreenshot(
    iframeId: string,
    options?: ScreenshotOptions
  ): Promise<string>;
}

/**
 * 安全报告接口
 */
export interface SecurityReport {
  /** 报告 ID */
  id: string;
  /** Iframe ID */
  iframeId: string;
  /** 生成时间 */
  timestamp: number;
  /** 安全等级 */
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  /** 检测到的威胁 */
  threats: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  /** 资源使用情况 */
  resourceUsage: {
    memory: number;
    cpu: number;
    network: number;
  };
  /** 违规行为 */
  violations: Array<{
    type: string;
    description: string;
    timestamp: number;
  }>;
  /** 建议措施 */
  recommendations: string[];
}

/**
 * 页面信息接口
 */
export interface PageInfo {
  /** 页面 URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** 页面状态 */
  readyState: DocumentReadyState;
  /** 视口大小 */
  viewport: Rectangle;
  /** 页面大小 */
  pageSize: {
    width: number;
    height: number;
  };
  /** 滚动位置 */
  scrollPosition: Point;
  /** 元素统计 */
  elementStats: {
    total: number;
    visible: number;
    interactive: number;
  };
}

/**
 * 截图选项接口
 */
export interface ScreenshotOptions {
  /** 截图格式 */
  format?: 'png' | 'jpeg' | 'webp';
  /** 图片质量 (0-1) */
  quality?: number;
  /** 截图区域 */
  clip?: Rectangle;
  /** 是否包含背景 */
  omitBackground?: boolean;
  /** 设备像素比 */
  deviceScaleFactor?: number;
}

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
