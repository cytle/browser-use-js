/**
 * @file purpose: Mock 对象工厂
 *
 * 提供创建各种 Mock 对象的工厂函数
 */

import type {
  ActionResult,
  AgentConfig,
  BrowserConfig,
  DOMProcessorConfig,
  LLMConfig,
  Point,
  Rectangle,
  Result,
} from '../../types';
import { AgentStatus, ActionType, LLMModelType } from '../../types';

/**
 * 创建模拟的 ActionResult
 * @param overrides 覆盖的属性
 * @returns 模拟的 ActionResult
 */
export function createMockActionResult(
  overrides: Partial<ActionResult> = {}
): ActionResult {
  return {
    success: true,
    extractedContent: { text: 'mock extracted content' },
    includeInMemory: true,
    duration: 100,
    metadata: { timestamp: Date.now() },
    ...overrides,
  };
}

/**
 * 创建模拟的 Result 对象
 * @param data 成功时的数据
 * @param error 失败时的错误
 * @returns 模拟的 Result
 */
export function createMockResult<T>(data?: T, error?: Error): Result<T> {
  if (error) {
    return {
      success: false,
      error,
    };
  }

  return {
    success: true,
    data,
  };
}

/**
 * 创建模拟的 AgentConfig
 * @param overrides 覆盖的属性
 * @returns 模拟的 AgentConfig
 */
export function createMockAgentConfig(
  overrides: Partial<AgentConfig> = {}
): AgentConfig {
  return {
    llm: createMockLLMConfig(),
    maxSteps: 10,
    systemPrompt: 'You are a helpful AI assistant.',
    debug: false,
    timeout: 30000,
    ...overrides,
  };
}

/**
 * 创建模拟的 BrowserConfig
 * @param overrides 覆盖的属性
 * @returns 模拟的 BrowserConfig
 */
export function createMockBrowserConfig(
  overrides: Partial<BrowserConfig> = {}
): BrowserConfig {
  return {
    viewport: { width: 1024, height: 768 },
    userAgent: 'Mozilla/5.0 (Test Browser)',
    javascript: true,
    images: true,
    ...overrides,
  };
}

/**
 * 创建模拟的 DOMProcessorConfig
 * @param overrides 覆盖的属性
 * @returns 模拟的 DOMProcessorConfig
 */
export function createMockDOMProcessorConfig(
  overrides: Partial<DOMProcessorConfig> = {}
): DOMProcessorConfig {
  return {
    includeHidden: false,
    maxElements: 1000,
    includeShadowDOM: false,
    debug: false,
    timeout: 5000,
    ...overrides,
  };
}

/**
 * 创建模拟的 LLMConfig
 * @param overrides 覆盖的属性
 * @returns 模拟的 LLMConfig
 */
export function createMockLLMConfig(
  overrides: Partial<LLMConfig> = {}
): LLMConfig {
  return {
    model: LLMModelType.GPT_4O,
    apiKey: 'mock-api-key',
    baseURL: 'https://api.openai.com/v1',
    temperature: 0.1,
    maxTokens: 4000,
    timeout: 30000,
    ...overrides,
  };
}

/**
 * 创建模拟的 Point
 * @param x X 坐标
 * @param y Y 坐标
 * @returns 模拟的 Point
 */
export function createMockPoint(x: number = 0, y: number = 0): Point {
  return { x, y };
}

/**
 * 创建模拟的 Rectangle
 * @param x X 坐标
 * @param y Y 坐标
 * @param width 宽度
 * @param height 高度
 * @returns 模拟的 Rectangle
 */
export function createMockRectangle(
  x: number = 0,
  y: number = 0,
  width: number = 100,
  height: number = 100
): Rectangle {
  return { x, y, width, height };
}

/**
 * 创建模拟的 LLM 响应
 * @param content 响应内容
 * @param usage 使用统计
 * @returns 模拟的 LLM 响应
 */
export function createMockLLMResponse(
  content: string = 'Mock LLM response',
  usage: { tokens: number } = { tokens: 100 }
) {
  return {
    content,
    usage,
    model: LLMModelType.GPT_4O,
    timestamp: Date.now(),
  };
}

/**
 * 创建模拟的 DOM 元素信息
 * @param tagName 标签名
 * @param attributes 属性
 * @param bounds 边界信息
 * @returns 模拟的元素信息
 */
export function createMockElementInfo(
  tagName: string = 'div',
  attributes: Record<string, string> = {},
  bounds: Rectangle = createMockRectangle()
) {
  return {
    tagName,
    attributes,
    bounds,
    text: 'Mock element text',
    isVisible: true,
    isClickable: true,
    selector: `${tagName}[data-testid="mock"]`,
  };
}

/**
 * 创建模拟的页面信息
 * @param url 页面 URL
 * @param title 页面标题
 * @returns 模拟的页面信息
 */
export function createMockPageInfo(
  url: string = 'https://example.com',
  title: string = 'Mock Page'
) {
  return {
    url,
    title,
    viewport: createMockRectangle(0, 0, 1024, 768),
    elements: [
      createMockElementInfo('button', { id: 'submit' }),
      createMockElementInfo('input', { type: 'text', name: 'username' }),
    ],
    loadTime: 1000,
    timestamp: Date.now(),
  };
}

/**
 * 创建模拟的错误对象
 * @param message 错误消息
 * @param code 错误代码
 * @returns 模拟的错误对象
 */
export function createMockError(
  message: string = 'Mock error',
  code: string = 'MOCK_ERROR'
): Error {
  const error = new Error(message);
  (error as any).code = code;
  return error;
}

/**
 * 创建模拟的异步函数
 * @param result 返回结果
 * @param delay 延迟时间（毫秒）
 * @returns 模拟的异步函数
 */
export function createMockAsyncFunction<T>(
  result: T,
  delay: number = 0
): () => Promise<T> {
  return async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return result;
  };
}

/**
 * 创建模拟的失败异步函数
 * @param error 抛出的错误
 * @param delay 延迟时间（毫秒）
 * @returns 模拟的异步函数
 */
export function createMockFailingAsyncFunction(
  error: Error = createMockError(),
  delay: number = 0
): () => Promise<never> {
  return async () => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw error;
  };
}

/**
 * 创建模拟的事件对象
 * @param type 事件类型
 * @param target 事件目标
 * @param options 事件选项
 * @returns 模拟的事件对象
 */
export function createMockEvent(
  type: string,
  target: EventTarget = document.createElement('div'),
  options: EventInit = {}
): Event {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });

  Object.defineProperty(event, 'target', {
    value: target,
    writable: false,
  });

  return event;
}

/**
 * 创建模拟的鼠标事件
 * @param type 事件类型
 * @param point 鼠标位置
 * @param options 事件选项
 * @returns 模拟的鼠标事件
 */
export function createMockMouseEvent(
  type: string,
  point: Point = createMockPoint(),
  options: MouseEventInit = {}
): MouseEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: point.x,
    clientY: point.y,
    ...options,
  });
}

/**
 * 创建模拟的键盘事件
 * @param type 事件类型
 * @param key 按键
 * @param options 事件选项
 * @returns 模拟的键盘事件
 */
export function createMockKeyboardEvent(
  type: string,
  key: string = 'Enter',
  options: KeyboardEventInit = {}
): KeyboardEvent {
  return new KeyboardEvent(type, {
    bubbles: true,
    cancelable: true,
    key,
    ...options,
  });
}

/**
 * 创建模拟的 Agent 状态
 * @param status 状态
 * @param currentStep 当前步骤
 * @param totalSteps 总步骤数
 * @returns 模拟的 Agent 状态
 */
export function createMockAgentState(
  status: AgentStatus = AgentStatus.IDLE,
  currentStep: number = 0,
  totalSteps: number = 10
) {
  return {
    status,
    currentStep,
    totalSteps,
    startTime: Date.now() - 1000,
    lastActionTime: Date.now(),
    memory: {
      shortTerm: ['Recent action 1', 'Recent action 2'],
      longTerm: ['Important fact 1', 'Important fact 2'],
    },
    currentTask: 'Mock task description',
    progress: currentStep / totalSteps,
  };
}

/**
 * 创建模拟的动作历史记录
 * @param count 记录数量
 * @returns 模拟的动作历史
 */
export function createMockActionHistory(count: number = 3) {
  const history: Array<{
    id: string;
    type: ActionType;
    timestamp: number;
    result: ActionResult;
    duration: number;
    element: ReturnType<typeof createMockElementInfo>;
  }> = [];

  for (let i = 0; i < count; i++) {
    history.push({
      id: `action-${i}`,
      type: ActionType.CLICK,
      timestamp: Date.now() - (count - i) * 1000,
      result: createMockActionResult(),
      duration: 100 + i * 50,
      element: createMockElementInfo(),
    });
  }

  return history;
}
