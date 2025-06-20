/**
 * Browser-Use JS 历史树处理器服务
 *
 * 源文件: browser_use/dom/history_tree_processor/service.py
 * 功能描述: 处理DOM历史树，提供元素比较和查找功能
 */

import { createHash } from 'crypto';
import { DOMElementNode } from '../views.js';
import { DOMHistoryElement, HashedDomElement } from './views.js';

export class HistoryTreeProcessor {
  /**
   * 将DOM元素转换为历史元素
   * @dev 注意 - 即使元素保持不变，文本节点也可能发生变化
   */
  static convertDomElementToHistoryElement(
    domElement: DOMElementNode
  ): DOMHistoryElement {
    const parentBranchPath = this._getParentBranchPath(domElement);
    // 注意：这里需要BrowserContext的增强CSS选择器功能，暂时使用基础选择器
    const cssSelector = this._generateCssSelector(domElement);

    return {
      tagName: domElement.tagName,
      xpath: domElement.xpath,
      highlightIndex: domElement.highlightIndex,
      entireParentBranchPath: parentBranchPath,
      attributes: domElement.attributes,
      shadowRoot: domElement.shadowRoot,
      cssSelector,
      pageCoordinates: domElement.pageCoordinates,
      viewportCoordinates: domElement.viewportCoordinates,
      viewportInfo: domElement.viewportInfo,
    } as DOMHistoryElement;
  }

  /**
   * 在DOM树中查找历史元素
   */
  static findHistoryElementInTree(
    domHistoryElement: DOMHistoryElement,
    tree: DOMElementNode
  ): DOMElementNode | null {
    const hashedDomHistoryElement =
      this._hashDomHistoryElement(domHistoryElement);

    const processNode = (node: DOMElementNode): DOMElementNode | null => {
      if (node.highlightIndex !== null && node.highlightIndex !== undefined) {
        const hashedNode = this._hashDomElement(node);
        if (this._compareHashedElements(hashedNode, hashedDomHistoryElement)) {
          return node;
        }
      }

      for (const child of node.children) {
        if (child instanceof DOMElementNode) {
          const result = processNode(child);
          if (result !== null) {
            return result;
          }
        }
      }

      return null;
    };

    return processNode(tree);
  }

  /**
   * 比较历史元素和DOM元素
   */
  static compareHistoryElementAndDomElement(
    domHistoryElement: DOMHistoryElement,
    domElement: DOMElementNode
  ): boolean {
    const hashedDomHistoryElement =
      this._hashDomHistoryElement(domHistoryElement);
    const hashedDomElement = this._hashDomElement(domElement);

    return this._compareHashedElements(
      hashedDomHistoryElement,
      hashedDomElement
    );
  }

  /**
   * 对DOM历史元素进行哈希处理
   */
  private static _hashDomHistoryElement(
    domHistoryElement: DOMHistoryElement
  ): HashedDomElement {
    const branchPathHash = this._parentBranchPathHash(
      domHistoryElement.entireParentBranchPath
    );
    const attributesHash = this._attributesHash(domHistoryElement.attributes);
    const xpathHash = this._xpathHash(domHistoryElement.xpath);

    return { branchPathHash, attributesHash, xpathHash };
  }

  /**
   * 对DOM元素进行哈希处理
   */
  private static _hashDomElement(domElement: DOMElementNode): HashedDomElement {
    const parentBranchPath = this._getParentBranchPath(domElement);
    const branchPathHash = this._parentBranchPathHash(parentBranchPath);
    const attributesHash = this._attributesHash(domElement.attributes);
    const xpathHash = this._xpathHash(domElement.xpath);

    return { branchPathHash, attributesHash, xpathHash };
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
    return createHash('sha256').update(attributesString).digest('hex');
  }

  /**
   * 生成XPath哈希
   */
  private static _xpathHash(xpath: string): string {
    return createHash('sha256').update(xpath).digest('hex');
  }

  /**
   * 生成文本哈希
   */
  private static _textHash(domElement: DOMElementNode): string {
    const textString = domElement.getAllTextTillNextClickableElement();
    return createHash('sha256').update(textString).digest('hex');
  }

  /**
   * 比较两个哈希元素是否相等
   */
  private static _compareHashedElements(
    a: HashedDomElement,
    b: HashedDomElement
  ): boolean {
    return (
      a.branchPathHash === b.branchPathHash &&
      a.attributesHash === b.attributesHash &&
      a.xpathHash === b.xpathHash
    );
  }

  /**
   * 生成基础CSS选择器（临时实现）
   */
  private static _generateCssSelector(domElement: DOMElementNode): string {
    // 简化的CSS选择器生成，实际应该使用BrowserContext的增强版本
    let selector = domElement.tagName.toLowerCase();

    if (domElement.attributes.id) {
      selector += `#${domElement.attributes.id}`;
    }

    if (domElement.attributes.class) {
      const classes = domElement.attributes.class.split(' ').filter(Boolean);
      selector += classes.map(cls => `.${cls}`).join('');
    }

    return selector;
  }
}
