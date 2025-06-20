/**
 * DOM Tree Builder Script
 *
 * 这个脚本在浏览器页面中执行，用于构建可交互元素的DOM树
 * 基于 browser-use Python 版本的 buildDomTree.js
 */

const buildDomTree = function (args) {
  // 从参数中获取配置
  const {
    doHighlightElements = true,
    focusHighlightIndex = -1,
    viewportExpansion = 0,
    debugMode = false,
    initialIndex = 0,
  } = args || {};

  // 性能监控
  const perfStart = performance.now();
  const perfMetrics = {
    nodeMetrics: {
      totalNodes: 0,
      processedNodes: 0,
    },
    timings: {},
  };

  // 计数器
  let nodeIndex = initialIndex;
  let interactiveElementCount = 0;

  // DOM映射
  const domMap = {};
  let rootId = null;

  // 获取视口信息
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  };

  // 检查元素是否在视口中
  function isInViewport(element) {
    try {
      const rect = element.getBoundingClientRect();
      return (
        rect.bottom >= -viewportExpansion &&
        rect.right >= -viewportExpansion &&
        rect.top <= viewport.height + viewportExpansion &&
        rect.left <= viewport.width + viewportExpansion
      );
    } catch (e) {
      return false;
    }
  }

  // 检查元素是否可见
  function isVisible(element) {
    try {
      if (!element || element.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }

      const style = window.getComputedStyle(element);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    } catch (e) {
      return false;
    }
  }

  // 检查元素是否可交互
  function isInteractive(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();
    const interactiveTags = [
      'a',
      'button',
      'input',
      'select',
      'textarea',
      'label',
      'option',
      'summary',
      'details',
    ];

    // 基本的可交互标签
    if (interactiveTags.includes(tagName)) {
      return true;
    }

    // 检查是否有事件监听器或特殊属性
    if (
      element.onclick ||
      element.getAttribute('onclick') ||
      element.getAttribute('role') === 'button' ||
      element.getAttribute('tabindex') ||
      element.style.cursor === 'pointer'
    ) {
      return true;
    }

    // 检查contenteditable
    if (element.contentEditable === 'true') {
      return true;
    }

    return false;
  }

  // 生成XPath
  function generateXPath(element) {
    if (!element || element === document.documentElement) {
      return '/html';
    }

    if (element === document.body) {
      return '/html/body';
    }

    const parts = [];
    let current = element;

    while (current && current !== document.documentElement) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode?.children || []).filter(
        sibling => sibling.tagName.toLowerCase() === tagName
      );

      let index = 1;
      if (siblings.length > 1) {
        index = siblings.indexOf(current) + 1;
      }

      parts.unshift(siblings.length > 1 ? `${tagName}[${index}]` : tagName);
      current = current.parentNode;
    }

    return '/' + parts.join('/');
  }

  // 获取元素属性
  function getElementAttributes(element) {
    const attrs = {};
    if (element.attributes) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attrs[attr.name] = attr.value;
      }
    }
    return attrs;
  }

  // 高亮元素
  function highlightElement(element, index) {
    if (!doHighlightElements || !element) return;

    try {
      const highlightStyle =
        index === focusHighlightIndex
          ? 'outline: 3px solid red !important; background-color: rgba(255, 0, 0, 0.1) !important;'
          : 'outline: 2px solid blue !important; background-color: rgba(0, 0, 255, 0.05) !important;';

      element.style.cssText += highlightStyle;

      // 添加数字标签
      const label = document.createElement('div');
      label.textContent = index.toString();
      label.style.cssText = `
        position: absolute !important;
        background: ${index === focusHighlightIndex ? 'red' : 'blue'} !important;
        color: white !important;
        font-size: 12px !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        z-index: 999999 !important;
        font-family: monospace !important;
        pointer-events: none !important;
      `;

      const rect = element.getBoundingClientRect();
      label.style.left = rect.left + window.scrollX + 'px';
      label.style.top = rect.top + window.scrollY - 20 + 'px';

      document.body.appendChild(label);
    } catch (e) {
      if (debugMode) {
        console.warn('Failed to highlight element:', e);
      }
    }
  }

  // 处理文本节点
  function processTextNode(textNode) {
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const text = textNode.textContent?.trim();
    if (!text) return null;

    const id = `text_${nodeIndex++}`;
    perfMetrics.nodeMetrics.processedNodes++;

    return {
      id,
      type: 'TEXT_NODE',
      text,
      isVisible: isVisible(textNode.parentElement),
    };
  }

  // 处理元素节点
  function processElementNode(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    perfMetrics.nodeMetrics.totalNodes++;

    const id = `element_${nodeIndex++}`;
    const tagName = element.tagName.toLowerCase();
    const isElementVisible = isVisible(element);
    const isElementInteractive = isInteractive(element);
    const isElementInViewport = isInViewport(element);

    let highlightIndex = null;
    if (isElementInteractive && isElementVisible) {
      highlightIndex = interactiveElementCount++;
      highlightElement(element, highlightIndex);
    }

    const nodeData = {
      id,
      type: 'ELEMENT_NODE',
      tagName,
      xpath: generateXPath(element),
      attributes: getElementAttributes(element),
      isVisible: isElementVisible,
      isInteractive: isElementInteractive,
      isInViewport: isElementInViewport,
      isTopElement: false, // 可以后续改进
      shadowRoot: !!element.shadowRoot,
      highlightIndex,
      children: [],
      viewport: isElementVisible
        ? {
            width: viewport.width,
            height: viewport.height,
            scrollX: viewport.scrollX,
            scrollY: viewport.scrollY,
          }
        : null,
    };

    perfMetrics.nodeMetrics.processedNodes++;
    return nodeData;
  }

  // 递归处理DOM树
  function processNode(node) {
    if (!node) return null;

    let nodeData = null;

    if (node.nodeType === Node.ELEMENT_NODE) {
      nodeData = processElementNode(node);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const textData = processTextNode(node);
      if (textData) {
        domMap[textData.id] = textData;
      }
      return textData;
    }

    if (!nodeData) return null;

    // 处理子节点
    const children = [];
    if (node.childNodes) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = processNode(node.childNodes[i]);
        if (child) {
          children.push(child.id);
        }
      }
    }

    nodeData.children = children;
    domMap[nodeData.id] = nodeData;

    return nodeData;
  }

  // 主执行函数
  function buildDomTree() {
    try {
      // 从body开始处理
      const body = document.body || document.documentElement;
      if (!body) {
        throw new Error('No body or document element found');
      }

      const rootNode = processNode(body);
      if (rootNode) {
        rootId = rootNode.id;
      }

      // 记录性能指标
      const perfEnd = performance.now();
      perfMetrics.timings.total = perfEnd - perfStart;

      if (debugMode) {
        console.log('DOM tree built:', {
          totalNodes: perfMetrics.nodeMetrics.totalNodes,
          processedNodes: perfMetrics.nodeMetrics.processedNodes,
          interactiveElements: interactiveElementCount,
          timings: perfMetrics.timings,
        });
      }

      return {
        map: domMap,
        rootId,
        perfMetrics,
        viewport,
      };
    } catch (error) {
      if (debugMode) {
        console.error('Error building DOM tree:', error);
      }
      return {
        map: {},
        rootId: null,
        perfMetrics,
        error: error.message,
      };
    }
  }

  // 执行并返回结果
  return buildDomTree();
};

// 导出函数供Node.js使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = buildDomTree;
}
