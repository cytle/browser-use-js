/**
 * @file purpose: Iframe 管理器单元测试
 *
 * 测试 Iframe 管理器的各项功能，包括创建、销毁、健康检查等。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IframeManager } from './index';
import {
  IframeConfig,
  IframeStatus,
  IframeSandboxPermission,
} from '../../types';

// Mock DOM 环境
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
    contains: vi.fn(),
  },
});

describe('IframeManager', () => {
  let manager: IframeManager;
  let mockIframe: HTMLIFrameElement;

  beforeEach(() => {
    manager = new IframeManager();

    // 创建 mock iframe 元素
    mockIframe = {
      id: '',
      src: '',
      style: {},
      sandbox: {
        add: vi.fn(),
      },
      allowFullscreen: false,
      setAttribute: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      contentWindow: {
        location: { href: 'about:blank' },
      },
      parentNode: {
        removeChild: vi.fn(),
      },
    } as any;

    // Mock document.createElement
    vi.mocked(document.createElement).mockReturnValue(mockIframe);
    vi.mocked(document.contains).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createIframe', () => {
    it('应该成功创建 Iframe 实例', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      const instance = await manager.createIframe(config);

      expect(instance).toBeDefined();
      expect(instance.id).toBe('test-iframe');
      expect(instance.config.url).toBe('https://example.com');
      expect(instance.status).toBe(IframeStatus.READY);
      expect(mockIframe.src).toBe('https://example.com');
    });

    it('应该应用默认配置', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      const instance = await manager.createIframe(config);

      expect(instance.config.width).toBe('100%');
      expect(instance.config.height).toBe('600px');
      expect(instance.config.loadTimeout).toBe(30000);
      expect(mockIframe.sandbox.add).toHaveBeenCalledWith(
        IframeSandboxPermission.ALLOW_SCRIPTS,
        IframeSandboxPermission.ALLOW_SAME_ORIGIN,
        IframeSandboxPermission.ALLOW_FORMS
      );
    });

    it('应该设置自定义沙盒权限', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        sandbox: [IframeSandboxPermission.ALLOW_SCRIPTS],
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      expect(mockIframe.sandbox.add).toHaveBeenCalledWith(
        IframeSandboxPermission.ALLOW_SCRIPTS
      );
    });

    it('应该设置自定义样式', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        style: {
          border: 'none',
          borderRadius: '8px',
        },
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      expect(mockIframe.style.border).toBe('none');
      expect(mockIframe.style.borderRadius).toBe('8px');
    });

    it('应该设置自定义属性', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        attributes: {
          'data-test': 'value',
          title: 'Test Iframe',
        },
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      expect(mockIframe.setAttribute).toHaveBeenCalledWith(
        'data-test',
        'value'
      );
      expect(mockIframe.setAttribute).toHaveBeenCalledWith(
        'title',
        'Test Iframe'
      );
    });

    it('应该处理加载超时', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        loadTimeout: 100,
      };

      // 不触发 load 事件，模拟超时
      vi.mocked(mockIframe.addEventListener).mockImplementation(() => {});

      await expect(manager.createIframe(config)).rejects.toThrow(
        'Iframe load timeout after 100ms'
      );
    });

    it('应该处理加载错误', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
      };

      // Mock 加载错误
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'error') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await expect(manager.createIframe(config)).rejects.toThrow(
        'Failed to load iframe'
      );
    });

    it('应该拒绝重复的 ID', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'duplicate-id',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      await expect(manager.createIframe(config)).rejects.toThrow(
        'Iframe with id "duplicate-id" already exists'
      );
    });

    it('应该生成唯一 ID', async () => {
      const config1: IframeConfig = { url: 'https://example.com' };
      const config2: IframeConfig = { url: 'https://example.com' };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      const instance1 = await manager.createIframe(config1);
      const instance2 = await manager.createIframe(config2);

      expect(instance1.id).not.toBe(instance2.id);
      expect(instance1.id).toMatch(/^iframe-\d+-\d+$/);
      expect(instance2.id).toMatch(/^iframe-\d+-\d+$/);
    });
  });

  describe('destroyIframe', () => {
    it('应该成功销毁 Iframe 实例', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      const instance = await manager.createIframe(config);
      expect(manager.getIframe('test-iframe')).toBeDefined();

      await manager.destroyIframe('test-iframe');

      expect(manager.getIframe('test-iframe')).toBeUndefined();
      expect(instance.status).toBe(IframeStatus.DESTROYED);
      expect(mockIframe.parentNode?.removeChild).toHaveBeenCalledWith(
        mockIframe
      );
    });

    it('应该处理不存在的 Iframe ID', async () => {
      await expect(
        manager.destroyIframe('non-existent')
      ).resolves.toBeUndefined();
    });
  });

  describe('getIframe', () => {
    it('应该返回存在的 Iframe 实例', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);
      const instance = manager.getIframe('test-iframe');

      expect(instance).toBeDefined();
      expect(instance?.id).toBe('test-iframe');
    });

    it('应该返回 undefined 对于不存在的 Iframe', () => {
      const instance = manager.getIframe('non-existent');
      expect(instance).toBeUndefined();
    });
  });

  describe('getAllIframes', () => {
    it('应该返回所有 Iframe 实例', async () => {
      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe({
        url: 'https://example1.com',
        id: 'iframe1',
      });
      await manager.createIframe({
        url: 'https://example2.com',
        id: 'iframe2',
      });

      const instances = manager.getAllIframes();

      expect(instances).toHaveLength(2);
      expect(instances.map(i => i.id)).toContain('iframe1');
      expect(instances.map(i => i.id)).toContain('iframe2');
    });

    it('应该返回空数组当没有 Iframe 时', () => {
      const instances = manager.getAllIframes();
      expect(instances).toHaveLength(0);
    });
  });

  describe('checkHealth', () => {
    it('应该返回 false 对于不存在的 Iframe', async () => {
      const isHealthy = await manager.checkHealth('non-existent');
      expect(isHealthy).toBe(false);
    });

    it('应该返回 false 对于已销毁的 Iframe', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);
      await manager.destroyIframe('test-iframe');

      const isHealthy = await manager.checkHealth('test-iframe');
      expect(isHealthy).toBe(false);
    });

    it('应该返回 false 当元素不在 DOM 中', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      // Mock 元素不在 DOM 中
      vi.mocked(document.contains).mockReturnValue(false);

      const isHealthy = await manager.checkHealth('test-iframe');
      expect(isHealthy).toBe(false);

      const instance = manager.getIframe('test-iframe');
      expect(instance?.status).toBe(IframeStatus.ERROR);
      expect(instance?.error).toBe('Iframe element not found in DOM');
    });

    it('应该返回 true 对于健康的 Iframe', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      const isHealthy = await manager.checkHealth('test-iframe');
      expect(isHealthy).toBe(true);

      const instance = manager.getIframe('test-iframe');
      expect(instance?.lastActivity).toBeGreaterThan(0);
    });
  });

  describe('cleanup', () => {
    it('应该清理无效的 Iframe', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      // Mock 元素不在 DOM 中，使其变为无效
      vi.mocked(document.contains).mockReturnValue(false);

      await manager.cleanup();

      expect(manager.getIframe('test-iframe')).toBeUndefined();
    });

    it('应该保留健康的 Iframe', async () => {
      const config: IframeConfig = {
        url: 'https://example.com',
        id: 'test-iframe',
      };

      // Mock 加载成功
      vi.mocked(mockIframe.addEventListener).mockImplementation(
        (event, handler) => {
          if (event === 'load') {
            setTimeout(() => (handler as any)(), 0);
          }
        }
      );

      await manager.createIframe(config);

      await manager.cleanup();

      expect(manager.getIframe('test-iframe')).toBeDefined();
    });
  });
});
