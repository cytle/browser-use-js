/**
 * 源文件: browser_use/dom/views.py
 * 功能描述: 定义 DOM 相关的基础类型，包括 DOM 节点、元素节点、文本节点和状态管理
 */

import type {
  CoordinateSet,
  HashedDomElement,
  ViewportInfo,
} from './history-tree-processor/views.js';

/**
 * DOM 基础节点类
 * 所有 DOM 节点的基类
 */
export abstract class DOMBaseNode {
  public isVisible: boolean;
  public parent: DOMElementNode | null;

  constructor(isVisible: boolean, parent: DOMElementNode | null = null) {
    this.isVisible = isVisible;
    this.parent = parent;
  }

  /**
   * 序列化为 JSON 对象
   * 子类必须实现此方法
   */
  abstract toJSON(): Record<string, any>;
}

/**
 * DOM 文本节点类
 * 表示 DOM 中的文本内容
 */
export class DOMTextNode extends DOMBaseNode {
  public text: string;
  public readonly type: string = 'TEXT_NODE';

  constructor(
    text: string,
    isVisible: boolean,
    parent: DOMElementNode | null = null
  ) {
    super(isVisible, parent);
    this.text = text;
  }

  /**
   * 检查是否有带高亮索引的父元素
   */
  public hasParentWithHighlightIndex(): boolean {
    let current = this.parent;
    while (current !== null) {
      // 如果元素有高亮索引，停止检查（将单独处理）
      if (current.highlightIndex !== null) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /**
   * 检查父元素是否在视口中
   */
  public isParentInViewport(): boolean {
    if (this.parent === null) {
      return false;
    }
    return this.parent.isInViewport;
  }

  /**
   * 检查父元素是否为顶级元素
   */
  public isParentTopElement(): boolean {
    if (this.parent === null) {
      return false;
    }
    return this.parent.isTopElement;
  }

  public toJSON(): Record<string, any> {
    return {
      text: this.text,
      type: this.type,
    };
  }
}

/**
 * DOM 元素节点类
 * 表示 DOM 中的元素节点
 *
 * xpath: 从最后一个根节点（shadow root 或 iframe 或 document）开始的元素 xpath
 * 要正确引用元素，需要递归切换根节点直到找到元素（通过 .parent 向上遍历树）
 */
export class DOMElementNode extends DOMBaseNode {
  public tagName: string;
  public xpath: string;
  public attributes: Record<string, string>;
  public children: DOMBaseNode[];
  public isInteractive: boolean = false;
  public isTopElement: boolean = false;
  public isInViewport: boolean = false;
  public shadowRoot: boolean = false;
  public highlightIndex: number | null = null;
  public viewportCoordinates: CoordinateSet | null = null;
  public pageCoordinates: CoordinateSet | null = null;
  public viewportInfo: ViewportInfo | null = null;

  /**
   * ### 由浏览器上下文注入的状态
   *
   * 这个想法是可点击元素有时会从前一页持续存在 -> 告诉模型哪些对象是新的/状态如何改变
   */
  public isNew: boolean | null = null;

  // 缓存的哈希值
  private _hash: HashedDomElement | null = null;

  constructor(
    tagName: string,
    xpath: string,
    attributes: Record<string, string>,
    children: DOMBaseNode[] = [],
    isVisible: boolean,
    parent: DOMElementNode | null = null
  ) {
    super(isVisible, parent);
    this.tagName = tagName;
    this.xpath = xpath;
    this.attributes = attributes;
    this.children = children;
  }

  public toJSON(): Record<string, any> {
    return {
      tagName: this.tagName,
      xpath: this.xpath,
      attributes: this.attributes,
      isVisible: this.isVisible,
      isInteractive: this.isInteractive,
      isTopElement: this.isTopElement,
      isInViewport: this.isInViewport,
      shadowRoot: this.shadowRoot,
      highlightIndex: this.highlightIndex,
      viewportCoordinates: this.viewportCoordinates,
      pageCoordinates: this.pageCoordinates,
      children: this.children.map(child => child.toJSON()),
    };
  }

  public toString(): string {
    let tagStr = `<${this.tagName}`;

    // 添加属性
    for (const [key, value] of Object.entries(this.attributes)) {
      tagStr += ` ${key}="${value}"`;
    }
    tagStr += '>';

    // 添加额外信息
    const extras: string[] = [];
    if (this.isInteractive) {
      extras.push('interactive');
    }
    if (this.isTopElement) {
      extras.push('top');
    }
    if (this.shadowRoot) {
      extras.push('shadow-root');
    }
    if (this.highlightIndex !== null) {
      extras.push(`highlight:${this.highlightIndex}`);
    }
    if (this.isInViewport) {
      extras.push('in-viewport');
    }

    if (extras.length > 0) {
      tagStr += ` [${extras.join(', ')}]`;
    }

    return tagStr;
  }

  /**
   * 获取元素的哈希值
   * 使用缓存属性模式
   */
  public get hash(): HashedDomElement {
    if (this._hash === null) {
      // 这里需要导入 HistoryTreeProcessor 来计算哈希
      // 由于循环依赖问题，实际实现可能需要在服务层
      throw new Error('Hash calculation requires HistoryTreeProcessor service');
    }
    return this._hash;
  }

  /**
   * 设置哈希值（由外部服务计算）
   */
  public setHash(hash: HashedDomElement): void {
    this._hash = hash;
  }

  /**
   * 获取所有文本直到下一个可点击元素
   */
  public getAllTextTillNextClickableElement(maxDepth: number = -1): string {
    const textParts: string[] = [];

    const collectText = (node: DOMBaseNode, currentDepth: number): void => {
      if (maxDepth !== -1 && currentDepth > maxDepth) {
        return;
      }

      // 如果遇到高亮元素则跳过此分支（除了当前节点）
      if (
        node instanceof DOMElementNode &&
        node !== this &&
        node.highlightIndex !== null
      ) {
        return;
      }

      if (node instanceof DOMTextNode) {
        textParts.push(node.text);
      } else if (node instanceof DOMElementNode) {
        for (const child of node.children) {
          collectText(child, currentDepth + 1);
        }
      }
    };

    collectText(this, 0);
    return textParts.join('\n').trim();
  }

  /**
   * 将可点击元素转换为字符串表示
   */
  public clickableElementsToString(
    includeAttributes: string[] | null = null
  ): string {
    const formattedText: string[] = [];

    const processNode = (node: DOMBaseNode, depth: number): void => {
      let nextDepth = depth;
      const depthStr = '\t'.repeat(depth);

      if (node instanceof DOMElementNode) {
        // 添加带有 highlightIndex 的元素
        if (node.highlightIndex !== null) {
          nextDepth += 1;

          const text = node.getAllTextTillNextClickableElement(1);
          let attributesHtmlStr = '';

          if (includeAttributes) {
            const attributesToInclude: Record<string, string> = {};
            for (const key of includeAttributes) {
              if (key in node.attributes) {
                attributesToInclude[key] = String(node.attributes[key]);
              }
            }

            // LLM 优化
            // 如果 tag 等于 role 属性，不包含它
            if (node.tagName === attributesToInclude.role) {
              delete attributesToInclude.role;
            }

            // 如果 aria-label 等于节点文本，不包含它
            if (
              attributesToInclude['aria-label'] &&
              attributesToInclude['aria-label'].trim() === text.trim()
            ) {
              delete attributesToInclude['aria-label'];
            }

            // 如果 placeholder 等于节点文本，不包含它
            if (
              attributesToInclude.placeholder &&
              attributesToInclude.placeholder.trim() === text.trim()
            ) {
              delete attributesToInclude.placeholder;
            }

            if (Object.keys(attributesToInclude).length > 0) {
              // 格式化为 key1='value1' key2='value2'
              attributesHtmlStr = Object.entries(attributesToInclude)
                .map(([key, value]) => `${key}='${value}'`)
                .join(' ');
            }
          }

          // 构建行
          const highlightIndicator = node.isNew
            ? `*[${node.highlightIndex}]*`
            : `[${node.highlightIndex}]`;

          let line = `${depthStr}${highlightIndicator}<${node.tagName}`;

          if (attributesHtmlStr) {
            line += ` ${attributesHtmlStr}`;
          }

          if (text) {
            // 只有在之前没有添加属性时才在 >text 前添加空格
            if (!attributesHtmlStr) {
              line += ' ';
            }
            line += `>${text}`;
          }
          // 只有在既没有添加属性也没有添加文本时才在 /> 前添加空格
          else if (!attributesHtmlStr) {
            line += ' ';
          }

          line += ' />'; // 1 token
          formattedText.push(line);
        }

        // 无论如何都处理子元素
        for (const child of node.children) {
          processNode(child, nextDepth);
        }
      } else if (node instanceof DOMTextNode) {
        // 只有在没有高亮父元素时才添加文本
        if (
          node.parent &&
          node.parent.highlightIndex === null &&
          node.parent.isVisible &&
          node.parent.isTopElement
        ) {
          formattedText.push(`${depthStr}${node.text}`);
        }
      }
    };

    processNode(this, 0);
    return formattedText.join('\n');
  }

  /**
   * 检查是否为 iframe 元素
   */
  public isIframeElement(url: string, name?: string, id?: string): boolean {
    return (
      this.tagName.toLowerCase() === 'iframe' &&
      this.attributes.src === url &&
      (name === undefined || this.attributes.name === name) &&
      (id === undefined || this.attributes.id === id)
    );
  }
}

/**
 * 选择器映射类型
 * 将高亮索引映射到 DOM 元素节点
 */
export type SelectorMap = Record<number, DOMElementNode>;

/**
 * DOM 状态类
 * 包含元素树和选择器映射
 */
export interface DOMState {
  elementTree: DOMElementNode;
  selectorMap: SelectorMap;
}
