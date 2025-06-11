/**
 * @file purpose: DOM 辅助函数测试
 *
 * 测试 DOM 测试辅助函数的正确性
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockElement,
  createMockInput,
  createMockButton,
  createMockLink,
  setElementBounds,
  mockElementBounds,
  simulateClick,
  simulateType,
  simulateScroll,
  waitForElement,
  cleanupDOM,
  createTestHTML,
  isElementVisible,
  isElementInViewport,
} from './dom-helpers';
import { createMockRectangle } from './mock-factories';

describe('DOM 辅助函数测试', () => {
  beforeEach(() => {
    cleanupDOM();
  });

  describe('元素创建函数', () => {
    it('应该创建基本 DOM 元素', () => {
      const element = createMockElement(
        'div',
        { id: 'test', class: 'container' },
        'Hello World'
      );

      expect(element.tagName.toLowerCase()).toBe('div');
      expect(element.id).toBe('test');
      expect(element.className).toBe('container');
      expect(element.textContent).toBe('Hello World');
    });

    it('应该创建输入元素', () => {
      const input = createMockInput('email', {
        name: 'email',
        required: 'true',
      });

      expect(input.type).toBe('email');
      expect(input.name).toBe('email');
      expect(input.required).toBe(true);
    });

    it('应该创建按钮元素', () => {
      const button = createMockButton('Click Me', { type: 'submit' });

      expect(button.textContent).toBe('Click Me');
      expect(button.type).toBe('submit');
    });

    it('应该创建链接元素', () => {
      const link = createMockLink('https://example.com', 'Example', {
        target: '_blank',
      });

      expect(link.href).toBe('https://example.com/');
      expect(link.textContent).toBe('Example');
      expect(link.target).toBe('_blank');
    });
  });

  describe('元素位置和大小设置', () => {
    it('应该设置元素边界', () => {
      const element = createMockElement('div');
      const rect = createMockRectangle(10, 20, 100, 200);

      setElementBounds(element, rect);

      expect(element.style.position).toBe('absolute');
      expect(element.style.left).toBe('10px');
      expect(element.style.top).toBe('20px');
      expect(element.style.width).toBe('100px');
      expect(element.style.height).toBe('200px');
    });

    it('应该模拟 getBoundingClientRect', () => {
      const element = createMockElement('div');
      const rect = createMockRectangle(10, 20, 100, 200);

      mockElementBounds(element, rect);

      const bounds = element.getBoundingClientRect();
      expect(bounds.x).toBe(10);
      expect(bounds.y).toBe(20);
      expect(bounds.width).toBe(100);
      expect(bounds.height).toBe(200);
      expect(bounds.left).toBe(10);
      expect(bounds.top).toBe(20);
      expect(bounds.right).toBe(110);
      expect(bounds.bottom).toBe(220);
    });
  });

  describe('事件模拟', () => {
    it('应该模拟点击事件', () => {
      const element = createMockElement('button');
      let clicked = false;

      element.addEventListener('click', () => {
        clicked = true;
      });

      simulateClick(element, { x: 50, y: 50 });

      expect(clicked).toBe(true);
    });

    it('应该模拟键盘输入', () => {
      const input = createMockInput('text');
      document.body.appendChild(input);

      simulateType(input, 'Hello');

      expect(input.value).toBe('Hello');
    });

    it('应该模拟滚动事件', () => {
      const element = createMockElement('div');
      let scrolled = false;

      element.addEventListener('wheel', () => {
        scrolled = true;
      });

      simulateScroll(element, 0, 100);

      expect(scrolled).toBe(true);
    });
  });

  describe('DOM 操作工具', () => {
    it('应该等待元素出现', async () => {
      // 延迟添加元素
      setTimeout(() => {
        const element = createMockElement('div', { id: 'delayed' });
        document.body.appendChild(element);
      }, 100);

      const element = await waitForElement('#delayed', 1000);
      expect(element.id).toBe('delayed');
    });

    it('应该在超时时抛出错误', async () => {
      await expect(waitForElement('#nonexistent', 100)).rejects.toThrow(
        'Element with selector "#nonexistent" not found within 100ms'
      );
    });

    it('应该创建测试 HTML 结构', () => {
      const html = '<div class="test"><p>Test content</p></div>';
      const container = createTestHTML(html);

      expect(container.querySelector('.test')).toBeTruthy();
      expect(container.querySelector('p')?.textContent).toBe('Test content');
    });

    it('应该清理 DOM', () => {
      document.body.innerHTML = '<div>Test</div>';
      document.head.innerHTML = '<title>Test</title>';

      cleanupDOM();

      expect(document.body.innerHTML).toBe('');
      expect(document.head.innerHTML).toBe('');
    });
  });

  describe('可见性检查', () => {
    it('应该检查元素可见性', () => {
      const visibleElement = createMockElement('div');
      // 在 jsdom 中需要显式设置这些属性
      Object.defineProperty(visibleElement, 'offsetWidth', {
        value: 100,
        writable: true,
      });
      Object.defineProperty(visibleElement, 'offsetHeight', {
        value: 100,
        writable: true,
      });
      visibleElement.style.width = '100px';
      visibleElement.style.height = '100px';
      document.body.appendChild(visibleElement);

      const hiddenElement = createMockElement('div');
      hiddenElement.style.display = 'none';
      Object.defineProperty(hiddenElement, 'offsetWidth', {
        value: 0,
        writable: true,
      });
      Object.defineProperty(hiddenElement, 'offsetHeight', {
        value: 0,
        writable: true,
      });
      document.body.appendChild(hiddenElement);

      expect(isElementVisible(visibleElement)).toBe(true);
      expect(isElementVisible(hiddenElement)).toBe(false);
    });

    it('应该检查元素是否在视口内', () => {
      const element = createMockElement('div');
      mockElementBounds(element, createMockRectangle(10, 10, 100, 100));

      // 模拟窗口大小
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 768,
        writable: true,
      });

      expect(isElementInViewport(element)).toBe(true);

      // 测试超出视口的元素
      mockElementBounds(element, createMockRectangle(2000, 2000, 100, 100));
      expect(isElementInViewport(element)).toBe(false);
    });
  });
});
