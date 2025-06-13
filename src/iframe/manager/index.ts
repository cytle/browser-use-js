/**
 * @file purpose: Iframe 管理器实现
 */

import {
  IIframeManager,
  IframeConfig,
  IframeInstance,
  IframeStatus,
  IframeSandboxPermission,
  ICrossOriginProxy,
  ISecurityManager,
  ProxyConfig,
  SecurityConfig,
} from '../../types';
import { createCrossOriginProxy } from '../proxy';
import { createSecurityManager } from '../security';

/**
 * Iframe 管理器实现类
 */
export class IframeManager implements IIframeManager {
  private readonly iframes = new Map<string, IframeInstance>();
  private readonly loadingPromises = new Map<string, Promise<void>>();
  private idCounter = 0;

  /**
   * 创建 Iframe 实例
   */
  async createIframe(config: IframeConfig): Promise<IframeInstance> {
    // 合并默认配置
    const mergedConfig = {
      width: '100%',
      height: '600px',
      loadTimeout: 30000,
      sandbox: [
        IframeSandboxPermission.ALLOW_SCRIPTS,
        IframeSandboxPermission.ALLOW_SAME_ORIGIN,
        IframeSandboxPermission.ALLOW_FORMS,
      ],
      hidden: false,
      ...config,
    };

    const id = mergedConfig.id || this.generateId();

    if (this.iframes.has(id)) {
      throw new Error(`Iframe with id "${id}" already exists`);
    }

    const iframe = document.createElement('iframe');
    iframe.id = id;
    iframe.src = mergedConfig.url;

    if (mergedConfig.sandbox && mergedConfig.sandbox.length > 0) {
      iframe.sandbox.add(...mergedConfig.sandbox);
    }

    if (mergedConfig.width) {
      iframe.style.width =
        typeof mergedConfig.width === 'number'
          ? `${mergedConfig.width}px`
          : mergedConfig.width;
    }

    if (mergedConfig.height) {
      iframe.style.height =
        typeof mergedConfig.height === 'number'
          ? `${mergedConfig.height}px`
          : mergedConfig.height;
    }

    // 应用自定义样式
    if (mergedConfig.style) {
      Object.assign(iframe.style, mergedConfig.style);
    }

    // 应用自定义属性
    if (mergedConfig.attributes) {
      Object.entries(mergedConfig.attributes).forEach(([key, value]) => {
        iframe.setAttribute(key, value);
      });
    }

    if (!mergedConfig.hidden) {
      document.body.appendChild(iframe);
    }

    const instance: IframeInstance = {
      id,
      element: iframe,
      config: mergedConfig,
      status: IframeStatus.INITIALIZING,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      communicationEstablished: false,
    };

    this.iframes.set(id, instance);

    const loadPromise = this.loadIframe(instance);
    this.loadingPromises.set(id, loadPromise);

    try {
      await loadPromise;
    } catch (error) {
      await this.destroyIframe(id);
      throw error;
    } finally {
      this.loadingPromises.delete(id);
    }

    return instance;
  }

  /**
   * 销毁 Iframe 实例
   */
  async destroyIframe(id: string): Promise<void> {
    const instance = this.iframes.get(id);
    if (!instance) {
      return;
    }

    instance.status = IframeStatus.DESTROYED;

    if (instance.element.parentNode) {
      instance.element.parentNode.removeChild(instance.element);
    }

    this.iframes.delete(id);
  }

  /**
   * 获取 Iframe 实例
   */
  getIframe(id: string): IframeInstance | undefined {
    return this.iframes.get(id);
  }

  /**
   * 获取所有 Iframe 实例
   */
  getAllIframes(): IframeInstance[] {
    return Array.from(this.iframes.values());
  }

  /**
   * 检查 Iframe 健康状态
   */
  async checkHealth(id: string): Promise<boolean> {
    const instance = this.iframes.get(id);
    if (!instance) {
      return false;
    }

    if (
      instance.status === IframeStatus.DESTROYED ||
      instance.status === IframeStatus.ERROR
    ) {
      return false;
    }

    if (!document.contains(instance.element)) {
      instance.status = IframeStatus.ERROR;
      instance.error = 'Iframe element not found in DOM';
      return false;
    }

    return instance.status === IframeStatus.READY;
  }

  /**
   * 清理无效的 Iframe
   */
  async cleanup(): Promise<void> {
    const instancesToCleanup: string[] = [];

    for (const [id, instance] of this.iframes) {
      const isHealthy = await this.checkHealth(id);
      if (!isHealthy) {
        instancesToCleanup.push(id);
      }
    }

    for (const id of instancesToCleanup) {
      await this.destroyIframe(id);
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `iframe-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * 加载 Iframe
   */
  private async loadIframe(instance: IframeInstance): Promise<void> {
    return new Promise((resolve, reject) => {
      const { element, config } = instance;
      const timeout = config.loadTimeout || 30000;

      const timeoutId = setTimeout(() => {
        instance.status = IframeStatus.ERROR;
        instance.error = 'Load timeout';
        reject(new Error(`Iframe load timeout after ${timeout}ms`));
      }, timeout);

      const onLoad = () => {
        clearTimeout(timeoutId);
        instance.status = IframeStatus.READY;
        instance.lastActivity = Date.now();
        resolve();
      };

      const onError = () => {
        clearTimeout(timeoutId);
        instance.status = IframeStatus.ERROR;
        instance.error = 'Failed to load iframe';
        reject(new Error('Failed to load iframe'));
      };

      element.addEventListener('load', onLoad, { once: true });
      element.addEventListener('error', onError, { once: true });

      instance.status = IframeStatus.LOADING;
    });
  }
}

/**
 * 创建 Iframe 管理器实例
 */
export function createIframeManager(): IframeManager {
  return new IframeManager();
}

/**
 * 默认导出
 */
export default IframeManager;
