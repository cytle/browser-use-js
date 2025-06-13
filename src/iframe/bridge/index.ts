/**
 * @file purpose: Iframe 消息桥接系统实现
 */

import type {
  IMessageBridge,
  MessageBridgeConfig,
  IframeMessage,
  MessageHandler,
  IframeInstance,
  HandshakeMessage,
  HeartbeatMessage,
} from '../../types';
import { MessageType } from '../../types';

/**
 * 消息桥接系统实现类
 */
export class MessageBridge implements IMessageBridge {
  private readonly config: Required<MessageBridgeConfig>;
  private readonly handlers = new Map<MessageType, Set<MessageHandler>>();
  private readonly pendingMessages = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private readonly messageQueue = new Map<string, IframeMessage[]>();
  private heartbeatInterval?: NodeJS.Timeout;
  private messageIdCounter = 0;

  constructor(config: MessageBridgeConfig = {}) {
    this.config = {
      heartbeatInterval: 30000,
      messageTimeout: 10000,
      maxRetries: 3,
      enableQueue: true,
      maxQueueSize: 100,
      enableCompression: false,
      debug: false,
      timeout: 30000,
      ...config,
    };

    this.setupMessageListener();
  }

  /**
   * 发送消息
   */
  async sendMessage(targetId: string, message: IframeMessage): Promise<void> {
    const targetFrame = this.getIframeById(targetId);
    if (!targetFrame) {
      throw new Error(`Target iframe "${targetId}" not found`);
    }

    // 设置消息 ID 和时间戳
    if (!message.id) {
      message.id = this.generateMessageId();
    }
    message.timestamp = Date.now();
    message.targetId = targetId;

    try {
      // 如果启用队列且目标不可用，加入队列
      if (this.config.enableQueue && !this.isIframeReady(targetFrame)) {
        this.enqueueMessage(targetId, message);
        return;
      }

      // 发送消息
      await this.postMessage(targetFrame, message);

      if (this.config.debug) {
        console.log(`Message sent to ${targetId}:`, message);
      }
    } catch (error) {
      console.error(`Failed to send message to ${targetId}:`, error);
      throw error;
    }
  }

  /**
   * 广播消息
   */
  async broadcastMessage(
    message: IframeMessage,
    excludeIds: string[] = []
  ): Promise<void> {
    const iframes = this.getAllIframes();
    const promises: Promise<void>[] = [];

    for (const iframe of iframes) {
      if (!excludeIds.includes(iframe.id)) {
        promises.push(this.sendMessage(iframe.id, { ...message }));
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * 注册消息处理器
   */
  registerHandler<T extends IframeMessage>(
    type: MessageType,
    handler: MessageHandler<T>
  ): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as MessageHandler);
  }

  /**
   * 移除消息处理器
   */
  removeHandler<T extends IframeMessage>(
    type: MessageType,
    handler: MessageHandler<T>
  ): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler as MessageHandler);
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  /**
   * 启动心跳检测
   */
  startHeartbeat(): void {
    if (this.heartbeatInterval) {
      return;
    }

    this.heartbeatInterval = setInterval(() => {
      const heartbeatMessage: HeartbeatMessage = {
        id: this.generateMessageId(),
        type: MessageType.HEARTBEAT,
        timestamp: Date.now(),
        payload: { source: 'main' },
      };

      this.broadcastMessage(heartbeatMessage).catch(error => {
        console.error('Heartbeat broadcast failed:', error);
      });
    }, this.config.heartbeatInterval);
  }

  /**
   * 停止心跳检测
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  /**
   * 发送带响应的消息
   */
  async sendMessageWithResponse<T = unknown>(
    targetId: string,
    message: IframeMessage
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const messageId = message.id || this.generateMessageId();
      message.id = messageId;

      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(
          new Error(`Message timeout after ${this.config.messageTimeout}ms`)
        );
      }, this.config.messageTimeout);

      // 存储待处理消息
      this.pendingMessages.set(messageId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      // 发送消息
      this.sendMessage(targetId, message).catch(error => {
        this.pendingMessages.delete(messageId);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * 执行握手
   */
  async performHandshake(targetId: string): Promise<HandshakeMessage> {
    const handshakeMessage: HandshakeMessage = {
      id: this.generateMessageId(),
      type: MessageType.HANDSHAKE,
      timestamp: Date.now(),
      protocolVersion: '1.0',
      capabilities: ['dom_operations', 'event_notifications', 'screenshots'],
      config: {
        enableCompression: this.config.enableCompression,
        heartbeatInterval: this.config.heartbeatInterval,
      },
    };

    return this.sendMessageWithResponse<HandshakeMessage>(
      targetId,
      handshakeMessage
    );
  }

  /**
   * 设置消息监听器
   */
  private setupMessageListener(): void {
    window.addEventListener('message', event => {
      this.handleMessage(event);
    });
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const message = event.data as IframeMessage;

      if (!this.isValidMessage(message)) {
        return;
      }

      if (this.config.debug) {
        console.log('Message received:', message);
      }

      // 处理响应消息
      if (this.isResponseMessage(message)) {
        this.handleResponseMessage(message);
        return;
      }

      // 处理心跳消息
      if (message.type === MessageType.HEARTBEAT) {
        await this.handleHeartbeat(
          message as HeartbeatMessage,
          event.source as Window
        );
        return;
      }

      // 处理握手消息
      if (message.type === MessageType.HANDSHAKE) {
        await this.handleHandshake(
          message as HandshakeMessage,
          event.source as Window
        );
        return;
      }

      // 调用注册的处理器
      const handlers = this.handlers.get(message.type);
      if (handlers) {
        const sourceIframe = this.getIframeByWindow(event.source as Window);
        for (const handler of handlers) {
          try {
            await handler(message, sourceIframe!);
          } catch (error) {
            console.error('Message handler error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * 处理响应消息
   */
  private handleResponseMessage(message: IframeMessage): void {
    const originalMessageId = (message as any).originalMessageId || message.id;
    const pending = this.pendingMessages.get(originalMessageId);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingMessages.delete(originalMessageId);

      if ((message as any).success !== false) {
        pending.resolve((message as any).data || message);
      } else {
        pending.reject(new Error((message as any).error || 'Unknown error'));
      }
    }
  }

  /**
   * 处理心跳消息
   */
  private async handleHeartbeat(
    message: HeartbeatMessage,
    source: Window
  ): Promise<void> {
    if (message.type === MessageType.HEARTBEAT) {
      // 响应心跳
      const response: HeartbeatMessage = {
        id: this.generateMessageId(),
        type: MessageType.HEARTBEAT_RESPONSE,
        timestamp: Date.now(),
        payload: { originalId: message.id },
      };

      source.postMessage(response, '*');
    }
  }

  /**
   * 处理握手消息
   */
  private async handleHandshake(
    message: HandshakeMessage,
    source: Window
  ): Promise<void> {
    if (message.type === MessageType.HANDSHAKE) {
      // 响应握手
      const response: HandshakeMessage = {
        id: this.generateMessageId(),
        type: MessageType.HANDSHAKE_RESPONSE,
        timestamp: Date.now(),
        protocolVersion: '1.0',
        capabilities: ['dom_operations', 'event_notifications', 'screenshots'],
        config: {
          enableCompression: this.config.enableCompression,
          heartbeatInterval: this.config.heartbeatInterval,
        },
      };

      source.postMessage(response, '*');
    }
  }

  /**
   * 发送消息到 Iframe
   */
  private async postMessage(
    iframe: IframeInstance,
    message: IframeMessage
  ): Promise<void> {
    if (!iframe.element.contentWindow) {
      throw new Error('Iframe content window not available');
    }

    iframe.element.contentWindow.postMessage(message, '*');
    iframe.lastActivity = Date.now();
  }

  /**
   * 将消息加入队列
   */
  private enqueueMessage(targetId: string, message: IframeMessage): void {
    if (!this.messageQueue.has(targetId)) {
      this.messageQueue.set(targetId, []);
    }

    const queue = this.messageQueue.get(targetId)!;

    if (queue.length >= this.config.maxQueueSize) {
      queue.shift(); // 移除最旧的消息
    }

    queue.push(message);
  }

  /**
   * 处理队列中的消息
   */
  private async processMessageQueue(targetId: string): Promise<void> {
    const queue = this.messageQueue.get(targetId);
    if (!queue || queue.length === 0) {
      return;
    }

    const messages = [...queue];
    this.messageQueue.delete(targetId);

    for (const message of messages) {
      try {
        await this.sendMessage(targetId, message);
      } catch (error) {
        console.error(
          `Failed to process queued message for ${targetId}:`,
          error
        );
      }
    }
  }

  /**
   * 验证消息格式
   */
  private isValidMessage(message: any): message is IframeMessage {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.id === 'string' &&
      typeof message.type === 'string' &&
      typeof message.timestamp === 'number'
    );
  }

  /**
   * 检查是否为响应消息
   */
  private isResponseMessage(message: IframeMessage): boolean {
    return (
      message.type === MessageType.DOM_OPERATION_RESPONSE ||
      message.type === MessageType.HEARTBEAT_RESPONSE ||
      message.type === MessageType.HANDSHAKE_RESPONSE
    );
  }

  /**
   * 检查 Iframe 是否就绪
   */
  private isIframeReady(iframe: IframeInstance): boolean {
    return iframe.status === 'ready' && iframe.communicationEstablished;
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(): string {
    return `msg-${++this.messageIdCounter}-${Date.now()}`;
  }

  /**
   * 根据 ID 获取 Iframe
   */
  private getIframeById(id: string): IframeInstance | undefined {
    // 这里需要从 IframeManager 获取实例
    // 暂时返回 undefined，实际实现时需要注入 IframeManager
    return undefined;
  }

  /**
   * 根据 Window 获取 Iframe
   */
  private getIframeByWindow(window: Window): IframeInstance | undefined {
    // 这里需要从 IframeManager 获取实例
    // 暂时返回 undefined，实际实现时需要注入 IframeManager
    return undefined;
  }

  /**
   * 获取所有 Iframe
   */
  private getAllIframes(): IframeInstance[] {
    // 这里需要从 IframeManager 获取实例
    // 暂时返回空数组，实际实现时需要注入 IframeManager
    return [];
  }

  /**
   * 销毁桥接器
   */
  destroy(): void {
    this.stopHeartbeat();

    // 清理待处理消息
    for (const [, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('MessageBridge destroyed'));
    }
    this.pendingMessages.clear();

    // 清理消息队列
    this.messageQueue.clear();

    // 清理处理器
    this.handlers.clear();
  }
}

/**
 * 创建消息桥接器实例
 */
export function createMessageBridge(
  config?: MessageBridgeConfig
): MessageBridge {
  return new MessageBridge(config);
}

/**
 * 默认导出
 */
export default MessageBridge;
