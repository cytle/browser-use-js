/**
 * @file purpose: Iframe DOM 适配器实现
 */

import type {
  IDOMAdapter,
  ElementInfo,
  ClickOptions,
  TypeOptions,
  ActionResult,
  PageInfo,
  ScreenshotOptions,
  DOMOperationMessage,
  DOMOperationResponseMessage,
} from '../../types';
import { DOMOperationType, MessageType } from '../../types';
import { MessageBridge } from '../bridge';

/**
 * DOM 适配器实现类
 */
export class DOMAdapter implements IDOMAdapter {
  private readonly messageBridge: MessageBridge;
  private operationIdCounter = 0;

  constructor(messageBridge: MessageBridge) {
    this.messageBridge = messageBridge;
  }

  /**
   * 在 Iframe 中查询元素
   */
  async queryElement(
    iframeId: string,
    selector: string
  ): Promise<ElementInfo | null> {
    const message: DOMOperationMessage = {
      id: this.generateOperationId(),
      type: MessageType.DOM_OPERATION,
      timestamp: Date.now(),
      operation: DOMOperationType.QUERY_ELEMENT,
      params: { selector },
      expectResponse: true,
    };

    try {
      const response =
        await this.messageBridge.sendMessageWithResponse<DOMOperationResponseMessage>(
          iframeId,
          message
        );

      if (response.success) {
        return response.data as ElementInfo | null;
      } else {
        throw new Error(response.error || 'Failed to query element');
      }
    } catch (error) {
      console.error(`Failed to query element in iframe ${iframeId}:`, error);
      return null;
    }
  }

  /**
   * 在 Iframe 中点击元素
   */
  async clickElement(
    iframeId: string,
    selector: string,
    options?: ClickOptions
  ): Promise<ActionResult> {
    const message: DOMOperationMessage = {
      id: this.generateOperationId(),
      type: MessageType.DOM_OPERATION,
      timestamp: Date.now(),
      operation: DOMOperationType.CLICK_ELEMENT,
      params: { selector, options },
      expectResponse: true,
    };

    try {
      const response =
        await this.messageBridge.sendMessageWithResponse<DOMOperationResponseMessage>(
          iframeId,
          message
        );

      return {
        success: response.success,
        error: response.error,
        extractedContent: response.data,
        includeInMemory: true,
        duration: Date.now() - message.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - message.timestamp,
      };
    }
  }

  /**
   * 在 Iframe 中输入文本
   */
  async typeText(
    iframeId: string,
    selector: string,
    text: string,
    options?: TypeOptions
  ): Promise<ActionResult> {
    const message: DOMOperationMessage = {
      id: this.generateOperationId(),
      type: MessageType.DOM_OPERATION,
      timestamp: Date.now(),
      operation: DOMOperationType.TYPE_TEXT,
      params: { selector, text, options },
      expectResponse: true,
    };

    try {
      const response =
        await this.messageBridge.sendMessageWithResponse<DOMOperationResponseMessage>(
          iframeId,
          message
        );

      return {
        success: response.success,
        error: response.error,
        extractedContent: response.data,
        includeInMemory: true,
        duration: Date.now() - message.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - message.timestamp,
      };
    }
  }

  /**
   * 获取 Iframe 页面信息
   */
  async getPageInfo(iframeId: string): Promise<PageInfo> {
    const message: DOMOperationMessage = {
      id: this.generateOperationId(),
      type: MessageType.DOM_OPERATION,
      timestamp: Date.now(),
      operation: DOMOperationType.GET_PAGE_INFO,
      params: {},
      expectResponse: true,
    };

    try {
      const response =
        await this.messageBridge.sendMessageWithResponse<DOMOperationResponseMessage>(
          iframeId,
          message
        );

      if (response.success) {
        return response.data as PageInfo;
      } else {
        throw new Error(response.error || 'Failed to get page info');
      }
    } catch (error) {
      console.error(`Failed to get page info from iframe ${iframeId}:`, error);
      // 返回默认页面信息
      return {
        url: '',
        title: '',
        readyState: 'complete',
        viewport: { x: 0, y: 0, width: 0, height: 0 },
        pageSize: { width: 0, height: 0 },
        scrollPosition: { x: 0, y: 0 },
        elementStats: { total: 0, visible: 0, interactive: 0 },
      };
    }
  }

  /**
   * 在 Iframe 中执行脚本
   */
  async executeScript(iframeId: string, script: string): Promise<unknown> {
    const message: DOMOperationMessage = {
      id: this.generateOperationId(),
      type: MessageType.DOM_OPERATION,
      timestamp: Date.now(),
      operation: DOMOperationType.EXECUTE_SCRIPT,
      params: { script },
      expectResponse: true,
    };

    try {
      const response =
        await this.messageBridge.sendMessageWithResponse<DOMOperationResponseMessage>(
          iframeId,
          message
        );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Script execution failed');
      }
    } catch (error) {
      console.error(`Failed to execute script in iframe ${iframeId}:`, error);
      throw error;
    }
  }

  /**
   * 截取 Iframe 截图
   */
  async takeScreenshot(
    iframeId: string,
    options?: ScreenshotOptions
  ): Promise<string> {
    const message: DOMOperationMessage = {
      id: this.generateOperationId(),
      type: MessageType.DOM_OPERATION,
      timestamp: Date.now(),
      operation: DOMOperationType.TAKE_SCREENSHOT,
      params: { options },
      expectResponse: true,
    };

    try {
      const response =
        await this.messageBridge.sendMessageWithResponse<DOMOperationResponseMessage>(
          iframeId,
          message
        );

      if (response.success) {
        return response.data as string;
      } else {
        throw new Error(response.error || 'Screenshot failed');
      }
    } catch (error) {
      console.error(`Failed to take screenshot of iframe ${iframeId}:`, error);
      throw error;
    }
  }

  /**
   * 生成操作 ID
   */
  private generateOperationId(): string {
    return `op-${++this.operationIdCounter}-${Date.now()}`;
  }
}

/**
 * 创建 DOM 适配器实例
 */
export function createDOMAdapter(messageBridge: MessageBridge): DOMAdapter {
  return new DOMAdapter(messageBridge);
}

/**
 * 默认导出
 */
export default DOMAdapter;
