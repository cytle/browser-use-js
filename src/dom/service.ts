/**
 * Browser-Use JS DOM 服务模块
 *
 * 源文件: browser_use/dom/service.py
 * 功能描述: DOM解析和处理服务，包括可点击元素提取、iframe处理等
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Page } from 'playwright';
import { logger } from '../logging.js';
import { isNullOrUndefined, timeExecutionAsync } from '../utils.js';
import type {
  DOMBaseNode,
  DOMState,
  SelectorMap,
  ViewportInfo,
} from './views.js';
import { DOMTextNode, DOMElementNode, isDOMElementNode } from './views.js';

/**
 * 页面框架评估结果
 */
export interface PageFrameEvaluationResult {
  url: string;
  result: {
    map: Record<string, any>;
    perfMetrics?: Record<string, any>;
    rootId?: string;
  };
  name?: string;
  id?: string;
}

/**
 * PageFrameEvaluationResult 类的实现
 */
export class PageFrameEvaluation implements PageFrameEvaluationResult {
  url: string;
  result: {
    map: Record<string, any>;
    perfMetrics?: Record<string, any>;
    rootId?: string;
  };
  name?: string;
  id?: string;

  constructor(data: PageFrameEvaluationResult) {
    this.url = data.url;
    this.result = data.result;
    this.name = data.name;
    this.id = data.id;
  }

  /**
   * 获取已知的iframe URL列表
   */
  get knownFrameUrls(): string[] {
    return Object.values(this.map)
      .filter((v: any) => v?.hasIframeContent && v?.attributes?.src)
      .map((v: any) => v.attributes.src);
  }

  /**
   * 获取DOM映射
   */
  get map(): Record<string, any> {
    return this.result.map || {};
  }

  /**
   * 获取映射大小
   */
  get mapSize(): number {
    return Object.keys(this.map).length;
  }

  /**
   * 获取性能指标
   */
  get perfMetrics(): Record<string, any> {
    return this.result.perfMetrics || {};
  }

  /**
   * 获取短URL
   */
  get shortUrl(): string {
    return this.url.length > 50 ? this.url.substring(0, 50) + '...' : this.url;
  }

  /**
   * 获取根节点ID
   */
  get rootId(): string | undefined {
    return this.result.rootId;
  }
}

/**
 * DOM服务类
 */
export class DomService {
  private page: Page;
  private xpathCache: Record<string, any> = {};
  private jsCode: string;

  constructor(page: Page) {
    this.page = page;

    try {
      // 读取JavaScript代码文件
      this.jsCode = readFileSync(
        resolve(
          import.meta.url.replace('file://', '').replace('/service.js', ''),
          './buildDomTree.js'
        ),
        'utf-8'
      );
    } catch (error) {
      logger.warn(
        'Failed to load buildDomTree.js, using fallback implementation'
      );
      this.jsCode =
        '(function(args) { return { map: {}, rootId: "body", perfMetrics: {}, viewport: {} }; })';
    }
  }

  /**
   * 获取可点击元素
   */
  @timeExecutionAsync('--get_clickable_elements')
  async getClickableElements(
    highlightElements: boolean = true,
    focusElement: number = -1,
    viewportExpansion: number = 0
  ): Promise<DOMState> {
    const [elementTree, selectorMap] = await this.buildDomTree(
      highlightElements,
      focusElement,
      viewportExpansion
    );

    return {
      elementTree,
      selectorMap,
    };
  }

  /**
   * 获取跨域iframe
   */
  @timeExecutionAsync('--get_cross_origin_iframes')
  async getCrossOriginIframes(): Promise<string[]> {
    try {
      // 获取隐藏的iframe URL
      const hiddenFrameUrls = await this.page
        .locator('iframe')
        .filter({ hasNotText: /./ })
        .evaluateAll((iframes: HTMLIFrameElement[]) =>
          iframes
            .filter(iframe => !iframe.offsetParent)
            .map(iframe => iframe.src)
        );

      const isAdUrl = (url: string): boolean => {
        try {
          const hostname = new URL(url).hostname;
          return ['doubleclick.net', 'adroll.com', 'googletagmanager.com'].some(
            domain => hostname.includes(domain)
          );
        } catch {
          return false;
        }
      };

      const currentHostname = new URL(this.page.url()).hostname;

      return this.page
        .frames()
        .map(frame => frame.url())
        .filter(url => {
          try {
            const frameHostname = new URL(url).hostname;
            return (
              frameHostname && // 排除 data: URLs 和 about:blank
              frameHostname !== currentHostname && // 排除同源iframe
              !hiddenFrameUrls.includes(url) && // 排除隐藏的框架
              !isAdUrl(url)
            ); // 排除广告网络URL
          } catch {
            return false;
          }
        });
    } catch (error) {
      logger.error('Error getting cross-origin iframes:', error);
      return [];
    }
  }

  /**
   * 构建DOM树
   */
  @timeExecutionAsync('--build_dom_tree')
  private async buildDomTree(
    highlightElements: boolean,
    focusElement: number,
    viewportExpansion: number
  ): Promise<[DOMElementNode, SelectorMap]> {
    // 检查页面是否可以执行JavaScript
    const canEvaluateJS = await this.page
      .evaluate(() => 1 + 1)
      .catch(() => null);
    if (canEvaluateJS !== 2) {
      throw new Error('The page cannot evaluate javascript code properly');
    }

    // 如果是空白页面，返回简单的DOM结构
    if (this.page.url() === 'about:blank') {
      const emptyElement = new DOMElementNode({
        tagName: 'body',
        xpath: '',
        attributes: {},
        children: [],
        isVisible: false,
        parent: null,
      });
      return [emptyElement, {}];
    }

    const debugMode = logger.level === 'debug';
    const args = {
      doHighlightElements: highlightElements,
      focusHighlightIndex: focusElement,
      viewportExpansion,
      debugMode,
      initialIndex: 0,
    };

    try {
      // 执行JavaScript代码提取DOM信息
      const evalPage = await this.page.evaluate(this.jsCode, args);
      const pageEvalResult = new PageFrameEvaluation({
        url: this.page.url(),
        result: evalPage as {
          map: Record<string, any>;
          perfMetrics?: Record<string, any>;
          rootId?: string;
        },
      });

      const frames = [pageEvalResult];
      let totalMapSize = pageEvalResult.mapSize;

      const knownFrameUrls = pageEvalResult.knownFrameUrls;

      // 处理iframe
      for (const iframe of this.page.frames()) {
        if (
          iframe.url() &&
          iframe.url() !== this.page.url() &&
          !iframe.url().startsWith('data:') &&
          !knownFrameUrls.includes(iframe.url())
        ) {
          try {
            const frameElement = await iframe.frameElement();
            if (!(await frameElement.isVisible())) {
              continue;
            }

            args.initialIndex = totalMapSize;

            const name = await frameElement.getAttribute('name');
            const id = await frameElement.getAttribute('id');
            const iframeEvalResult = await iframe.evaluate(this.jsCode, args);

            const frame = new PageFrameEvaluation({
              url: iframe.url(),
              result: iframeEvalResult as {
                map: Record<string, any>;
                perfMetrics?: Record<string, any>;
                rootId?: string;
              },
              name: name || undefined,
              id: id || undefined,
            });

            frames.push(frame);
            knownFrameUrls.push(iframe.url());
            knownFrameUrls.push(...frame.knownFrameUrls);
            totalMapSize += frame.mapSize;
          } catch (error) {
            logger.error(
              `Error evaluating JavaScript in iframe ${iframe.url()}:`,
              error
            );
            continue;
          }
        }
      }

      // 记录性能指标（调试模式）
      if (debugMode && frames.length > 1) {
        frames.forEach((frame, index) => {
          const perf = frame.perfMetrics;
          if (Object.keys(perf).length > 0) {
            const totalNodes = perf.nodeMetrics?.totalNodes || 0;
            const interactiveCount = Object.values(frame.map).filter(
              (nodeData: any) => nodeData?.isInteractive
            ).length;

            logger.debug(
              `🔎 Ran buildDOMTree.js interactive element detection on${index > 0 ? ' iframe' : ''}: ${frame.shortUrl} interactive=${interactiveCount}/${totalNodes}`
            );
          }
        });
      }

      return await this.constructDomTree(frames);
    } catch (error) {
      logger.error('Error evaluating JavaScript:', error);
      throw error;
    }
  }

  /**
   * 构建DOM树结构
   */
  @timeExecutionAsync('--construct_dom_tree')
  private async constructDomTree(
    frames: PageFrameEvaluation[]
  ): Promise<[DOMElementNode, SelectorMap]> {
    const jsRootId = frames[0].rootId;
    if (!jsRootId) {
      throw new Error('No rootId found in the evaluated page structure');
    }

    const selectorMap: SelectorMap = {};
    const nodeMap: Record<string, DOMBaseNode> = {};

    // 处理每个框架
    for (const frame of frames) {
      const jsNodeMap = frame.map;

      for (const [id, nodeData] of Object.entries(jsNodeMap)) {
        const [node, childrenIds] = this.parseNode(nodeData);
        if (!node) continue;

        nodeMap[id] = node;

        if (isDOMElementNode(node) && !isNullOrUndefined(node.highlightIndex)) {
          selectorMap[node.highlightIndex] = node;
        }

        // 构建树结构（自底向上）
        if (isDOMElementNode(node)) {
          for (const childId of childrenIds) {
            if (!(childId in nodeMap)) continue;

            const childNode = nodeMap[childId];
            childNode.parent = node;
            node.children.push(childNode);
          }
        }
      }
    }

    // 处理子iframe的根元素
    for (const frame of frames.slice(1)) {
      const contentRootNode = nodeMap[frame.rootId!];
      if (contentRootNode) {
        // 在主页面中找到iframe元素
        const iframeElementNode = Object.values(nodeMap).find(
          (node): node is DOMElementNode =>
            isDOMElementNode(node) &&
            this.isIframeElement(node, frame.url, frame.name, frame.id)
        );

        if (iframeElementNode) {
          if (iframeElementNode.children.length === 0) {
            iframeElementNode.children = [contentRootNode];
            contentRootNode.parent = iframeElementNode;
            continue;
          } else {
            logger.warn(
              `Iframe element ${frame.shortUrl} already has children, skipping`
            );
          }
        } else {
          logger.warn(
            `Could not find iframe element for ${frame.shortUrl} in the main page DOM`
          );
        }
      }

      // 如果找不到iframe元素，从映射中移除框架的节点
      for (const id of Object.keys(frame.map)) {
        const node = nodeMap[id];
        if (
          isDOMElementNode(node) &&
          !isNullOrUndefined(node.highlightIndex) &&
          node.highlightIndex in selectorMap
        ) {
          delete selectorMap[node.highlightIndex];
        }
        delete nodeMap[id];
      }
    }

    const htmlToDict = nodeMap[jsRootId];
    if (!htmlToDict || !isDOMElementNode(htmlToDict)) {
      throw new Error('Failed to parse HTML to dictionary');
    }

    return [htmlToDict, selectorMap];
  }

  /**
   * 解析节点数据
   */
  private parseNode(nodeData: any): [DOMBaseNode | null, string[]] {
    if (!nodeData) {
      return [null, []];
    }

    // 处理文本节点
    if (nodeData.type === 'TEXT_NODE') {
      const textNode = new DOMTextNode(nodeData.text, nodeData.isVisible, null);
      return [textNode, []];
    }

    // 处理视口信息
    let viewportInfo: ViewportInfo | null = null;
    if (nodeData.viewport) {
      viewportInfo = {
        scrollX: nodeData.viewport.scrollX || 0,
        scrollY: nodeData.viewport.scrollY || 0,
        width: nodeData.viewport.width,
        height: nodeData.viewport.height,
      };
    }

    // 处理元素节点 - 使用构造函数创建实例
    const elementNode = new DOMElementNode({
      tagName: nodeData.tagName,
      xpath: nodeData.xpath,
      attributes: nodeData.attributes || {},
      children: [], // children will be set later
      isVisible: nodeData.isVisible || false,
      parent: null, // parent will be set later
    });

    // 设置其他属性
    elementNode.isInteractive = nodeData.isInteractive || false;
    elementNode.isTopElement = nodeData.isTopElement || false;
    elementNode.isInViewport = nodeData.isInViewport || false;
    elementNode.highlightIndex = nodeData.highlightIndex ?? null;
    elementNode.shadowRoot = nodeData.shadowRoot || false;
    elementNode.viewportInfo = viewportInfo;

    const childrenIds = nodeData.children || [];
    return [elementNode, childrenIds];
  }

  /**
   * 检查是否为iframe元素
   */
  private isIframeElement(
    node: DOMElementNode,
    url: string,
    name?: string,
    id?: string
  ): boolean {
    if (node.tagName.toLowerCase() !== 'iframe') {
      return false;
    }

    const src = node.attributes.src;
    if (src === url) return true;

    if (name && node.attributes.name === name) return true;
    if (id && node.attributes.id === id) return true;

    return false;
  }
}
