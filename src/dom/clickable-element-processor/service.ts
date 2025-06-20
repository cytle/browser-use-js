/**
 * Browser-Use JS 可点击元素处理器服务
 *
 * 源文件: browser_use/dom/clickable_element_processor/service.py
 * 功能描述: 处理DOM中的可点击元素，提供元素哈希和检索功能
 */

import { createHash } from 'crypto';
import { DOMElementNode } from '../views.js';

export class ClickableElementProcessor {
  /**
   * 获取DOM树中所有可点击元素的哈希值
   */
  static getClickableElementsHashes(domElement: DOMElementNode): Set<string> {
    const clickableElements = this.getClickableElements(domElement);
    return new Set(
      clickableElements.map(element => this.hashDomElement(element))
    );
  }

  /**
   * 获取DOM树中所有可点击元素
   */
  static getClickableElements(domElement: DOMElementNode): DOMElementNode[] {
    const clickableElements: DOMElementNode[] = [];

    for (const child of domElement.children) {
      if (child instanceof DOMElementNode) {
        if (
          child.highlightIndex !== null &&
          child.highlightIndex !== undefined
        ) {
          clickableElements.push(child);
        }

        clickableElements.push(...this.getClickableElements(child));
      }
    }

    return clickableElements;
  }

  /**
   * 为DOM元素生成哈希值
   */
  static hashDomElement(domElement: DOMElementNode): string {
    const parentBranchPath = this._getParentBranchPath(domElement);
    const branchPathHash = this._parentBranchPathHash(parentBranchPath);
    const attributesHash = this._attributesHash(domElement.attributes);
    const xpathHash = this._xpathHash(domElement.xpath);

    return this._hashString(`${branchPathHash}-${attributesHash}-${xpathHash}`);
  }

  /**
   * 获取父元素分支路径
   */
  private static _getParentBranchPath(domElement: DOMElementNode): string[] {
    const parents: DOMElementNode[] = [];
    let currentElement: DOMElementNode = domElement;

    while (currentElement.parent !== null) {
      parents.push(currentElement);
      currentElement = currentElement.parent;
    }

    parents.reverse();
    return parents.map(parent => parent.tagName);
  }

  /**
   * 生成父分支路径哈希
   */
  private static _parentBranchPathHash(parentBranchPath: string[]): string {
    const parentBranchPathString = parentBranchPath.join('/');
    return createHash('sha256').update(parentBranchPathString).digest('hex');
  }

  /**
   * 生成属性哈希
   */
  private static _attributesHash(attributes: Record<string, string>): string {
    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}=${value}`)
      .join('');
    return this._hashString(attributesString);
  }

  /**
   * 生成XPath哈希
   */
  private static _xpathHash(xpath: string): string {
    return this._hashString(xpath);
  }

  /**
   * 生成文本哈希
   */
  private static _textHash(domElement: DOMElementNode): string {
    const textString = domElement.getAllTextTillNextClickableElement();
    return this._hashString(textString);
  }

  /**
   * 生成字符串哈希
   */
  private static _hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex');
  }
}
