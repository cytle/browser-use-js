/**
 * Browser-Use JS 消息管理器服务
 *
 * 源文件: browser_use/agent/message_manager/service.py
 * 功能描述: 管理LLM对话历史、消息格式化和令牌计算
 */

import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { MessageMetadata, MessageHistory, MessageManagerState } from './views';
import { BrowserStateSummary } from '../../browser/views';
import { ActionResult, AgentOutput, AgentStepInfo } from '../views';
import { FileSystem } from '../../filesystem/file-system';
import { logger } from '../../logging.js';

export interface MessageManagerSettings {
  maxInputTokens: number;
  estimatedCharactersPerToken: number;
  imageTokens: number;
  includeAttributes: string[];
  messageContext?: string;
  sensitiveData?: Record<string, string | Record<string, string>>;
  availableFilePaths?: string[];
}

export class MessageManager {
  private task: string;
  private settings: MessageManagerSettings;
  private state: MessageManagerState;
  private systemPrompt: SystemMessage;
  private fileSystem: FileSystem;
  private agentHistoryDescription = '';
  private readStateDescription = '';
  private sensitiveDataDescription = '';

  constructor(
    task: string,
    systemMessage: SystemMessage,
    fileSystem: FileSystem,
    settings: MessageManagerSettings,
    state: MessageManagerState = { history: new MessageHistory(), toolId: 1 }
  ) {
    this.task = task;
    this.settings = settings;
    this.state = state;
    this.systemPrompt = systemMessage;
    this.fileSystem = fileSystem;

    // 只在状态为空时初始化消息
    if (this.state.history.messages.length === 0) {
      this.initMessages();
    }
  }

  /**
   * 初始化消息历史
   */
  private initMessages(): void {
    this.addMessageWithTokens(this.systemPrompt, undefined, 'init');

    if (this.settings.messageContext) {
      const contextMessage = new HumanMessage({
        content: `<task_context>${this.settings.messageContext}</task_context>`,
        additional_kwargs: {},
        response_metadata: {},
        name: undefined,
        id: undefined,
      });
      this.addMessageWithTokens(contextMessage, undefined, 'init');
    }

    if (this.settings.sensitiveData) {
      const info = `<sensitive_data>Here are placeholders for sensitive data: ${Object.keys(this.settings.sensitiveData).join(', ')}
To use them, write <secret>the placeholder name</secret> </sensitive_data>`;
      const infoMessage = new HumanMessage({
        content: info,
        additional_kwargs: {},
        response_metadata: {},
        name: undefined,
        id: undefined,
      });
      this.addMessageWithTokens(infoMessage, undefined, 'init');
    }

    // 添加示例消息
    const placeholderMessage = new HumanMessage({
      content:
        '<example_1>\nHere is an example output of thinking and tool call. You can use it as a reference but do not copy it exactly.',
      additional_kwargs: {},
      response_metadata: {},
      name: undefined,
      id: undefined,
    });
    this.addMessageWithTokens(placeholderMessage, undefined, 'init');

    // 添加示例工具调用
    this.addExampleToolCalls();
  }

  /**
   * 添加示例工具调用
   */
  private addExampleToolCalls(): void {
    // 这里简化处理，实际应该包含完整的示例
    const exampleMessage = new AIMessage({
      content: '',
      additional_kwargs: {},
      response_metadata: {},
      name: undefined,
      id: undefined,
      tool_calls: [
        {
          name: 'AgentOutput',
          args: {
            current_state: {
              thinking: 'Example thinking process...',
              evaluation_previous_goal: 'Example evaluation...',
              memory: 'Example memory...',
            },
            action: [],
          },
          id: '1',
          type: 'tool_call',
        },
      ],
    });
    this.addMessageWithTokens(exampleMessage);

    const toolMessage = new ToolMessage({
      content: '',
      additional_kwargs: {},
      response_metadata: {},
      name: undefined,
      id: undefined,
      tool_call_id: '1',
    });
    this.addMessageWithTokens(toolMessage);
  }

  /**
   * 添加状态消息
   */
  addStateMessage(
    browserStateSummary: BrowserStateSummary,
    modelOutput?: AgentOutput,
    result?: ActionResult[],
    stepInfo?: AgentStepInfo,
    useVision = true,
    pageFilteredActions?: string,
    sensitiveData?: any
  ): void {
    this.updateAgentHistoryDescription(modelOutput, result, stepInfo);

    if (sensitiveData) {
      this.sensitiveDataDescription = this.getSensitiveDataDescription(
        browserStateSummary.url
      );
    }

    // 创建状态消息
    const stateMessage = this.createStateMessage(
      browserStateSummary,
      useVision,
      stepInfo,
      pageFilteredActions
    );

    this.addMessageWithTokens(stateMessage);
  }

  /**
   * 创建状态消息
   */
  private createStateMessage(
    browserStateSummary: BrowserStateSummary,
    useVision: boolean,
    stepInfo?: AgentStepInfo,
    pageFilteredActions?: string
  ): HumanMessage {
    let content = `Current browser state:
URL: ${browserStateSummary.url}
Title: ${browserStateSummary.title}

Available tabs:
${browserStateSummary.tabs.map((tab, i) => `${i}: ${tab.title} (${tab.url})`).join('\n')}

Current page elements:
${this.formatElementTree(browserStateSummary.elementTree)}`;

    if (pageFilteredActions) {
      content += `\n\nPage-specific actions:\n${pageFilteredActions}`;
    }

    if (this.agentHistoryDescription) {
      content += `\n\nAgent history:\n${this.agentHistoryDescription}`;
    }

    if (stepInfo) {
      content += `\n\nStep info: ${stepInfo.stepNumber}/${stepInfo.maxSteps}`;
    }

    return new HumanMessage({
      content,
      additional_kwargs: {},
      response_metadata: {},
      name: undefined,
      id: undefined,
    });
  }

  /**
   * 格式化元素树
   */
  private formatElementTree(elementTree: any): string {
    if (!elementTree) return 'No elements available';

    // 简化的元素树格式化
    const formatElement = (element: any, depth = 0): string => {
      const indent = '  '.repeat(depth);
      const highlightInfo =
        element.highlightIndex !== null ? `[${element.highlightIndex}]` : '';
      let result = `${indent}${element.tagName}${highlightInfo}`;

      if (element.attributes?.id) result += ` id="${element.attributes.id}"`;
      if (element.attributes?.class)
        result += ` class="${element.attributes.class}"`;

      if (element.children) {
        for (const child of element.children) {
          if (child.tagName) {
            result += '\n' + formatElement(child, depth + 1);
          }
        }
      }

      return result;
    };

    return formatElement(elementTree);
  }

  /**
   * 添加模型输出
   */
  addModelOutput(modelOutput: AgentOutput): void {
    const toolCalls = [
      {
        name: 'AgentOutput',
        args: modelOutput,
        id: this.state.toolId.toString(),
        type: 'tool_call' as const,
      },
    ];

    const msg = new AIMessage({
      content: '',
      additional_kwargs: {},
      response_metadata: {},
      name: undefined,
      id: undefined,
      tool_calls: toolCalls,
    });

    this.addMessageWithTokens(msg);
    this.addToolMessage('');
  }

  /**
   * 添加工具消息
   */
  addToolMessage(content: string, messageType?: string): void {
    const msg = new ToolMessage({
      content,
      additional_kwargs: {},
      response_metadata: {},
      name: undefined,
      id: undefined,
      tool_call_id: this.state.toolId.toString(),
    });

    this.state.toolId += 1;
    this.addMessageWithTokens(msg, undefined, messageType);
  }

  /**
   * 获取当前消息列表
   */
  getMessages(): BaseMessage[] {
    const messages = this.state.history.messages.map(m => m.message);

    // 记录消息历史用于调试
    logger.debug(this.logHistoryLines());

    return messages;
  }

  /**
   * 添加带令牌计数的消息
   */
  private addMessageWithTokens(
    message: BaseMessage,
    position?: number,
    messageType?: string
  ): void {
    // 过滤敏感数据
    if (this.settings.sensitiveData) {
      message = this.filterSensitiveData(message);
    }

    const tokenCount = this.countTokens(message);
    const metadata: MessageMetadata = {
      tokens: tokenCount,
      messageType: messageType || undefined,
    };

    this.state.history.addMessage(message, metadata, position);
  }

  /**
   * 过滤敏感数据
   */
  private filterSensitiveData(message: BaseMessage): BaseMessage {
    const replaceSensitive = (value: string): string => {
      if (!this.settings.sensitiveData) return value;

      const sensitiveValues: Record<string, string> = {};

      // 处理敏感数据条目
      for (const [keyOrDomain, content] of Object.entries(
        this.settings.sensitiveData
      )) {
        if (typeof content === 'object') {
          // 新格式: {domain: {key: value}}
          for (const [key, val] of Object.entries(content)) {
            if (val) {
              sensitiveValues[key] = val;
            }
          }
        } else if (content) {
          // 旧格式: {key: value}
          sensitiveValues[keyOrDomain] = content;
        }
      }

      // 替换所有敏感数据值
      for (const [key, val] of Object.entries(sensitiveValues)) {
        value = value.replace(val, `<secret>${key}</secret>`);
      }

      return value;
    };

    const newMessage = { ...message } as BaseMessage;
    if (typeof newMessage.content === 'string') {
      newMessage.content = replaceSensitive(newMessage.content);
    } else if (Array.isArray(newMessage.content)) {
      newMessage.content = newMessage.content.map(item => {
        if (typeof item === 'object' && item !== null && 'text' in item) {
          return { ...item, text: replaceSensitive(item.text as string) };
        }
        return item;
      });
    }

    return newMessage;
  }

  /**
   * 计算消息令牌数
   */
  private countTokens(message: BaseMessage): number {
    let tokens = 0;

    if (Array.isArray(message.content)) {
      for (const item of message.content) {
        if (typeof item === 'object' && item !== null) {
          if ('image_url' in item) {
            tokens += this.settings.imageTokens;
          } else if ('text' in item) {
            tokens += this.countTextTokens(item.text as string);
          }
        }
      }
    } else {
      let msgContent = message.content as string;
      if ('tool_calls' in message && message.tool_calls) {
        msgContent += JSON.stringify(message.tool_calls);
      }
      tokens += this.countTextTokens(msgContent);
    }

    return tokens;
  }

  /**
   * 计算文本令牌数
   */
  private countTextTokens(text: string): number {
    return Math.ceil(text.length / this.settings.estimatedCharactersPerToken);
  }

  /**
   * 更新代理历史描述
   */
  private updateAgentHistoryDescription(
    modelOutput?: AgentOutput,
    result?: ActionResult[],
    stepInfo?: AgentStepInfo
  ): void {
    // 简化的历史描述更新
    if (modelOutput && result) {
      this.agentHistoryDescription = `Last action: ${JSON.stringify(modelOutput.action)} Result: ${result.map(r => r.extractedContent || r.error).join(', ')}`;
    }
  }

  /**
   * 获取敏感数据描述
   */
  private getSensitiveDataDescription(url: string): string {
    // 简化实现
    return this.settings.sensitiveData
      ? 'Sensitive data available for this domain'
      : '';
  }

  /**
   * 移除最后一条状态消息
   */
  removeLastStateMessage(): void {
    this.state.history.removeLastStateMessage();
  }

  /**
   * 生成历史日志行
   */
  private logHistoryLines(): string {
    try {
      const totalTokens = this.state.history.getTotalTokens();
      const messageLines: string[] = [];

      for (let i = 0; i < this.state.history.messages.length; i++) {
        const m = this.state.history.messages[i];
        const messageType = m.message.type || 'unknown';
        const content =
          typeof m.message.content === 'string'
            ? m.message.content.slice(0, 100)
            : '[Complex content]';

        messageLines.push(`${messageType}[${m.metadata.tokens}]: ${content}`);
      }

      return `📜 LLM Message history (${this.state.history.messages.length} messages, ${totalTokens} tokens):\n${messageLines.join('\n')}`;
    } catch (error) {
      logger.warn('Failed to generate history log:', error);
      return '📜 LLM Message history (error generating log)';
    }
  }

  /**
   * 截断消息以符合令牌限制
   */
  cutMessages(): void {
    const diff =
      this.state.history.currentTokens - this.settings.maxInputTokens;
    if (diff <= 0) return;

    const lastMessage =
      this.state.history.messages[this.state.history.messages.length - 1];
    if (!lastMessage) return;

    // 如果是图像内容，先移除图像
    if (Array.isArray(lastMessage.message.content)) {
      const newContent: any[] = [];
      let removedTokens = 0;

      for (const item of lastMessage.message.content) {
        if (typeof item === 'object' && item !== null && 'image_url' in item) {
          removedTokens += this.settings.imageTokens;
          if (removedTokens >= diff) break;
        } else {
          newContent.push(item);
        }
      }

      if (removedTokens > 0) {
        lastMessage.message.content =
          newContent.length === 1 && 'text' in newContent[0]
            ? newContent[0].text
            : newContent;
        lastMessage.metadata.tokens -= removedTokens;
        this.state.history.currentTokens -= removedTokens;
        logger.debug(`Removed image with ${removedTokens} tokens`);
      }
    }

    // 如果仍然超出限制，截断文本内容
    const remainingDiff =
      this.state.history.currentTokens - this.settings.maxInputTokens;
    if (remainingDiff > 0) {
      const proportionToRemove = remainingDiff / lastMessage.metadata.tokens;
      if (proportionToRemove > 0.99) {
        throw new Error('Max token limit reached - history is too long');
      }

      const content = lastMessage.message.content as string;
      const charactersToRemove = Math.floor(
        content.length * proportionToRemove
      );
      const newContent = content.slice(0, -charactersToRemove);

      // 移除旧消息并添加截断后的消息
      this.state.history.removeLastStateMessage();

      const newMessage = new HumanMessage({
        content: newContent,
        additional_kwargs: {},
        response_metadata: {},
        name: undefined,
        id: undefined,
      });

      this.addMessageWithTokens(newMessage);
      logger.debug(`Truncated message by ${proportionToRemove * 100}%`);
    }
  }
}
