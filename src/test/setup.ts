/**
 * Vitest 测试环境设置文件
 * 配置全局测试环境和工具
 */

import { beforeEach, afterEach, vi } from 'vitest';

// 全局测试设置
beforeEach(() => {
  // 清理 DOM
  document.body.innerHTML = '';

  // 重置所有模拟
  vi.clearAllMocks();

  // 设置默认的 viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
});

afterEach(() => {
  // 清理定时器
  vi.clearAllTimers();

  // 恢复所有模拟
  vi.restoreAllMocks();
});

// 模拟浏览器 API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟 ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟 requestAnimationFrame
global.requestAnimationFrame = vi
  .fn()
  .mockImplementation(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = vi
  .fn()
  .mockImplementation(id => clearTimeout(id));

// 模拟 console 方法（可选，用于测试时减少噪音）
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    // 保留 error 和 warn，但可以静默 log
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  };
}

// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000,
});

// 全局测试工具函数
declare global {
  const createMockElement: (
    tagName: string,
    attributes?: Record<string, string>
  ) => HTMLElement;
}

// 创建模拟 DOM 元素的工具函数
(globalThis as any).createMockElement = (
  tagName: string,
  attributes: Record<string, string> = {}
): HTMLElement => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};
