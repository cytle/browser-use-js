/**
 * @file purpose: 可点击元素处理器测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClickableElementProcessor } from './index';

// Mock DOM 环境
const mockElement = (
  tagName: string,
  attributes: Record<string, string> = {}
) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

describe('ClickableElementProcessor', () => {
  let processor: ClickableElementProcessor;
  let container: HTMLElement;

  beforeEach(() => {
    processor = new ClickableElementProcessor();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    processor.dispose(); // 修复：使用正确的方法名
    document.body.removeChild(container);
  });

  describe('findClickableElements', () => {
    it('应该识别标准按钮元素', () => {
      const button = mockElement('button');
      button.textContent = '点击我';
      container.appendChild(button);

      // Mock getBoundingClientRect
      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const clickables = processor.findClickableElements(container);

      expect(clickables).toHaveLength(1);
      expect(clickables[0].tagName).toBe('button');
      expect(clickables[0].textContent).toBe('点击我');
      expect(clickables[0].interactionType).toBe('button');
    });

    it('应该识别链接元素', () => {
      const link = mockElement('a', { href: 'https://example.com' });
      link.textContent = '访问链接';
      container.appendChild(link);

      vi.spyOn(link, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 80,
        height: 20,
        right: 90,
        bottom: 30,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const clickables = processor.findClickableElements(container);

      expect(clickables).toHaveLength(1);
      expect(clickables[0].tagName).toBe('a');
      expect(clickables[0].interactionType).toBe('link');
      expect(clickables[0].capabilities).toContain('navigate');
    });

    it('应该识别输入元素', () => {
      const input = mockElement('input', {
        type: 'text',
        placeholder: '输入文本',
      });
      container.appendChild(input);

      vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 200,
        height: 30,
        right: 210,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const clickables = processor.findClickableElements(container);

      expect(clickables).toHaveLength(1);
      expect(clickables[0].tagName).toBe('input');
      expect(clickables[0].interactionType).toBe('textbox');
      expect(clickables[0].capabilities).toContain('type');
      expect(clickables[0].capabilities).toContain('focus');
    });

    it('应该识别具有点击事件的元素', () => {
      const div = mockElement('div', { onclick: 'handleClick()' });
      div.textContent = '可点击的 div';
      container.appendChild(div);

      vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 150,
        height: 40,
        right: 160,
        bottom: 50,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const clickables = processor.findClickableElements(container);

      expect(clickables).toHaveLength(1);
      expect(clickables[0].analysis.reasons).toContain('具有点击事件监听器');
    });

    it('应该识别 ARIA 角色元素', () => {
      const div = mockElement('div', { role: 'button' });
      div.textContent = 'ARIA 按钮';
      container.appendChild(div);

      vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const clickables = processor.findClickableElements(container);

      expect(clickables).toHaveLength(1);
      expect(clickables[0].interactionType).toBe('button');
      expect(clickables[0].analysis.reasons).toContain('ARIA 角色: button');
    });
  });

  describe('analyzeClickableElement', () => {
    it('应该正确分析按钮元素', () => {
      const button = mockElement('button', { id: 'test-button' });
      button.textContent = '测试按钮';
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const result = processor.analyzeClickableElement(button);

      expect(result).toBeTruthy();
      expect(result!.tagName).toBe('button');
      expect(result!.id).toBe('test-button');
      expect(result!.textContent).toBe('测试按钮');
      expect(result!.analysis.isClickable).toBe(true);
      expect(result!.analysis.confidence).toBeGreaterThan(0.8);
    });

    it('应该检测可访问性信息', () => {
      const button = mockElement('button', {
        'aria-label': '关闭对话框',
        tabindex: '0',
      });
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 30,
        height: 30,
        right: 40,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const result = processor.analyzeClickableElement(button);

      expect(result).toBeTruthy();
      expect(result!.accessibility.ariaLabel).toBe('关闭对话框');
      expect(result!.accessibility.tabIndex).toBe(0);
    });

    it('应该检测禁用状态', () => {
      const button = mockElement('button', { disabled: 'true' });
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const result = processor.analyzeClickableElement(button);

      expect(result).toBeTruthy();
      expect(result!.enabled).toBe(false);
    });
  });

  describe('框架检测', () => {
    it('应该检测 React 组件', () => {
      const div = mockElement('div');
      // 模拟 React 属性
      (div as any).__reactInternalInstance = {};
      container.appendChild(div);

      vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const processor = new ClickableElementProcessor({
        frameworkDetection: true,
      });
      const result = processor.analyzeClickableElement(div);

      if (result) {
        expect(result.framework).toBe('React');
      }
    });

    it('应该检测 Vue 组件', () => {
      const div = mockElement('div', { 'v-on:click': 'handleClick' });
      container.appendChild(div);

      vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const processor = new ClickableElementProcessor({
        frameworkDetection: true,
      });
      const result = processor.analyzeClickableElement(div);

      if (result) {
        expect(result.framework).toBe('Vue');
      }
    });
  });

  describe('性能和缓存', () => {
    it('应该缓存分析结果', () => {
      const button = mockElement('button');
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      // 第一次分析
      const result1 = processor.analyzeClickableElement(button);
      // 第二次分析应该使用缓存
      const result2 = processor.analyzeClickableElement(button);

      expect(result1).toBe(result2); // 应该是同一个对象引用
    });

    it('应该提供缓存统计', () => {
      const button = mockElement('button');
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      processor.analyzeClickableElement(button);
      const stats = processor.getCacheStats();

      expect(stats.cacheSize).toBe(1);
    });
  });

  describe('选择器生成', () => {
    it('应该为有 ID 的元素生成 ID 选择器', () => {
      const button = mockElement('button', { id: 'unique-button' });
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const result = processor.analyzeClickableElement(button);

      expect(result).toBeTruthy();
      expect(result!.selector).toBe('#unique-button');
    });

    it('应该为没有 ID 的元素生成路径选择器', () => {
      const button = mockElement('button', { class: 'btn primary' });
      container.appendChild(button);

      vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 100,
        height: 30,
        right: 110,
        bottom: 40,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      });

      const result = processor.analyzeClickableElement(button);

      expect(result).toBeTruthy();
      expect(result!.selector).toContain('button');
      expect(result!.selector).toContain('btn');
    });
  });
});
