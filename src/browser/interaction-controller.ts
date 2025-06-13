/**
 * @file purpose: 交互控制器实现
 *
 * 这个模块实现了浏览器的交互控制功能，包括：
 * - 精确的元素点击操作（支持 Iframe 内元素）
 * - 智能文本输入处理（跨 Iframe 通信）
 * - 平滑滚动和缩放控制
 * - 表单提交处理
 * - 键盘和鼠标事件模拟
 * - 事件监听和处理机制
 * - Iframe 内外交互统一接口
 */

import type {
  ElementSelector,
  ClickOptions,
  TypeOptions,
  ScrollOptions,
  ActionResult,
  Point,
  Rectangle,
  KeyboardModifiers,
  Result,
  InteractableElement,
} from '../types';
import { MouseButton } from '../types';
import { ClickableElementProcessor } from '../dom/clickable_element_processor';
import { DOMAdapter } from '../iframe/adapter';
import { MessageBridge } from '../iframe/bridge';

/**
 * 交互控制器配置
 */
export interface InteractionControllerConfig {
  /** 默认点击延迟（毫秒） */
  defaultClickDelay?: number;
  /** 默认输入延迟（毫秒） */
  defaultTypeDelay?: number;
  /** 滚动动画持续时间（毫秒） */
  scrollDuration?: number;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 操作超时时间（毫秒） */
  operationTimeout?: number;
}

/**
 * 交互事件数据
 */
export interface InteractionEventData {
  /** 事件类型 */
  type: 'click' | 'type' | 'scroll' | 'focus' | 'blur';
  /** 目标元素选择器 */
  selector?: string;
  /** 事件时间戳 */
  timestamp: number;
  /** 是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
  /** 额外数据 */
  data?: Record<string, unknown>;
}

/**
 * 交互控制器类
 *
 * 提供统一的浏览器交互接口，支持直接DOM操作和Iframe内操作
 */
export class InteractionController {
  private readonly config: Required<InteractionControllerConfig>;
  private readonly clickableProcessor: ClickableElementProcessor;
  private readonly domAdapter?: DOMAdapter;
  private readonly eventListeners: Map<
    string,
    Set<(data: InteractionEventData) => void>
  >;
  private activeIframeId?: string;

  constructor(
    config: InteractionControllerConfig = {},
    messageBridge?: MessageBridge
  ) {
    this.config = {
      defaultClickDelay: 100,
      defaultTypeDelay: 50,
      scrollDuration: 300,
      debug: false,
      maxRetries: 3,
      operationTimeout: 10000,
      ...config,
    };

    this.clickableProcessor = new ClickableElementProcessor({
      includeHidden: false,
      enableDeepScan: true,
      frameworkDetection: true,
    });

    if (messageBridge) {
      this.domAdapter = new DOMAdapter(messageBridge);
    }

    this.eventListeners = new Map();
  }

  /**
   * 设置活动的 Iframe ID
   * @param iframeId - Iframe ID，null 表示操作主页面
   */
  public setActiveIframe(iframeId: string | null): void {
    this.activeIframeId = iframeId || undefined;
  }

  /**
   * 获取当前活动的 Iframe ID
   */
  public getActiveIframe(): string | undefined {
    return this.activeIframeId;
  }

  /**
   * 点击元素
   * @param selector - 元素选择器或元素对象
   * @param options - 点击选项
   * @returns 操作结果
   */
  public async click(
    selector: ElementSelector,
    options: ClickOptions = {}
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // 如果设置了活动 Iframe，使用 DOM 适配器
      if (this.activeIframeId && this.domAdapter) {
        const selectorString =
          typeof selector === 'string'
            ? selector
            : this.generateSelector(selector);
        return await this.domAdapter.clickElement(
          this.activeIframeId,
          selectorString,
          options
        );
      }

      // 直接操作主页面
      const element = await this.resolveElement(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          duration: Date.now() - startTime,
        };
      }

      // 检查元素可点击性
      const clickableInfo =
        this.clickableProcessor.analyzeClickableElement(element);
      if (!clickableInfo || !clickableInfo.analysis.isClickable) {
        return {
          success: false,
          error: `Element is not clickable: ${selector}`,
          duration: Date.now() - startTime,
        };
      }

      // 滚动到元素可见区域
      await this.scrollIntoView(element);

      // 等待点击延迟
      if (options.delay || this.config.defaultClickDelay > 0) {
        await this.delay(options.delay || this.config.defaultClickDelay);
      }

      // 执行点击
      const result = await this.performClick(element, options);

      // 发射事件
      this.emitEvent({
        type: 'click',
        selector:
          typeof selector === 'string'
            ? selector
            : this.generateSelector(element),
        timestamp: Date.now(),
        success: result.success,
        error: result.error,
        data: { options, clickableInfo },
      });

      return {
        ...result,
        duration: Date.now() - startTime,
        includeInMemory: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.emitEvent({
        type: 'click',
        selector: typeof selector === 'string' ? selector : 'unknown',
        timestamp: Date.now(),
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 输入文本
   * @param selector - 元素选择器或元素对象
   * @param text - 要输入的文本
   * @param options - 输入选项
   * @returns 操作结果
   */
  public async type(
    selector: ElementSelector,
    text: string,
    options: TypeOptions = {}
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      // 如果设置了活动 Iframe，使用 DOM 适配器
      if (this.activeIframeId && this.domAdapter) {
        const selectorString =
          typeof selector === 'string'
            ? selector
            : this.generateSelector(selector);
        return await this.domAdapter.typeText(
          this.activeIframeId,
          selectorString,
          text,
          options
        );
      }

      // 直接操作主页面
      const element = await this.resolveElement(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          duration: Date.now() - startTime,
        };
      }

      // 检查元素是否可输入
      if (!this.isInputElement(element)) {
        return {
          success: false,
          error: `Element is not an input element: ${selector}`,
          duration: Date.now() - startTime,
        };
      }

      // 聚焦元素
      await this.focus(element as HTMLElement);

      // 清空现有内容（如果需要）
      if (options.clear !== false) {
        await this.clearInput(element);
      }

      // 执行输入
      const result = await this.performType(element, text, options);

      // 发射事件
      this.emitEvent({
        type: 'type',
        selector:
          typeof selector === 'string'
            ? selector
            : this.generateSelector(element),
        timestamp: Date.now(),
        success: result.success,
        error: result.error,
        data: { text, options },
      });

      return {
        ...result,
        duration: Date.now() - startTime,
        includeInMemory: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.emitEvent({
        type: 'type',
        selector: typeof selector === 'string' ? selector : 'unknown',
        timestamp: Date.now(),
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 滚动页面或元素
   * @param target - 滚动目标（坐标点或预设位置）
   * @param selector - 目标元素选择器（可选，默认为页面）
   * @param options - 滚动选项
   * @returns 操作结果
   */
  public async scroll(
    target: Point | 'top' | 'bottom',
    selector?: ElementSelector,
    options: ScrollOptions = {}
  ): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      let element: Element | null = null;

      if (selector) {
        element = await this.resolveElement(selector);
        if (!element) {
          return {
            success: false,
            error: `Element not found: ${selector}`,
            duration: Date.now() - startTime,
          };
        }
      }

      const result = await this.performScroll(target, element, options);

      // 发射事件
      this.emitEvent({
        type: 'scroll',
        selector: selector
          ? typeof selector === 'string'
            ? selector
            : this.generateSelector(element!)
          : undefined,
        timestamp: Date.now(),
        success: result.success,
        error: result.error,
        data: { target, options },
      });

      return {
        ...result,
        duration: Date.now() - startTime,
        includeInMemory: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.emitEvent({
        type: 'scroll',
        selector: selector
          ? typeof selector === 'string'
            ? selector
            : 'unknown'
          : undefined,
        timestamp: Date.now(),
        success: false,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 聚焦元素
   * @param selector - 元素选择器或元素对象
   * @returns 操作结果
   */
  public async focus(selector: ElementSelector): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const element = await this.resolveElement(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          duration: Date.now() - startTime,
        };
      }

      if (element instanceof HTMLElement) {
        element.focus();

        // 发射事件
        this.emitEvent({
          type: 'focus',
          selector:
            typeof selector === 'string'
              ? selector
              : this.generateSelector(element),
          timestamp: Date.now(),
          success: true,
        });

        return {
          success: true,
          duration: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: 'Element is not focusable',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 失焦元素
   * @param selector - 元素选择器或元素对象
   * @returns 操作结果
   */
  public async blur(selector: ElementSelector): Promise<ActionResult> {
    const startTime = Date.now();

    try {
      const element = await this.resolveElement(selector);
      if (!element) {
        return {
          success: false,
          error: `Element not found: ${selector}`,
          duration: Date.now() - startTime,
        };
      }

      if (element instanceof HTMLElement) {
        element.blur();

        // 发射事件
        this.emitEvent({
          type: 'blur',
          selector:
            typeof selector === 'string'
              ? selector
              : this.generateSelector(element),
          timestamp: Date.now(),
          success: true,
        });

        return {
          success: true,
          duration: Date.now() - startTime,
        };
      }

      return {
        success: false,
        error: 'Element is not focusable',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 等待指定时间
   * @param ms - 等待时间（毫秒）
   */
  public async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 添加事件监听器
   * @param event - 事件类型
   * @param listener - 监听器函数
   */
  public on(
    event: string,
    listener: (data: InteractionEventData) => void
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   * @param event - 事件类型
   * @param listener - 监听器函数
   */
  public off(
    event: string,
    listener: (data: InteractionEventData) => void
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 销毁控制器
   */
  public destroy(): void {
    this.eventListeners.clear();
    this.clickableProcessor.dispose();
  }

  /**
   * 解析元素选择器
   * @param selector - 元素选择器或元素对象
   * @returns 元素对象
   */
  private async resolveElement(
    selector: ElementSelector
  ): Promise<Element | null> {
    if (typeof selector === 'string') {
      return document.querySelector(selector);
    }
    return selector;
  }

  /**
   * 执行点击操作
   * @param element - 目标元素
   * @param options - 点击选项
   * @returns 操作结果
   */
  private async performClick(
    element: Element,
    options: ClickOptions
  ): Promise<ActionResult> {
    try {
      const rect = element.getBoundingClientRect();

      // 计算点击位置
      let clickX = rect.left + rect.width / 2;
      let clickY = rect.top + rect.height / 2;

      if (options.offset) {
        clickX += options.offset.x;
        clickY += options.offset.y;
      }

      // 创建鼠标事件
      const mouseEventInit: MouseEventInit = {
        bubbles: true,
        cancelable: true,
        clientX: clickX,
        clientY: clickY,
        button: this.getMouseButtonCode(options.button || MouseButton.LEFT),
        buttons: 1,
        ctrlKey: options.modifiers?.ctrl || false,
        altKey: options.modifiers?.alt || false,
        shiftKey: options.modifiers?.shift || false,
        metaKey: options.modifiers?.meta || false,
      };

      // 触发鼠标事件序列
      element.dispatchEvent(new MouseEvent('mousedown', mouseEventInit));

      // 短暂延迟模拟真实点击
      await this.delay(10);

      element.dispatchEvent(new MouseEvent('mouseup', mouseEventInit));
      element.dispatchEvent(new MouseEvent('click', mouseEventInit));

      // 处理多次点击
      if (options.clickCount && options.clickCount > 1) {
        for (let i = 1; i < options.clickCount; i++) {
          await this.delay(50);
          element.dispatchEvent(new MouseEvent('click', mouseEventInit));
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行文本输入操作
   * @param element - 目标元素
   * @param text - 输入文本
   * @param options - 输入选项
   * @returns 操作结果
   */
  private async performType(
    element: Element,
    text: string,
    options: TypeOptions
  ): Promise<ActionResult> {
    try {
      const inputElement = element as HTMLInputElement | HTMLTextAreaElement;
      const delay = options.delay || this.config.defaultTypeDelay;

      // 逐字符输入
      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 触发键盘事件
        const keyboardEventInit: KeyboardEventInit = {
          bubbles: true,
          cancelable: true,
          key: char,
          code: `Key${char.toUpperCase()}`,
          ctrlKey: options.modifiers?.ctrl || false,
          altKey: options.modifiers?.alt || false,
          shiftKey: options.modifiers?.shift || false,
          metaKey: options.modifiers?.meta || false,
        };

        element.dispatchEvent(new KeyboardEvent('keydown', keyboardEventInit));

        // 更新输入值
        const currentValue = inputElement.value;
        inputElement.value = currentValue + char;

        // 触发输入事件
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new KeyboardEvent('keyup', keyboardEventInit));

        // 输入延迟
        if (delay > 0) {
          await this.delay(delay);
        }
      }

      // 触发 change 事件
      element.dispatchEvent(new Event('change', { bubbles: true }));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 执行滚动操作
   * @param target - 滚动目标
   * @param element - 目标元素（可选）
   * @param options - 滚动选项
   * @returns 操作结果
   */
  private async performScroll(
    target: Point | 'top' | 'bottom',
    element: Element | null,
    options: ScrollOptions
  ): Promise<ActionResult> {
    try {
      const scrollElement = element || document.documentElement;

      let scrollX: number;
      let scrollY: number;

      if (typeof target === 'string') {
        switch (target) {
          case 'top':
            scrollX = 0;
            scrollY = 0;
            break;
          case 'bottom':
            scrollX = 0;
            scrollY = scrollElement.scrollHeight - scrollElement.clientHeight;
            break;
          default:
            throw new Error(`Unknown scroll target: ${target}`);
        }
      } else {
        scrollX = target.x;
        scrollY = target.y;
      }

      // 执行滚动
      scrollElement.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: options.behavior || 'smooth',
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 滚动元素到可见区域
   * @param element - 目标元素
   */
  private async scrollIntoView(element: Element): Promise<void> {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });

    // 等待滚动完成
    await this.delay(this.config.scrollDuration);
  }

  /**
   * 清空输入元素内容
   * @param element - 输入元素
   */
  private async clearInput(element: Element): Promise<void> {
    const inputElement = element as HTMLInputElement | HTMLTextAreaElement;

    // 选中所有文本
    inputElement.select();

    // 触发删除键事件
    const deleteEvent: KeyboardEventInit = {
      bubbles: true,
      cancelable: true,
      key: 'Backspace',
      code: 'Backspace',
    };

    element.dispatchEvent(new KeyboardEvent('keydown', deleteEvent));
    inputElement.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', deleteEvent));
  }

  /**
   * 检查元素是否为输入元素
   * @param element - 要检查的元素
   * @returns 是否为输入元素
   */
  private isInputElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const inputTags = ['input', 'textarea', 'select'];

    if (inputTags.includes(tagName)) {
      return true;
    }

    // 检查 contenteditable
    if (element.hasAttribute('contenteditable')) {
      const contenteditable = element.getAttribute('contenteditable');
      return contenteditable === 'true' || contenteditable === '';
    }

    return false;
  }

  /**
   * 获取鼠标按钮代码
   * @param button - 鼠标按钮类型
   * @returns 按钮代码
   */
  private getMouseButtonCode(button: MouseButton): number {
    switch (button) {
      case MouseButton.LEFT:
        return 0;
      case MouseButton.MIDDLE:
        return 1;
      case MouseButton.RIGHT:
        return 2;
      default:
        return 0;
    }
  }

  /**
   * 生成元素选择器
   * @param element - 元素对象
   * @returns CSS 选择器
   */
  private generateSelector(element: Element): string {
    // 优先使用 ID
    if (element.id) {
      return `#${element.id}`;
    }

    // 使用类名
    if (element.className) {
      const classes = element.className.split(' ').filter(cls => cls.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }

    // 使用标签名和位置
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;

    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName.toLowerCase() === tagName
      );
      const index = siblings.indexOf(element);

      if (siblings.length > 1) {
        return `${tagName}:nth-of-type(${index + 1})`;
      }
    }

    return tagName;
  }

  /**
   * 发射事件
   * @param data - 事件数据
   */
  private emitEvent(data: InteractionEventData): void {
    const listeners = this.eventListeners.get(data.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          if (this.config.debug) {
            console.error('Error in interaction event listener:', error);
          }
        }
      });
    }

    // 也发射到通用监听器
    const allListeners = this.eventListeners.get('*');
    if (allListeners) {
      allListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          if (this.config.debug) {
            console.error('Error in interaction event listener:', error);
          }
        }
      });
    }
  }
}

/**
 * 创建交互控制器实例
 * @param config - 配置选项
 * @param messageBridge - 消息桥接器（用于 Iframe 操作）
 * @returns 交互控制器实例
 */
export function createInteractionController(
  config?: InteractionControllerConfig,
  messageBridge?: MessageBridge
): InteractionController {
  return new InteractionController(config, messageBridge);
}

/**
 * 默认导出
 */
export default InteractionController;
