/**
 * Browser-Use JS 消息管理器视图定义
 *
 * 源文件: browser_use/agent/message_manager/views.py
 * 功能描述: 定义消息管理器的数据结构，包括消息元数据、消息历史等
 */

import {
  AIMessage,
  BaseMessage,
  isHumanMessage,
  isSystemMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import type { AgentOutput } from '../views.js';

export type ToolCall = {
  name: string;
  args: Record<string, any>;
  id?: string;
  type?: 'tool_call';
};
/**
 * 消息元数据
 */
export interface MessageMetadata {
  /** 令牌数量 */
  tokens: number;
  /** 消息类型 */
  messageType?: string | null;
}

/**
 * 创建默认消息元数据
 */
export function createMessageMetadata(
  tokens = 0,
  messageType?: string
): MessageMetadata {
  return {
    tokens,
    messageType: messageType || null,
  };
}

/**
 * 管理的消息（包含元数据）
 */
export interface ManagedMessage {
  /** 消息内容 */
  message: BaseMessage;
  /** 消息元数据 */
  metadata: MessageMetadata;
}

/**
 * 创建管理的消息
 */
export function createManagedMessage(
  message: BaseMessage,
  metadata: MessageMetadata = createMessageMetadata()
): ManagedMessage {
  return {
    message,
    metadata,
  };
}

/**
 * 消息历史
 */
export class MessageHistory {
  /** 消息列表 */
  public messages: ManagedMessage[] = [];
  /** 当前令牌总数 */
  public currentTokens = 0;

  /**
   * 添加消息到历史记录
   */
  addMessage(
    message: BaseMessage,
    metadata: MessageMetadata,
    position?: number
  ): void {
    const managedMessage = createManagedMessage(message, metadata);

    if (position === undefined || position === null) {
      this.messages.push(managedMessage);
    } else {
      this.messages.splice(position, 0, managedMessage);
    }

    this.currentTokens += metadata.tokens;
  }

  /**
   * 添加模型输出作为AI消息
   */
  addModelOutput(output: AgentOutput): void {
    const aiMessage: AIMessage = new AIMessage({
      content: '',
      tool_calls: [
        {
          name: 'AgentOutput',
          args: output,
          id: '1',
          type: 'tool_call',
        },
      ],
    });

    this.addMessage(aiMessage, createMessageMetadata(100)); // 估算工具调用的令牌数

    // 空工具响应
    const toolMessage: ToolMessage = new ToolMessage({
      content: '',
      tool_call_id: '1',
    });

    this.addMessage(toolMessage, createMessageMetadata(10)); // 估算空响应的令牌数
  }

  /**
   * 获取所有消息
   */
  getMessages(): BaseMessage[] {
    return this.messages.map(m => m.message);
  }

  /**
   * 获取总令牌数
   */
  getTotalTokens(): number {
    return this.currentTokens;
  }

  /**
   * 移除最旧的非系统消息
   */
  removeOldestMessage(): void {
    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      if (!isSystemMessage(msg.message)) {
        this.currentTokens -= msg.metadata.tokens;
        this.messages.splice(i, 1);
        break;
      }
    }
  }

  /**
   * 移除最后的状态消息
   */
  removeLastStateMessage(): void {
    if (this.messages.length > 2) {
      const lastMessage = this.messages[this.messages.length - 1];
      if (isHumanMessage(lastMessage.message)) {
        this.currentTokens -= lastMessage.metadata.tokens;
        this.messages.pop();
      }
    }
  }
}

/**
 * 消息管理器状态
 */
export interface MessageManagerState {
  /** 消息历史 */
  history: MessageHistory;
  /** 工具ID计数器 */
  toolId: number;
}

/**
 * 创建默认消息管理器状态
 */
export function createMessageManagerState(): MessageManagerState {
  return {
    history: new MessageHistory(),
    toolId: 1,
  };
}

/**
 * 消息工厂函数
 */
export const MessageFactory = {
  /**
   * 创建系统消息
   */
  system(content: string): SystemMessage {
    return new SystemMessage({
      content,
    });
  },

  /**
   * 创建人类消息
   */
  human(content: string | any[]): HumanMessage {
    return new HumanMessage({
      content,
    });
  },

  /**
   * 创建AI消息
   */
  ai(content: string, toolCalls?: ToolCall[]): AIMessage {
    return new AIMessage({
      content,
      tool_calls: toolCalls,
    });
  },

  /**
   * 创建工具消息
   */
  tool(content: string, toolCallId: string): ToolMessage {
    return new ToolMessage({
      content,
      tool_call_id: toolCallId,
    });
  },
};
