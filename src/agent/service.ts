/**
 * Browser-Use JS 代理核心服务
 *
 * 源文件: browser_use/agent/service.py
 * 功能描述: AI代理的核心类，协调浏览器控制、消息管理和任务执行
 */

import { BrowserService } from '../browser/service.js';
import { BrowserProfile } from '../browser/profile.js';
import { Controller } from '../controller/service.js';
import {
  MessageManager,
  MessageManagerSettings,
} from './message-manager/service.js';
import { Memory } from './memory/service.js';
import { BrowserStateSummary } from '../browser/views.js';
import {
  ActionResult,
  AgentOutput,
  AgentStepInfo,
  AgentHistory,
  AgentState,
} from './views.js';
import { logger } from '../logging.js';
import { FileSystem } from '../filesystem/service.js';

export interface AgentSettings {
  useVision: boolean;
  maxFailures: number;
  retryDelay: number;
  maxInputTokens: number;
  validateOutput: boolean;
  maxActionsPerStep: number;
  enableMemory: boolean;
}

export class Agent {
  private task: string;
  private llm: any; // LLM实例，类型待定
  private browserService: BrowserService;
  private controller: Controller;
  private messageManager: MessageManager;
  private memory?: Memory;
  private fileSystem: FileSystem;
  private settings: AgentSettings;
  private state: AgentState;
  private initialized = false;

  constructor(
    task: string,
    llm: any,
    options: {
      browserProfile?: BrowserProfile;
      controller?: Controller;
      settings?: Partial<AgentSettings>;
      fileSystemPath?: string;
      sensitiveData?: Record<string, string | Record<string, string>>;
    } = {}
  ) {
    this.task = task;
    this.llm = llm;

    // 初始化设置
    this.settings = {
      useVision: true,
      maxFailures: 3,
      retryDelay: 10,
      maxInputTokens: 128000,
      validateOutput: false,
      maxActionsPerStep: 1,
      enableMemory: true,
      ...options.settings,
    };

    // 初始化组件
    this.browserService = new BrowserService(options.browserProfile);
    this.controller = options.controller || new Controller();
    this.fileSystem = new FileSystem(options.fileSystemPath);

    // 初始化状态
    this.state = new AgentState();

    // 初始化消息管理器
    const messageManagerSettings: MessageManagerSettings = {
      maxInputTokens: this.settings.maxInputTokens,
      estimatedCharactersPerToken: 3,
      imageTokens: 800,
      includeAttributes: [
        'title',
        'type',
        'name',
        'role',
        'aria-label',
        'placeholder',
        'value',
        'alt',
        'checked',
      ],
      sensitiveData: options.sensitiveData,
    };

    // 创建系统消息（简化版）
    const systemMessage = {
      content: `You are a web automation agent. Your task is: ${task}

Available actions:
${this.controller.getActionDescriptions()}

Always respond with valid JSON containing your next action.`,
      additional_kwargs: {},
      response_metadata: {},
      type: 'system' as const,
      name: undefined,
      id: undefined,
    };

    this.messageManager = new MessageManager(
      task,
      systemMessage,
      this.fileSystem,
      messageManagerSettings,
      this.state.messageManagerState
    );

    // 初始化记忆（如果启用）
    if (this.settings.enableMemory) {
      try {
        this.memory = new Memory(this.messageManager, this.llm);
      } catch (error) {
        logger.warn(
          'Failed to initialize memory, continuing without memory features:',
          error
        );
        this.settings.enableMemory = false;
      }
    }
  }

  /**
   * 启动代理
   */
  async start(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.browserService.start();
      this.initialized = true;
      logger.info('🤖 Agent started successfully');
    } catch (error) {
      logger.error('Failed to start agent:', error);
      throw error;
    }
  }

  /**
   * 停止代理
   */
  async stop(): Promise<void> {
    try {
      await this.browserService.stop();
      this.initialized = false;
      logger.info('🛑 Agent stopped');
    } catch (error) {
      logger.error('Error stopping agent:', error);
    }
  }

  /**
   * 运行代理任务
   */
  async run(maxSteps = 100): Promise<AgentHistory[]> {
    if (!this.initialized) {
      await this.start();
    }

    logger.info(`🚀 Starting task: ${this.task}`);
    const history: AgentHistory[] = [];

    try {
      for (let step = 0; step < maxSteps; step++) {
        const stepInfo: AgentStepInfo = {
          stepNumber: step + 1,
          maxSteps,
        };

        logger.info(`📍 Step ${step + 1}/${maxSteps}`);

        // 检查是否应该停止
        if (this.state.stopped) {
          logger.info('🛑 Agent stopped');
          break;
        }

        // 执行步骤
        const stepResult = await this.executeStep(stepInfo);
        history.push(stepResult);

        // 检查是否完成
        if (stepResult.result.some(r => r.isDone)) {
          logger.info('✅ Task completed successfully');
          break;
        }

        // 检查连续失败次数
        if (this.state.consecutiveFailures >= this.settings.maxFailures) {
          logger.error(
            `❌ Stopping due to ${this.settings.maxFailures} consecutive failures`
          );
          break;
        }

        // 延迟（如果需要）
        if (this.settings.retryDelay > 0 && step < maxSteps - 1) {
          await new Promise(resolve =>
            setTimeout(resolve, this.settings.retryDelay * 1000)
          );
        }
      }

      logger.info(
        `🏁 Task execution completed. Steps taken: ${history.length}`
      );
      return history;
    } catch (error) {
      logger.error('Task execution failed:', error);
      throw error;
    }
  }

  /**
   * 执行单个步骤
   */
  private async executeStep(stepInfo: AgentStepInfo): Promise<AgentHistory> {
    try {
      // 获取当前浏览器状态
      const browserState = await this.browserService.getStateSummary();

      // 添加状态消息到对话历史
      this.messageManager.addStateMessage(
        browserState,
        undefined,
        undefined,
        stepInfo,
        this.settings.useVision
      );

      // 获取LLM的下一个动作
      const modelOutput = await this.getNextAction();

      // 执行动作
      const actionResults = await this.executeActions(modelOutput.action || []);

      // 记录结果
      const historyItem: AgentHistory = {
        stepInfo,
        browserState,
        modelOutput,
        result: actionResults,
        timestamp: Date.now(),
      };

      // 更新状态
      this.updateState(actionResults);

      // 添加模型输出到对话历史
      this.messageManager.addModelOutput(modelOutput);

      return historyItem;
    } catch (error) {
      logger.error('Step execution failed:', error);

      const errorResult: ActionResult = {
        error: `Step failed: ${error}`,
        extractedContent: '',
        includeInMemory: true,
        isDone: false,
      };

      this.state.consecutiveFailures++;

      return {
        stepInfo,
        browserState: await this.browserService
          .getStateSummary()
          .catch(() => null),
        modelOutput: undefined,
        result: [errorResult],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 获取LLM的下一个动作
   */
  private async getNextAction(): Promise<AgentOutput> {
    try {
      const messages = this.messageManager.getMessages();

      // 简化的LLM调用（实际应该根据具体LLM库实现）
      const response = await this.llm.invoke(messages);

      // 解析响应（简化版）
      const output: AgentOutput = {
        currentState: {
          thinking: response.content || 'No thinking provided',
          evaluationPreviousGoal: 'Action evaluation',
          memory: 'Current memory state',
          nextGoal: 'Next goal to achieve',
        },
        action: response.tool_calls || [],
      };

      return output;
    } catch (error) {
      logger.error('Failed to get next action from LLM:', error);
      throw new Error(`LLM call failed: ${error}`);
    }
  }

  /**
   * 执行动作列表
   */
  private async executeActions(actions: any[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    for (const action of actions.slice(0, this.settings.maxActionsPerStep)) {
      try {
        const result = await this.controller.executeAction(action, {
          browserService: this.browserService,
          fileSystem: this.fileSystem,
        });

        results.push(result);

        // 如果动作完成了任务，跳出循环
        if (result.isDone) {
          break;
        }
      } catch (error) {
        logger.error('Action execution failed:', error);
        results.push({
          error: `Action failed: ${error}`,
          extractedContent: '',
          includeInMemory: true,
          isDone: false,
        });
      }
    }

    return results;
  }

  /**
   * 更新代理状态
   */
  private updateState(results: ActionResult[]): void {
    const hasError = results.some(r => r.error);

    if (hasError) {
      this.state.consecutiveFailures++;
    } else {
      this.state.consecutiveFailures = 0;
    }

    this.state.lastResult = results;
    this.state.nSteps++;
  }

  /**
   * 暂停代理
   */
  pause(): void {
    this.state.paused = true;
    logger.info('⏸️ Agent paused');
  }

  /**
   * 恢复代理
   */
  resume(): void {
    this.state.paused = false;
    logger.info('▶️ Agent resumed');
  }

  /**
   * 停止代理
   */
  stopAgent(): void {
    this.state.stopped = true;
    logger.info('🛑 Agent stop requested');
  }

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * 导航到指定URL
   */
  async navigateToUrl(url: string): Promise<void> {
    await this.browserService.navigateToUrl(url);
  }

  /**
   * 截取屏幕截图
   */
  async takeScreenshot(): Promise<string> {
    return await this.browserService.takeScreenshot();
  }

  /**
   * 获取当前页面内容
   */
  async getPageContent(): Promise<string> {
    return await this.browserService.getPageContent();
  }
}
