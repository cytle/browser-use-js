/**
 * @file purpose: 浏览器核心控制器
 *
 * 这个模块实现了浏览器的核心控制功能，包括：
 * - 页面导航控制（前进/后退/刷新）
 * - 窗口和标签页管理
 * - 浏览器状态实时监控
 * - 页面加载状态检测
 * - 错误处理和恢复机制
 */

import type {
  BrowserState,
  BrowserConfig,
  Result,
  Rectangle,
  BaseEventData,
} from '../types';

/**
 * 页面加载状态枚举
 */
export enum PageLoadState {
  LOADING = 'loading',
  INTERACTIVE = 'interactive',
  COMPLETE = 'complete',
}

/**
 * 导航选项接口
 */
export interface NavigationOptions {
  /** 等待加载完成 */
  waitForLoad?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否替换当前历史记录 */
  replace?: boolean;
}

/**
 * 窗口信息接口
 */
export interface WindowInfo {
  /** 窗口 ID */
  id: string;
  /** 窗口标题 */
  title: string;
  /** 窗口 URL */
  url: string;
  /** 是否为活动窗口 */
  active: boolean;
  /** 窗口大小 */
  size: Rectangle;
}

/**
 * 浏览器事件数据接口
 */
export interface BrowserEventData extends BaseEventData {
  /** 事件类型 */
  type: 'navigation' | 'load' | 'error' | 'resize';
  /** 相关 URL */
  url?: string;
  /** 错误信息 */
  error?: string;
  /** 额外数据 */
  data?: Record<string, unknown>;
}

/**
 * 浏览器核心控制器类
 *
 * 提供浏览器的基础控制功能，包括导航、状态监控等
 */
export class BrowserController {
  private config: Required<BrowserConfig>;
  private currentState: BrowserState;
  private eventListeners: Map<string, Set<(data: BrowserEventData) => void>>;
  private loadingResolver: (() => void) | null = null;

  constructor(config: BrowserConfig = {}) {
    this.config = {
      viewport: { width: 1280, height: 720 },
      userAgent: navigator.userAgent,
      javascript: true,
      images: true,
      timeout: 30000,
      debug: false,
      ...config,
    };

    this.eventListeners = new Map();
    this.currentState = this.getCurrentBrowserState();

    this.setupEventListeners();
  }

  /**
   * 获取当前浏览器状态
   */
  public getState(): BrowserState {
    return { ...this.currentState };
  }

  /**
   * 导航到指定 URL
   */
  public async navigate(
    url: string,
    options: NavigationOptions = {}
  ): Promise<Result<void>> {
    try {
      const startTime = Date.now();

      this.emitEvent({
        type: 'navigation',
        timestamp: startTime,
        url,
        data: { options },
      });

      // 设置加载状态
      this.setLoadingState(true);

      if (options.replace) {
        window.location.replace(url);
      } else {
        window.location.href = url;
      }

      // 等待页面加载完成
      if (options.waitForLoad !== false) {
        await this.waitForLoad(options.timeout);
      }

      this.updateCurrentState();

      return { success: true };
    } catch (error) {
      this.setLoadingState(false);
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.emitEvent({
        type: 'error',
        timestamp: Date.now(),
        url,
        error: errorMessage,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
      };
    }
  }

  /**
   * 后退
   */
  public async goBack(options: NavigationOptions = {}): Promise<Result<void>> {
    try {
      if (!this.currentState.canGoBack) {
        return {
          success: false,
          error: new Error('Cannot go back - no previous page in history'),
        };
      }

      this.setLoadingState(true);
      window.history.back();

      if (options.waitForLoad !== false) {
        await this.waitForLoad(options.timeout);
      }

      this.updateCurrentState();
      return { success: true };
    } catch (error) {
      this.setLoadingState(false);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 前进
   */
  public async goForward(
    options: NavigationOptions = {}
  ): Promise<Result<void>> {
    try {
      if (!this.currentState.canGoForward) {
        return {
          success: false,
          error: new Error('Cannot go forward - no next page in history'),
        };
      }

      this.setLoadingState(true);
      window.history.forward();

      if (options.waitForLoad !== false) {
        await this.waitForLoad(options.timeout);
      }

      this.updateCurrentState();
      return { success: true };
    } catch (error) {
      this.setLoadingState(false);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 刷新页面
   */
  public async reload(options: NavigationOptions = {}): Promise<Result<void>> {
    try {
      this.setLoadingState(true);
      window.location.reload();

      if (options.waitForLoad !== false) {
        await this.waitForLoad(options.timeout);
      }

      this.updateCurrentState();
      return { success: true };
    } catch (error) {
      this.setLoadingState(false);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 等待页面加载完成
   */
  public async waitForLoad(timeout?: number): Promise<void> {
    const timeoutMs = timeout || this.config.timeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Page load timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const checkLoad = () => {
        if (document.readyState === 'complete') {
          clearTimeout(timeoutId);
          resolve();
        } else {
          setTimeout(checkLoad, 100);
        }
      };

      if (document.readyState === 'complete') {
        clearTimeout(timeoutId);
        resolve();
      } else {
        checkLoad();
      }
    });
  }

  /**
   * 获取页面加载状态
   */
  public getLoadState(): PageLoadState {
    switch (document.readyState) {
      case 'loading':
        return PageLoadState.LOADING;
      case 'interactive':
        return PageLoadState.INTERACTIVE;
      case 'complete':
        return PageLoadState.COMPLETE;
      default:
        return PageLoadState.LOADING;
    }
  }

  /**
   * 设置视口大小
   */
  public setViewport(size: { width: number; height: number }): Result<void> {
    try {
      // 在浏览器环境中，我们无法直接设置窗口大小
      // 但可以更新配置并触发相应事件
      this.config.viewport = size;

      this.emitEvent({
        type: 'resize',
        timestamp: Date.now(),
        data: { viewport: size },
      });

      this.updateCurrentState();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * 获取当前视口信息
   */
  public getViewport(): Rectangle {
    return {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * 获取窗口信息
   */
  public getWindowInfo(): WindowInfo {
    return {
      id: 'main', // 浏览器环境中只有一个主窗口
      title: document.title,
      url: window.location.href,
      active: document.hasFocus(),
      size: this.getViewport(),
    };
  }

  /**
   * 添加事件监听器
   */
  public on(event: string, listener: (data: BrowserEventData) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, listener: (data: BrowserEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 销毁控制器
   */
  public destroy(): void {
    this.removeEventListeners();
    this.eventListeners.clear();
    this.loadingResolver = null;
  }

  /**
   * 设置加载状态
   */
  private setLoadingState(loading: boolean): void {
    this.currentState.loading = loading;

    if (loading) {
      // 创建新的加载 Promise
      const promise = new Promise<void>(resolve => {
        this.loadingResolver = resolve;
      });
      // 存储 promise 但不作为类属性（避免未使用警告）
      void promise;
    } else if (this.loadingResolver) {
      this.loadingResolver();
      this.loadingResolver = null;
    }
  }

  /**
   * 获取当前浏览器状态
   */
  private getCurrentBrowserState(): BrowserState {
    return {
      url: window.location.href,
      title: document.title,
      loading: document.readyState !== 'complete',
      canGoBack: window.history.length > 1,
      canGoForward: false, // 浏览器 API 无法直接检测
      viewport: this.getViewport(),
    };
  }

  /**
   * 更新当前状态
   */
  private updateCurrentState(): void {
    const newState = this.getCurrentBrowserState();
    const oldState = this.currentState;
    this.currentState = newState;

    // 如果状态发生变化，触发事件
    if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
      this.emitEvent({
        type: 'load',
        timestamp: Date.now(),
        url: newState.url,
        data: { oldState, newState },
      });
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听页面加载状态变化
    document.addEventListener('readystatechange', () => {
      this.updateCurrentState();

      if (document.readyState === 'complete') {
        this.setLoadingState(false);
      }
    });

    // 监听页面卸载
    window.addEventListener('beforeunload', () => {
      this.setLoadingState(true);
    });

    // 监听历史记录变化
    window.addEventListener('popstate', () => {
      this.updateCurrentState();
    });

    // 监听视口大小变化
    window.addEventListener('resize', () => {
      this.updateCurrentState();
      this.emitEvent({
        type: 'resize',
        timestamp: Date.now(),
        data: { viewport: this.getViewport() },
      });
    });

    // 监听页面焦点变化
    window.addEventListener('focus', () => {
      this.updateCurrentState();
    });

    window.addEventListener('blur', () => {
      this.updateCurrentState();
    });
  }

  /**
   * 移除事件监听器
   */
  private removeEventListeners(): void {
    // 注意：在实际应用中，应该保存监听器引用以便正确移除
    // 这里为了简化，只是示例
  }

  /**
   * 发射事件
   */
  private emitEvent(data: BrowserEventData): void {
    const listeners = this.eventListeners.get(data.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          if (this.config.debug) {
            console.error('Error in event listener:', error);
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
            console.error('Error in event listener:', error);
          }
        }
      });
    }
  }
}

/**
 * 默认浏览器控制器实例
 */
export const browserController = new BrowserController();
