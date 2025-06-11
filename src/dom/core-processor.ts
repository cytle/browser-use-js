/**
 * @file purpose: DOM 核心处理器 - 实现 DOM 树分析、元素选择器生成和页面结构理解
 *
 * 这个文件包含了 DOM 处理的核心功能，为 AI 代理提供了理解和分析网页结构的能力。
 * 支持现代 Web 标准，包括 Shadow DOM，并针对大型 DOM 树进行了性能优化。
 */

/* eslint-env browser */

import type {
  ElementInfo,
  DOMAnalysisResult,
  ProcessorOptions,
  PageStructure,
} from '../types';

/**
 * DOM 核心处理器类
 * 负责 DOM 树的分析、遍历和选择器生成
 */
export class DOMCoreProcessor {
  private readonly options: ProcessorOptions;
  private readonly cache = new Map<Element, ElementInfo>();
  private readonly selectorCache = new Map<Element, string>();

  constructor(options: Partial<ProcessorOptions> = {}) {
    this.options = {
      maxDepth: 50,
      enableCache: true,
      includeShadowDOM: true,
      performanceMode: false,
      ...options,
    };
  }

  /**
   * 分析整个 DOM 树结构
   * @param root - 根元素，默认为 document.documentElement
   * @returns DOM 分析结果
   */
  public analyzeDOMTree(
    root: Element = document.documentElement
  ): DOMAnalysisResult {
    // eslint-disable-next-line no-undef
    const startTime =
      typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      const elements = this.traverseDOM(root);
      const interactiveElements = elements.filter(el => el.interactive);
      const visibleElements = elements.filter(el => el.visible);

      const result: DOMAnalysisResult = {
        totalElements: elements.length,
        interactiveElements: interactiveElements.length,
        visibleElements: visibleElements.length,
        elements,
        structure: this.analyzeStructure(root),
        // eslint-disable-next-line no-undef
        processingTime:
          (typeof performance !== 'undefined'
            ? performance.now()
            : Date.now()) - startTime,
      };

      return result;
    } catch (error) {
      console.error('DOM 分析失败:', error);
      throw new Error(
        `DOM 分析失败: ${error instanceof Error ? error.message : '未知错误'}`
      );
    }
  }

  /**
   * 遍历 DOM 树，收集所有元素信息
   * @param root - 根元素
   * @param depth - 当前深度
   * @returns 元素信息数组
   */
  private traverseDOM(root: Element, depth: number = 0): ElementInfo[] {
    const elements: ElementInfo[] = [];

    if (depth > this.options.maxDepth) {
      return elements;
    }

    // 处理当前元素
    const elementInfo = this.analyzeElement(root);
    if (elementInfo) {
      elements.push(elementInfo);
    }

    // 遍历子元素
    const children = Array.from(root.children);
    for (const child of children) {
      elements.push(...this.traverseDOM(child, depth + 1));
    }

    // 处理 Shadow DOM
    if (this.options.includeShadowDOM && root.shadowRoot) {
      const shadowChildren = Array.from(root.shadowRoot.children);
      for (const shadowChild of shadowChildren) {
        elements.push(...this.traverseDOM(shadowChild, depth + 1));
      }
    }

    return elements;
  }

  /**
   * 分析单个元素
   * @param element - 要分析的元素
   * @returns 元素信息
   */
  private analyzeElement(element: Element): ElementInfo | null {
    try {
      // 检查缓存
      if (this.options.enableCache && this.cache.has(element)) {
        return this.cache.get(element)!;
      }

      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      const elementInfo: ElementInfo = {
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        textContent: this.getCleanTextContent(element),
        visible: this.isElementVisible(element, rect, computedStyle),
        interactive: this.isElementInteractive(element),
        selector: this.generateSelector(element),
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
        attributes: this.getRelevantAttributes(element),
        role: element.getAttribute('role') || this.inferRole(element),
        ariaLabel: element.getAttribute('aria-label') || undefined,
      };

      // 缓存结果
      if (this.options.enableCache) {
        this.cache.set(element, elementInfo);
      }

      return elementInfo;
    } catch (error) {
      console.warn('分析元素失败:', element, error);
      return null;
    }
  }

  /**
   * 生成元素的唯一选择器
   * @param element - 目标元素
   * @returns CSS 选择器字符串
   */
  public generateSelector(element: Element): string {
    // 检查缓存
    if (this.options.enableCache && this.selectorCache.has(element)) {
      return this.selectorCache.get(element)!;
    }

    let selector = '';

    // 优先使用 ID
    if (element.id) {
      // 在测试环境中 CSS.escape 可能不存在，使用简单的转义
      const escapeId =
        typeof CSS !== 'undefined' && CSS.escape
          ? CSS.escape(element.id)
          : element.id.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
      selector = `#${escapeId}`;
    } else {
      // 构建路径选择器
      const path: string[] = [];
      let current: Element | null = element;

      while (current && current !== document.documentElement) {
        let selectorPart = current.tagName.toLowerCase();

        // 添加类名（如果有且不太长）
        if (current.className && current.className.length < 50) {
          const classes = current.className
            .trim()
            .split(/\s+/)
            .filter(cls => cls && /^[a-zA-Z][\w-]*$/.test(cls))
            .slice(0, 3); // 最多使用 3 个类名

          if (classes.length > 0) {
            const escapeClass = (cls: string) =>
              typeof CSS !== 'undefined' && CSS.escape
                ? CSS.escape(cls)
                : cls.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
            selectorPart += '.' + classes.map(escapeClass).join('.');
          }
        }

        // 添加 nth-child 以确保唯一性
        const siblings = Array.from(
          current.parentElement?.children || []
        ).filter(sibling => sibling.tagName === current!.tagName);

        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selectorPart += `:nth-child(${index})`;
        }

        path.unshift(selectorPart);
        current = current.parentElement;
      }

      selector = path.join(' > ');
    }

    // 验证选择器的唯一性
    try {
      const found = document.querySelectorAll(selector);
      if (found.length !== 1 || found[0] !== element) {
        // 如果选择器不唯一，添加更多特征
        selector = this.generateFallbackSelector(element);
      }
    } catch (error) {
      console.warn('选择器验证失败:', selector, error);
      selector = this.generateFallbackSelector(element);
    }

    // 缓存结果
    if (this.options.enableCache) {
      this.selectorCache.set(element, selector);
    }

    return selector;
  }

  /**
   * 生成备用选择器（当主选择器不唯一时）
   * @param element - 目标元素
   * @returns 备用选择器
   */
  private generateFallbackSelector(element: Element): string {
    const attributes = ['data-testid', 'data-id', 'name', 'type', 'role'];

    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value) {
        const escapeValue =
          typeof CSS !== 'undefined' && CSS.escape
            ? CSS.escape(value)
            : value.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
        const selector = `${element.tagName.toLowerCase()}[${attr}="${escapeValue}"]`;
        try {
          const found = document.querySelectorAll(selector);
          if (found.length === 1 && found[0] === element) {
            return selector;
          }
        } catch {
          continue;
        }
      }
    }

    // 最后的备用方案：使用 XPath 风格的路径
    return this.generateXPathStyleSelector(element);
  }

  /**
   * 生成 XPath 风格的选择器
   * @param element - 目标元素
   * @returns XPath 风格的选择器
   */
  private generateXPathStyleSelector(element: Element): string {
    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentElement?.children || []).filter(
        sibling => sibling.tagName === current!.tagName
      );

      const index = siblings.indexOf(current) + 1;
      path.unshift(`${tagName}:nth-of-type(${index})`);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * 检查元素是否可见
   * @param element - 要检查的元素
   * @param rect - 元素的边界矩形
   * @param computedStyle - 计算样式
   * @returns 是否可见
   */
  private isElementVisible(
    _element: Element,
    rect: DOMRect,
    computedStyle: CSSStyleDeclaration
  ): boolean {
    // 检查基本可见性
    if (rect.width === 0 || rect.height === 0) return false;
    if (computedStyle.display === 'none') return false;
    if (computedStyle.visibility === 'hidden') return false;
    if (computedStyle.opacity === '0') return false;

    // 检查是否在视口内
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    const isInViewport =
      rect.left < viewport.width &&
      rect.right > 0 &&
      rect.top < viewport.height &&
      rect.bottom > 0;

    return isInViewport;
  }

  /**
   * 检查元素是否可交互
   * @param element - 要检查的元素
   * @returns 是否可交互
   */
  private isElementInteractive(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();

    // 标准交互元素
    const interactiveTags = [
      'a',
      'button',
      'input',
      'select',
      'textarea',
      'label',
      'details',
      'summary',
      'dialog',
    ];

    if (interactiveTags.includes(tagName)) {
      return true;
    }

    // 检查是否有交互属性
    if (
      element.hasAttribute('onclick') ||
      element.hasAttribute('onmousedown') ||
      element.hasAttribute('onmouseup') ||
      element.hasAttribute('tabindex')
    ) {
      return true;
    }

    // 检查 ARIA 角色
    const role = element.getAttribute('role');
    const interactiveRoles = [
      'button',
      'link',
      'menuitem',
      'option',
      'radio',
      'checkbox',
      'tab',
      'switch',
      'slider',
    ];

    if (role && interactiveRoles.includes(role)) {
      return true;
    }

    // 检查是否有事件监听器（这个检查比较昂贵，在性能模式下跳过）
    if (!this.options.performanceMode) {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.cursor === 'pointer') {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取清理后的文本内容
   * @param element - 目标元素
   * @returns 清理后的文本内容
   */
  private getCleanTextContent(element: Element): string {
    const text = element.textContent || '';
    return text.trim().replace(/\s+/g, ' ').substring(0, 200); // 限制长度
  }

  /**
   * 获取相关属性
   * @param element - 目标元素
   * @returns 属性对象
   */
  private getRelevantAttributes(element: Element): Record<string, string> {
    const relevantAttrs = [
      'type',
      'name',
      'value',
      'placeholder',
      'title',
      'alt',
      'href',
      'src',
      'data-testid',
      'data-id',
      'role',
    ];

    const attributes: Record<string, string> = {};

    for (const attr of relevantAttrs) {
      const value = element.getAttribute(attr);
      if (value) {
        attributes[attr] = value;
      }
    }

    return attributes;
  }

  /**
   * 推断元素的语义角色
   * @param element - 目标元素
   * @returns 推断的角色
   */
  private inferRole(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    const roleMap: Record<string, string> = {
      button: 'button',
      a: 'link',
      input: this.inferInputRole(element as HTMLInputElement),
      select: 'combobox',
      textarea: 'textbox',
      img: 'image',
      nav: 'navigation',
      main: 'main',
      header: 'banner',
      footer: 'contentinfo',
      aside: 'complementary',
      section: 'region',
      article: 'article',
      h1: 'heading',
      h2: 'heading',
      h3: 'heading',
      h4: 'heading',
      h5: 'heading',
      h6: 'heading',
    };

    return roleMap[tagName] || 'generic';
  }

  /**
   * 推断输入元素的角色
   * @param input - 输入元素
   * @returns 推断的角色
   */
  private inferInputRole(input: HTMLInputElement): string {
    const type = (input.type || 'text').toLowerCase();

    const inputRoleMap: Record<string, string> = {
      button: 'button',
      submit: 'button',
      reset: 'button',
      checkbox: 'checkbox',
      radio: 'radio',
      range: 'slider',
      text: 'textbox',
      email: 'textbox',
      password: 'textbox',
      search: 'searchbox',
      tel: 'textbox',
      url: 'textbox',
      number: 'spinbutton',
    };

    return inputRoleMap[type] || 'textbox';
  }

  /**
   * 分析页面结构
   * @param root - 根元素
   * @returns 结构分析结果
   */
  private analyzeStructure(root: Element): PageStructure {
    const structure: PageStructure = {
      landmarks: this.findLandmarks(root),
      headings: this.findHeadings(root),
      forms: this.findForms(root),
      navigation: this.findNavigation(root),
    };

    return structure;
  }

  /**
   * 查找页面地标
   * @param root - 根元素
   * @returns 地标元素数组
   */
  private findLandmarks(root: Element): ElementInfo[] {
    const landmarkSelectors = [
      'main',
      'nav',
      'header',
      'footer',
      'aside',
      'section',
      '[role="main"]',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '[role="complementary"]',
      '[role="region"]',
    ];

    const landmarks: ElementInfo[] = [];

    for (const selector of landmarkSelectors) {
      try {
        const elements = root.querySelectorAll(selector);
        for (const element of elements) {
          const info = this.analyzeElement(element);
          if (info) {
            landmarks.push(info);
          }
        }
      } catch (error) {
        console.warn(`查找地标失败: ${selector}`, error);
      }
    }

    return landmarks;
  }

  /**
   * 查找标题元素
   * @param root - 根元素
   * @returns 标题元素数组
   */
  private findHeadings(root: Element): ElementInfo[] {
    const headings: ElementInfo[] = [];
    const headingElements = root.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, [role="heading"]'
    );

    for (const element of headingElements) {
      const info = this.analyzeElement(element);
      if (info) {
        headings.push(info);
      }
    }

    return headings.sort((a, b) => {
      const levelA = this.getHeadingLevel(a.tagName);
      const levelB = this.getHeadingLevel(b.tagName);
      return levelA - levelB;
    });
  }

  /**
   * 获取标题级别
   * @param tagName - 标签名
   * @returns 标题级别
   */
  private getHeadingLevel(tagName: string): number {
    const match = tagName.match(/h(\d)/);
    return match ? parseInt(match[1]) : 7;
  }

  /**
   * 查找表单元素
   * @param root - 根元素
   * @returns 表单元素数组
   */
  private findForms(root: Element): ElementInfo[] {
    const forms: ElementInfo[] = [];
    const formElements = root.querySelectorAll('form');

    for (const element of formElements) {
      const info = this.analyzeElement(element);
      if (info) {
        forms.push(info);
      }
    }

    return forms;
  }

  /**
   * 查找导航元素
   * @param root - 根元素
   * @returns 导航元素数组
   */
  private findNavigation(root: Element): ElementInfo[] {
    const navigation: ElementInfo[] = [];
    const navElements = root.querySelectorAll('nav, [role="navigation"]');

    for (const element of navElements) {
      const info = this.analyzeElement(element);
      if (info) {
        navigation.push(info);
      }
    }

    return navigation;
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.selectorCache.clear();
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  public getCacheStats(): { elementCache: number; selectorCache: number } {
    return {
      elementCache: this.cache.size,
      selectorCache: this.selectorCache.size,
    };
  }
}
