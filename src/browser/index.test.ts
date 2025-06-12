/**
 * @file purpose: 浏览器模块入口测试
 *
 * 测试浏览器模块的导出和基本功能
 */

import { describe, it, expect } from 'vitest';
import { BrowserController } from './index';

describe('浏览器模块', () => {
  describe('模块导出', () => {
    it('应该导出 BrowserController 类', () => {
      expect(BrowserController).toBeDefined();
      expect(typeof BrowserController).toBe('function');
    });

    it('应该能够创建 BrowserController 实例', () => {
      // 在测试环境中，我们需要模拟浏览器环境
      const mockWindow = {
        location: { href: 'http://localhost' },
        history: { length: 1 },
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      const mockDocument = {
        title: 'Test',
        readyState: 'complete',
        hasFocus: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      const mockNavigator = {
        userAgent: 'Test Agent',
      };

      // 临时设置全局对象
      const originalWindow = global.window;
      const originalDocument = global.document;
      const originalNavigator = global.navigator;

      try {
        (global as any).window = mockWindow;
        (global as any).document = mockDocument;
        (global as any).navigator = mockNavigator;

        const controller = new BrowserController();
        expect(controller).toBeInstanceOf(BrowserController);

        // 测试基本方法存在
        expect(typeof controller.getState).toBe('function');
        expect(typeof controller.navigate).toBe('function');
        expect(typeof controller.getViewport).toBe('function');
        expect(typeof controller.destroy).toBe('function');

        controller.destroy();
      } finally {
        // 恢复原始全局对象
        global.window = originalWindow;
        global.document = originalDocument;
        global.navigator = originalNavigator;
      }
    });
  });

  describe('基本功能', () => {
    it('应该能够获取状态', () => {
      const mockWindow = {
        location: { href: 'http://localhost' },
        history: { length: 1 },
        innerWidth: 1024,
        innerHeight: 768,
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      const mockDocument = {
        title: 'Test',
        readyState: 'complete',
        hasFocus: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      };

      const mockNavigator = {
        userAgent: 'Test Agent',
      };

      const originalWindow = global.window;
      const originalDocument = global.document;
      const originalNavigator = global.navigator;

      try {
        (global as any).window = mockWindow;
        (global as any).document = mockDocument;
        (global as any).navigator = mockNavigator;

        const controller = new BrowserController();
        const state = controller.getState();

        expect(state).toBeDefined();
        expect(typeof state.url).toBe('string');
        expect(typeof state.title).toBe('string');
        expect(typeof state.loading).toBe('boolean');

        controller.destroy();
      } finally {
        global.window = originalWindow;
        global.document = originalDocument;
        global.navigator = originalNavigator;
      }
    });
  });
});
