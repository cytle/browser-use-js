/**
 * @file DOM 核心处理器测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMCoreProcessor } from './core-processor';
import { createMockElement, createTestHTML } from '../test/utils/dom-helpers';

describe('DOMCoreProcessor', () => {
  let processor: DOMCoreProcessor;

  beforeEach(() => {
    processor = new DOMCoreProcessor();
  });

  afterEach(() => {
    processor.clearCache();
  });

  describe('构造函数', () => {
    it('应该使用默认选项创建处理器', () => {
      const defaultProcessor = new DOMCoreProcessor();
      expect(defaultProcessor).toBeInstanceOf(DOMCoreProcessor);
    });

    it('应该接受自定义选项', () => {
      const customProcessor = new DOMCoreProcessor({
        maxDepth: 10,
        enableCache: false,
        performanceMode: true,
      });
      expect(customProcessor).toBeInstanceOf(DOMCoreProcessor);
    });
  });

  describe('analyzeDOMTree', () => {
    it('应该分析简单的 DOM 树', () => {
      // 创建测试 DOM 结构
      const container = createMockElement('div', {
        id: 'container',
        innerHTML: `
          <h1>标题</h1>
          <button id="btn1">按钮1</button>
          <input type="text" placeholder="输入框" />
          <a href="#" id="link1">链接</a>
        `,
      });

      const result = processor.analyzeDOMTree(container);

      expect(result).toMatchObject({
        totalElements: expect.any(Number),
        interactiveElements: expect.any(Number),
        visibleElements: expect.any(Number),
        elements: expect.any(Array),
        structure: expect.any(Object),
        processingTime: expect.any(Number),
      });

      expect(result.totalElements).toBeGreaterThan(0);
      expect(result.elements.length).toBe(result.totalElements);
    });

    it('应该正确识别交互元素', () => {
      const container = createTestHTML(`
        <button>按钮</button>
        <input type="text" />
        <a href="#">链接</a>
        <div>普通文本</div>
        <span onclick="test()">可点击文本</span>
      `);

      const result = processor.analyzeDOMTree(container);
      const interactiveElements = result.elements.filter(el => el.interactive);

      expect(interactiveElements.length).toBeGreaterThanOrEqual(4); // button, input, a, span with onclick
    });

    it('应该处理错误情况', () => {
      // 模拟一个会抛出错误的元素
      const mockElement = {
        children: [],
        shadowRoot: null,
        getBoundingClientRect: () => {
          throw new Error('测试错误');
        },
      } as unknown as Element;

      expect(() => {
        processor.analyzeDOMTree(mockElement);
      }).toThrow('DOM 分析失败');
    });
  });

  describe('generateSelector', () => {
    it('应该为有 ID 的元素生成 ID 选择器', () => {
      const element = createMockElement('div', { id: 'unique-id' });
      const selector = processor.generateSelector(element);

      expect(selector).toBe('#unique-id');
    });

    it('应该为没有 ID 的元素生成路径选择器', () => {
      const container = createTestHTML(
        '<section><article><p>测试文本</p></article></section>'
      );

      const paragraph = container.querySelector('p')!;
      const selector = processor.generateSelector(paragraph);

      expect(selector).toContain('p');
      expect(selector).toMatch(/.*p.*/); // 应该包含 p 标签
    });

    it('应该处理包含类名的元素', () => {
      const element = createMockElement('div', {
        className: 'test-class another-class',
      });

      const selector = processor.generateSelector(element);
      expect(selector).toContain('test-class');
    });

    it('应该处理特殊字符', () => {
      const element = createMockElement('div', {
        id: 'test:id.with-special_chars',
      });

      const selector = processor.generateSelector(element);
      expect(selector).toMatch(/^#.*test.*id.*with-special.*chars.*$/);
    });
  });

  describe('元素可见性检测', () => {
    it('应该正确检测可见元素', () => {
      const visibleElement = createMockElement('div', {
        style: 'width: 100px; height: 100px; display: block;',
      });

      // 模拟 getBoundingClientRect 返回可见区域
      vi.spyOn(visibleElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      const result = processor.analyzeDOMTree(visibleElement);
      const elementInfo = result.elements.find(el => el.tagName === 'div');

      expect(elementInfo?.visible).toBe(true);
    });

    it('应该正确检测隐藏元素', () => {
      const hiddenElement = createMockElement('div', {
        style: 'display: none;',
      });

      // 模拟 getBoundingClientRect 返回零尺寸
      vi.spyOn(hiddenElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      const result = processor.analyzeDOMTree(hiddenElement);
      const elementInfo = result.elements.find(el => el.tagName === 'div');

      expect(elementInfo?.visible).toBe(false);
    });
  });

  describe('页面结构分析', () => {
    it('应该识别页面地标', () => {
      const container = createTestHTML(`
        <header>页头</header>
        <nav>导航</nav>
        <main>主内容</main>
        <aside>侧边栏</aside>
        <footer>页脚</footer>
      `);

      const result = processor.analyzeDOMTree(container);

      expect(result.structure.landmarks.length).toBeGreaterThan(0);

      const landmarkTags = result.structure.landmarks.map(el => el.tagName);
      expect(landmarkTags).toContain('header');
      expect(landmarkTags).toContain('nav');
      expect(landmarkTags).toContain('main');
      expect(landmarkTags).toContain('aside');
      expect(landmarkTags).toContain('footer');
    });

    it('应该识别标题层次结构', () => {
      const container = createTestHTML(`
        <h1>一级标题</h1>
        <h2>二级标题</h2>
        <h3>三级标题</h3>
        <h2>另一个二级标题</h2>
      `);

      const result = processor.analyzeDOMTree(container);

      expect(result.structure.headings.length).toBe(4);

      // 检查标题是否按级别排序
      const headingLevels = result.structure.headings.map(h => h.tagName);
      expect(headingLevels[0]).toBe('h1');
      expect(headingLevels[1]).toBe('h2');
    });

    it('应该识别表单元素', () => {
      const container = createTestHTML(`
        <form id="form1">
          <input type="text" name="username" />
          <input type="password" name="password" />
          <button type="submit">提交</button>
        </form>
        <form id="form2">
          <textarea name="comment"></textarea>
        </form>
      `);

      const result = processor.analyzeDOMTree(container);

      expect(result.structure.forms.length).toBe(2);
      expect(result.structure.forms[0].tagName).toBe('form');
    });
  });

  describe('缓存功能', () => {
    it('应该缓存元素分析结果', () => {
      const element = createMockElement('div', { id: 'test' });

      // 第一次分析
      processor.analyzeDOMTree(element);
      const stats1 = processor.getCacheStats();

      // 第二次分析同一个元素
      processor.analyzeDOMTree(element);
      const stats2 = processor.getCacheStats();

      expect(stats1.elementCache).toBeGreaterThan(0);
      expect(stats2.elementCache).toBe(stats1.elementCache); // 缓存大小不应该增加
    });

    it('应该能够清理缓存', () => {
      const element = createMockElement('div', { id: 'test' });

      processor.analyzeDOMTree(element);
      expect(processor.getCacheStats().elementCache).toBeGreaterThan(0);

      processor.clearCache();
      expect(processor.getCacheStats().elementCache).toBe(0);
      expect(processor.getCacheStats().selectorCache).toBe(0);
    });
  });

  describe('性能模式', () => {
    it('在性能模式下应该跳过昂贵的检查', () => {
      const performanceProcessor = new DOMCoreProcessor({
        performanceMode: true,
      });

      const element = createMockElement('div', {
        style: 'cursor: pointer;',
        innerHTML: '<span>测试内容</span>',
      });

      const result = performanceProcessor.analyzeDOMTree(element);
      expect(result.processingTime).toBeDefined();
    });
  });

  describe('Shadow DOM 支持', () => {
    it('应该处理 Shadow DOM', () => {
      const element = createMockElement('div');

      // 模拟 Shadow DOM
      const mockShadowRoot = {
        children: [createMockElement('p', { textContent: 'Shadow 内容' })],
      };

      Object.defineProperty(element, 'shadowRoot', {
        value: mockShadowRoot,
        configurable: true,
      });

      const result = processor.analyzeDOMTree(element);

      // 应该包含 Shadow DOM 中的元素
      expect(result.totalElements).toBeGreaterThan(1);
    });

    it('应该能够禁用 Shadow DOM 处理', () => {
      const noShadowProcessor = new DOMCoreProcessor({
        includeShadowDOM: false,
      });

      const element = createMockElement('div');
      const mockShadowRoot = {
        children: [createMockElement('p')],
      };

      Object.defineProperty(element, 'shadowRoot', {
        value: mockShadowRoot,
        configurable: true,
      });

      const result = noShadowProcessor.analyzeDOMTree(element);

      // 不应该包含 Shadow DOM 中的元素
      expect(result.totalElements).toBe(1);
    });
  });

  describe('错误处理', () => {
    it('应该优雅地处理损坏的 DOM 元素', () => {
      const brokenElement = {
        tagName: 'DIV',
        children: [],
        shadowRoot: null,
        getBoundingClientRect: () => {
          throw new Error('DOM 错误');
        },
        getAttribute: () => null,
        hasAttribute: () => false,
        textContent: null,
        id: '',
        className: '',
      } as unknown as Element;

      expect(() => {
        processor.analyzeDOMTree(brokenElement);
      }).toThrow();
    });

    it('应该处理无效的选择器', () => {
      const element = createMockElement('div', {
        id: 'invalid[selector]',
      });

      const selector = processor.generateSelector(element);
      expect(selector).toBeDefined();
      expect(typeof selector).toBe('string');
    });
  });
});
