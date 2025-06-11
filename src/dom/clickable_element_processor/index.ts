/**
 * @file purpose: 可点击元素处理器 - 智能识别和处理页面中的可交互元素
 *
 * 这个模块负责识别页面中所有可交互的元素，包括标准 HTML 元素和现代框架组件。
 * 它提供了精确的可点击性检测、区域计算和状态监控功能。
 */

import type {
  ClickableElementInfo,
  ClickabilityAnalysis,
  InteractionCapability,
} from '../../types';

/**
 * 可点击元素处理器配置
 */
export interface ClickableProcessorOptions {
  /** 是否包含隐藏元素 */
  includeHidden?: boolean;
  /** 最小可点击区域（像素） */
  minClickableArea?: number;
  /** 是否启用深度扫描（包括 Shadow DOM） */
  enableDeepScan?: boolean;
  /** 性能模式（跳过一些昂贵的检查） */
  performanceMode?: boolean;
  /** 框架检测模式 */
  frameworkDetection?: boolean;
}

/**
 * 可点击元素处理器类
 * 负责识别、分析和管理页面中的可交互元素
 */
export class ClickableElementProcessor {
  private readonly options: Required<ClickableProcessorOptions>;
  private readonly cache = new Map<Element, ClickableElementInfo>();
  private readonly observedElements = new Set<Element>();
  private mutationObserver?: MutationObserver;

  constructor(options: ClickableProcessorOptions = {}) {
    this.options = {
      includeHidden: false,
      minClickableArea: 16, // 16x16 像素最小点击区域
      enableDeepScan: true,
      performanceMode: false,
      frameworkDetection: true,
      ...options,
    };

    this.setupMutationObserver();
  }

  /**
   * 查找页面中所有可点击元素
   * @param root - 根元素，默认为 document.body
   * @returns 可点击元素信息数组
   */
  public findClickableElements(
    root: Element = document.body
  ): ClickableElementInfo[] {
    const startTime = performance.now();
    const clickableElements: ClickableElementInfo[] = [];

    try {
      // 遍历所有元素
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode: node => {
          const element = node as Element;
          return this.isElementCandidate(element)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      });

      let currentNode = walker.nextNode() as Element;
      while (currentNode) {
        const clickableInfo = this.analyzeClickableElement(currentNode);
        if (clickableInfo) {
          clickableElements.push(clickableInfo);
        }
        currentNode = walker.nextNode() as Element;
      }

      // 处理 Shadow DOM（如果启用）
      if (this.options.enableDeepScan) {
        clickableElements.push(...this.findShadowDOMClickables(root));
      }

      // 性能日志
      const processingTime = performance.now() - startTime;
      if (processingTime > 100) {
        console.warn(`可点击元素识别耗时过长: ${processingTime.toFixed(2)}ms`);
      }

      return clickableElements;
    } catch (error) {
      console.error('查找可点击元素失败:', error);
      return [];
    }
  }

  /**
   * 分析单个元素的可点击性
   * @param element - 要分析的元素
   * @returns 可点击元素信息
   */
  public analyzeClickableElement(
    element: Element
  ): ClickableElementInfo | null {
    try {
      // 检查缓存
      if (this.cache.has(element)) {
        return this.cache.get(element)!;
      }

      const analysis = this.performClickabilityAnalysis(element);
      if (!analysis.isClickable) {
        return null;
      }

      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);

      const clickableInfo: ClickableElementInfo = {
        element,
        tagName: element.tagName.toLowerCase(),
        id: element.id || undefined,
        className: element.className || undefined,
        textContent: this.getElementText(element),
        selector: this.generateUniqueSelector(element),
        position: {
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        },
        clickableArea: this.calculateClickableArea(element, rect),
        interactionType: this.determineInteractionType(element),
        capabilities: this.analyzeInteractionCapabilities(element),
        accessibility: this.analyzeAccessibility(element),
        framework: this.detectFramework(element),
        visible: this.isElementVisible(element, rect, computedStyle),
        enabled: this.isElementEnabled(element),
        analysis,
        interactive: true,
        attributes: this.getRelevantAttributes(element),
        role: element.getAttribute('role') || this.inferRole(element),
        ariaLabel: element.getAttribute('aria-label') || undefined,
      };

      // 缓存结果
      this.cache.set(element, clickableInfo);

      return clickableInfo;
    } catch (error) {
      console.warn('分析可点击元素失败:', element, error);
      return null;
    }
  }

  /**
   * 执行可点击性分析
   * @param element - 要分析的元素
   * @returns 可点击性分析结果
   */
  private performClickabilityAnalysis(element: Element): ClickabilityAnalysis {
    const analysis: ClickabilityAnalysis = {
      isClickable: false,
      confidence: 0,
      reasons: [],
      warnings: [],
    };

    // 检查标准可交互元素
    if (this.isStandardInteractiveElement(element)) {
      analysis.isClickable = true;
      analysis.confidence += 0.9;
      analysis.reasons.push('标准交互元素');
    }

    // 检查事件监听器
    if (this.hasClickEventListeners(element)) {
      analysis.isClickable = true;
      analysis.confidence += 0.8;
      analysis.reasons.push('具有点击事件监听器');
    }

    // 检查 ARIA 角色
    const ariaRole = element.getAttribute('role');
    if (ariaRole && this.isInteractiveRole(ariaRole)) {
      analysis.isClickable = true;
      analysis.confidence += 0.7;
      analysis.reasons.push(`ARIA 角色: ${ariaRole}`);
    }

    // 检查 CSS 样式
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.cursor === 'pointer') {
      analysis.isClickable = true;
      analysis.confidence += 0.6;
      analysis.reasons.push('指针光标样式');
    }

    // 检查 tabindex
    if (element.hasAttribute('tabindex')) {
      analysis.confidence += 0.3;
      analysis.reasons.push('可聚焦元素');
    }

    // 框架组件检测
    if (this.options.frameworkDetection) {
      const frameworkInfo = this.detectFrameworkComponent(element);
      if (frameworkInfo.isComponent) {
        analysis.isClickable = true;
        analysis.confidence += 0.5;
        analysis.reasons.push(`${frameworkInfo.framework} 组件`);
      }
    }

    // 检查可见性
    const rect = element.getBoundingClientRect();
    if (!this.isElementVisible(element, rect, computedStyle)) {
      if (!this.options.includeHidden) {
        analysis.isClickable = false;
      }
      analysis.warnings.push('元素不可见');
    }

    // 检查可点击区域
    const area = rect.width * rect.height;
    if (area < this.options.minClickableArea) {
      analysis.warnings.push('可点击区域过小');
      analysis.confidence *= 0.8;
    }

    // 检查是否被遮挡
    if (this.isElementObscured(element)) {
      analysis.warnings.push('元素被遮挡');
      analysis.confidence *= 0.7;
    }

    // 标准化置信度
    analysis.confidence = Math.min(1, analysis.confidence);

    return analysis;
  }

  /**
   * 检查元素是否为候选元素
   * @param element - 要检查的元素
   * @returns 是否为候选元素
   */
  private isElementCandidate(element: Element): boolean {
    // 跳过脚本和样式元素
    const tagName = element.tagName.toLowerCase();
    if (['script', 'style', 'meta', 'link', 'title'].includes(tagName)) {
      return false;
    }

    // 在性能模式下，只检查明显的交互元素
    if (this.options.performanceMode) {
      return this.isStandardInteractiveElement(element);
    }

    return true;
  }

  /**
   * 检查是否为标准交互元素
   * @param element - 要检查的元素
   * @returns 是否为标准交互元素
   */
  private isStandardInteractiveElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
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

    // 检查特殊的 input 类型
    if (tagName === 'input') {
      const type = (element as HTMLInputElement).type?.toLowerCase();
      const nonInteractiveTypes = ['hidden'];
      return !nonInteractiveTypes.includes(type);
    }

    return false;
  }

  /**
   * 检查元素是否有点击事件监听器
   * @param element - 要检查的元素
   * @returns 是否有点击事件监听器
   */
  private hasClickEventListeners(element: Element): boolean {
    // 检查内联事件处理器
    const inlineEvents = [
      'onclick',
      'onmousedown',
      'onmouseup',
      'ontouchstart',
      'ontouchend',
    ];

    for (const event of inlineEvents) {
      if (element.hasAttribute(event)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 检查 ARIA 角色是否为交互性角色
   * @param role - ARIA 角色
   * @returns 是否为交互性角色
   */
  private isInteractiveRole(role: string): boolean {
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
      'spinbutton',
      'textbox',
      'combobox',
      'listbox',
      'tree',
      'grid',
      'treegrid',
    ];

    return interactiveRoles.includes(role.toLowerCase());
  }

  /**
   * 检测框架组件
   * @param element - 要检查的元素
   * @returns 框架信息
   */
  private detectFrameworkComponent(element: Element): {
    isComponent: boolean;
    framework?: string;
  } {
    // React 组件检测
    if (this.isReactComponent(element)) {
      return { isComponent: true, framework: 'React' };
    }

    // Vue 组件检测
    if (this.isVueComponent(element)) {
      return { isComponent: true, framework: 'Vue' };
    }

    // Angular 组件检测
    if (this.isAngularComponent(element)) {
      return { isComponent: true, framework: 'Angular' };
    }

    return { isComponent: false };
  }

  /**
   * 检测 React 组件
   * @param element - 要检查的元素
   * @returns 是否为 React 组件
   */
  private isReactComponent(element: Element): boolean {
    // 检查 React 特有的属性
    const reactKeys = Object.keys(element).filter(key =>
      key.startsWith('__react')
    );

    if (reactKeys.length > 0) {
      return true;
    }

    // 检查 data-reactroot 属性
    if (element.hasAttribute('data-reactroot')) {
      return true;
    }

    return false;
  }

  /**
   * 检测 Vue 组件
   * @param element - 要检查的元素
   * @returns 是否为 Vue 组件
   */
  private isVueComponent(element: Element): boolean {
    // 检查 Vue 特有的属性
    const vueKeys = Object.keys(element).filter(key => key.startsWith('__vue'));

    if (vueKeys.length > 0) {
      return true;
    }

    // 检查 v- 指令
    const attributes = Array.from(element.attributes);
    const hasVueDirective = attributes.some(
      attr =>
        attr.name.startsWith('v-') ||
        attr.name.startsWith(':') ||
        attr.name.startsWith('@')
    );

    return hasVueDirective;
  }

  /**
   * 检测 Angular 组件
   * @param element - 要检查的元素
   * @returns 是否为 Angular 组件
   */
  private isAngularComponent(element: Element): boolean {
    // 检查 Angular 特有的属性
    const ngAttributes = Array.from(element.attributes).filter(
      attr =>
        attr.name.startsWith('ng-') ||
        attr.name.startsWith('_ng') ||
        attr.name.startsWith('data-ng-')
    );

    return ngAttributes.length > 0;
  }

  /**
   * 计算可点击区域
   * @param element - 元素
   * @param rect - 边界矩形
   * @returns 可点击区域信息
   */
  private calculateClickableArea(
    element: Element,
    rect: DOMRect
  ): {
    width: number;
    height: number;
    area: number;
    center: { x: number; y: number };
  } {
    return {
      width: rect.width,
      height: rect.height,
      area: rect.width * rect.height,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    };
  }

  /**
   * 确定交互类型
   * @param element - 元素
   * @returns 交互类型
   */
  private determineInteractionType(element: Element): string {
    const tagName = element.tagName.toLowerCase();

    const typeMap: Record<string, string> = {
      a: 'link',
      button: 'button',
      input: this.getInputInteractionType(element as HTMLInputElement),
      select: 'select',
      textarea: 'textarea',
      label: 'label',
      details: 'disclosure',
      summary: 'disclosure',
      dialog: 'dialog',
    };

    const role = element.getAttribute('role');
    if (role && this.isInteractiveRole(role)) {
      return role;
    }

    return typeMap[tagName] || 'generic';
  }

  /**
   * 获取输入元素的交互类型
   * @param input - 输入元素
   * @returns 交互类型
   */
  private getInputInteractionType(input: HTMLInputElement): string {
    const type = input.type?.toLowerCase() || 'text';

    const inputTypeMap: Record<string, string> = {
      button: 'button',
      submit: 'button',
      reset: 'button',
      checkbox: 'checkbox',
      radio: 'radio',
      range: 'slider',
      file: 'file',
      color: 'color-picker',
      date: 'date-picker',
      'datetime-local': 'datetime-picker',
      time: 'time-picker',
      month: 'month-picker',
      week: 'week-picker',
    };

    return inputTypeMap[type] || 'textbox';
  }

  /**
   * 分析交互能力
   * @param element - 元素
   * @returns 交互能力
   */
  private analyzeInteractionCapabilities(
    element: Element
  ): InteractionCapability[] {
    const capabilities: InteractionCapability[] = [];

    // 基本点击能力
    capabilities.push('click');

    // 根据元素类型添加特定能力
    const tagName = element.tagName.toLowerCase();

    if (tagName === 'input' || tagName === 'textarea') {
      capabilities.push('type', 'focus', 'blur');

      const input = element as HTMLInputElement;
      if (input.type === 'checkbox' || input.type === 'radio') {
        capabilities.push('check', 'uncheck');
      }
    }

    if (tagName === 'select') {
      capabilities.push('select', 'focus', 'blur');
    }

    if (tagName === 'a') {
      capabilities.push('navigate');
    }

    // 检查拖拽能力
    if (element.hasAttribute('draggable')) {
      capabilities.push('drag');
    }

    // 检查右键菜单
    if (element.hasAttribute('oncontextmenu')) {
      capabilities.push('context-menu');
    }

    return capabilities;
  }

  /**
   * 分析可访问性
   * @param element - 元素
   * @returns 可访问性信息
   */
  private analyzeAccessibility(element: Element): {
    hasLabel: boolean;
    ariaLabel?: string;
    ariaDescribedBy?: string;
    tabIndex?: number;
    role?: string;
  } {
    return {
      hasLabel: this.hasAccessibleLabel(element),
      ariaLabel: element.getAttribute('aria-label') || undefined,
      ariaDescribedBy: element.getAttribute('aria-describedby') || undefined,
      tabIndex: element.hasAttribute('tabindex')
        ? parseInt(element.getAttribute('tabindex')!)
        : undefined,
      role: element.getAttribute('role') || undefined,
    };
  }

  /**
   * 检查元素是否有可访问的标签
   * @param element - 元素
   * @returns 是否有标签
   */
  private hasAccessibleLabel(element: Element): boolean {
    // 检查 aria-label
    if (element.getAttribute('aria-label')) {
      return true;
    }

    // 检查 aria-labelledby
    if (element.getAttribute('aria-labelledby')) {
      return true;
    }

    // 检查关联的 label 元素
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return true;
      }
    }

    // 检查父级 label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return true;
    }

    // 检查 title 属性
    if (element.getAttribute('title')) {
      return true;
    }

    return false;
  }

  /**
   * 检测框架信息
   * @param element - 元素
   * @returns 框架信息
   */
  private detectFramework(element: Element): string | undefined {
    const frameworkInfo = this.detectFrameworkComponent(element);
    return frameworkInfo.framework;
  }

  /**
   * 检查元素是否可见
   * @param element - 元素
   * @param rect - 边界矩形
   * @param computedStyle - 计算样式
   * @returns 是否可见
   */
  private isElementVisible(
    element: Element,
    rect: DOMRect,
    computedStyle: CSSStyleDeclaration
  ): boolean {
    // 检查基本可见性
    if (rect.width === 0 || rect.height === 0) return false;
    if (computedStyle.display === 'none') return false;
    if (computedStyle.visibility === 'hidden') return false;
    if (parseFloat(computedStyle.opacity) === 0) return false;

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
   * 检查元素是否启用
   * @param element - 元素
   * @returns 是否启用
   */
  private isElementEnabled(element: Element): boolean {
    // 检查 disabled 属性
    if (element.hasAttribute('disabled')) {
      return false;
    }

    // 检查 aria-disabled
    const ariaDisabled = element.getAttribute('aria-disabled');
    if (ariaDisabled === 'true') {
      return false;
    }

    // 检查表单元素的 disabled 状态
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLButtonElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLTextAreaElement
    ) {
      return !element.disabled;
    }

    return true;
  }

  /**
   * 检查元素是否被遮挡
   * @param element - 元素
   * @returns 是否被遮挡
   */
  private isElementObscured(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const elementAtPoint = document.elementFromPoint(centerX, centerY);

    // 如果点击点的元素是自己或子元素，则没有被遮挡
    return elementAtPoint !== element && !element.contains(elementAtPoint);
  }

  /**
   * 设置变更监听器
   */
  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }

    this.mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        // 清除受影响元素的缓存
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof Element) {
              this.cache.delete(node);
            }
          });
          mutation.removedNodes.forEach(node => {
            if (node instanceof Element) {
              this.cache.delete(node);
              this.observedElements.delete(node);
            }
          });
        } else if (
          mutation.type === 'attributes' &&
          mutation.target instanceof Element
        ) {
          this.cache.delete(mutation.target);
        }
      }
    });

    // 开始观察
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'id', 'style', 'disabled', 'aria-disabled'],
    });
  }

  /**
   * 查找 Shadow DOM 中的可点击元素
   * @param root - 根元素
   * @returns 可点击元素数组
   */
  private findShadowDOMClickables(root: Element): ClickableElementInfo[] {
    const clickableElements: ClickableElementInfo[] = [];

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode: node => {
        const element = node as Element;
        return element.shadowRoot
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });

    let currentNode = walker.nextNode() as Element;
    while (currentNode) {
      if (currentNode.shadowRoot) {
        // 递归处理 Shadow DOM
        const shadowClickables = this.findClickableElements(
          currentNode.shadowRoot as unknown as Element
        );
        clickableElements.push(...shadowClickables);
      }
      currentNode = walker.nextNode() as Element;
    }

    return clickableElements;
  }

  /**
   * 获取元素文本内容
   * @param element - 元素
   * @returns 清理后的文本内容
   */
  private getElementText(element: Element): string {
    const text = element.textContent || '';
    return text.trim().replace(/\s+/g, ' ').substring(0, 200);
  }

  /**
   * 生成唯一选择器
   * @param element - 元素
   * @returns CSS 选择器
   */
  private generateUniqueSelector(element: Element): string {
    // 优先使用 ID
    if (element.id) {
      const escapeId =
        typeof CSS !== 'undefined' && CSS.escape
          ? CSS.escape(element.id)
          : element.id.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
      return `#${escapeId}`;
    }

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
          .slice(0, 3);

        if (classes.length > 0) {
          const escapeClass = (cls: string) =>
            typeof CSS !== 'undefined' && CSS.escape
              ? CSS.escape(cls)
              : cls.replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, '\\$&');
          selectorPart += '.' + classes.map(escapeClass).join('.');
        }
      }

      // 添加 nth-child 以确保唯一性
      const siblings = Array.from(current.parentElement?.children || []);
      const sameTagSiblings = siblings.filter(
        sibling => sibling.tagName === current!.tagName
      );

      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selectorPart += `:nth-of-type(${index})`;
      }

      path.unshift(selectorPart);
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  /**
   * 获取相关属性
   * @param element - 元素
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
      'aria-label',
      'aria-describedby',
      'tabindex',
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
   * 推断元素角色
   * @param element - 元素
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
   * 推断输入元素角色
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
   * 清理资源
   */
  public dispose(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }
    this.cache.clear();
    this.observedElements.clear();
  }

  /**
   * 获取缓存统计
   * @returns 缓存统计信息
   */
  public getCacheStats(): { cacheSize: number; observedElements: number } {
    return {
      cacheSize: this.cache.size,
      observedElements: this.observedElements.size,
    };
  }
}
