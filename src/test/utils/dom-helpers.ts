/**
 * @file purpose: DOM 测试辅助函数
 *
 * 提供 DOM 操作和测试相关的工具函数
 */

import type { Point, Rectangle } from '../../types';

/**
 * 创建模拟 DOM 元素
 * @param tagName 标签名
 * @param attributes 属性对象
 * @param textContent 文本内容
 * @returns 创建的 DOM 元素
 */
export function createMockElement(
  tagName: string,
  attributes: Record<string, string> = {},
  textContent?: string
): HTMLElement {
  const element = document.createElement(tagName);

  // 设置属性
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  // 设置文本内容
  if (textContent) {
    element.textContent = textContent;
  }

  return element;
}

/**
 * 创建模拟表单元素
 * @param type 输入类型
 * @param attributes 属性对象
 * @returns 创建的表单元素
 */
export function createMockInput(
  type: string = 'text',
  attributes: Record<string, string> = {}
): HTMLInputElement {
  const input = document.createElement('input') as HTMLInputElement;
  input.type = type;

  Object.entries(attributes).forEach(([key, value]) => {
    input.setAttribute(key, value);
  });

  return input;
}

/**
 * 创建模拟按钮元素
 * @param text 按钮文本
 * @param attributes 属性对象
 * @returns 创建的按钮元素
 */
export function createMockButton(
  text: string,
  attributes: Record<string, string> = {}
): HTMLButtonElement {
  const button = document.createElement('button') as HTMLButtonElement;
  button.textContent = text;

  Object.entries(attributes).forEach(([key, value]) => {
    button.setAttribute(key, value);
  });

  return button;
}

/**
 * 创建模拟链接元素
 * @param href 链接地址
 * @param text 链接文本
 * @param attributes 属性对象
 * @returns 创建的链接元素
 */
export function createMockLink(
  href: string,
  text: string,
  attributes: Record<string, string> = {}
): HTMLAnchorElement {
  const link = document.createElement('a') as HTMLAnchorElement;
  link.href = href;
  link.textContent = text;

  Object.entries(attributes).forEach(([key, value]) => {
    link.setAttribute(key, value);
  });

  return link;
}

/**
 * 设置元素的位置和大小
 * @param element DOM 元素
 * @param rect 位置和大小信息
 */
export function setElementBounds(element: HTMLElement, rect: Rectangle): void {
  element.style.position = 'absolute';
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

/**
 * 模拟元素的 getBoundingClientRect 方法
 * @param element DOM 元素
 * @param rect 位置和大小信息
 */
export function mockElementBounds(element: HTMLElement, rect: Rectangle): void {
  element.getBoundingClientRect = () => ({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.y,
    left: rect.x,
    bottom: rect.y + rect.height,
    right: rect.x + rect.width,
    toJSON: () => rect,
  });
}

/**
 * 模拟鼠标点击事件
 * @param element 目标元素
 * @param point 点击位置
 * @param options 事件选项
 */
export function simulateClick(
  element: HTMLElement,
  point?: Point,
  options: MouseEventInit = {}
): void {
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    clientX: point?.x || 0,
    clientY: point?.y || 0,
    ...options,
  });

  element.dispatchEvent(clickEvent);
}

/**
 * 模拟键盘输入事件
 * @param element 目标元素
 * @param text 输入文本
 * @param options 事件选项
 */
export function simulateType(
  element: HTMLElement,
  text: string,
  options: KeyboardEventInit = {}
): void {
  // 聚焦元素
  element.focus();

  // 逐个字符输入
  for (const char of text) {
    const keydownEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: char,
      ...options,
    });

    const inputEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: char,
    });

    const keyupEvent = new KeyboardEvent('keyup', {
      bubbles: true,
      cancelable: true,
      key: char,
      ...options,
    });

    element.dispatchEvent(keydownEvent);

    // 更新输入元素的值
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.value += char;
    }

    element.dispatchEvent(inputEvent);
    element.dispatchEvent(keyupEvent);
  }
}

/**
 * 模拟滚动事件
 * @param element 目标元素
 * @param deltaX 水平滚动距离
 * @param deltaY 垂直滚动距离
 */
export function simulateScroll(
  element: HTMLElement,
  deltaX: number = 0,
  deltaY: number = 0
): void {
  const scrollEvent = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaX,
    deltaY,
    deltaMode: WheelEvent.DOM_DELTA_PIXEL,
  });

  element.dispatchEvent(scrollEvent);

  // 更新滚动位置
  if (element === document.body || element === document.documentElement) {
    window.scrollBy(deltaX, deltaY);
  } else {
    element.scrollLeft += deltaX;
    element.scrollTop += deltaY;
  }
}

/**
 * 等待元素出现在 DOM 中
 * @param selector CSS 选择器
 * @param timeout 超时时间（毫秒）
 * @returns Promise<HTMLElement>
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(
          `Element with selector "${selector}" not found within ${timeout}ms`
        )
      );
    }, timeout);
  });
}

/**
 * 清理 DOM 测试环境
 */
export function cleanupDOM(): void {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
}

/**
 * 创建测试用的 HTML 结构
 * @param html HTML 字符串
 * @returns 创建的容器元素
 */
export function createTestHTML(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

/**
 * 检查元素是否可见
 * @param element DOM 元素
 * @returns 是否可见
 */
export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0
  );
}

/**
 * 检查元素是否在视口内
 * @param element DOM 元素
 * @returns 是否在视口内
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}
