/**
 * Browser-Use JS 代理视图定义
 *
 * 源文件: browser_use/agent/views.py
 * 功能描述: 定义代理相关的数据结构和类型
 */

import { BrowserStateSummary } from '../browser/views.js';
import {
  MessageHistory,
  MessageManagerState,
} from './message-manager/views.js';

export interface ActionResult {
  error?: string;
  extractedContent: string;
  includeInMemory: boolean;
  isDone: boolean;
  attachments?: string[];
}

export interface AgentCurrentState {
  thinking: string;
  evaluationPreviousGoal: string;
  memory: string;
  nextGoal: string;
}

export interface AgentOutput {
  currentState: AgentCurrentState;
  action: any[]; // 动作数组，具体类型依赖于控制器
}

export interface AgentStepInfo {
  stepNumber: number;
  maxSteps: number;
}

export interface AgentHistory {
  stepInfo: AgentStepInfo;
  browserState: BrowserStateSummary | null;
  modelOutput?: AgentOutput;
  result: ActionResult[];
  timestamp: number;
}

export class AgentState {
  agentId: string;
  nSteps: number;
  consecutiveFailures: number;
  lastResult?: ActionResult[];
  lastModelOutput?: AgentOutput;
  paused: boolean;
  stopped: boolean;
  messageManagerState: MessageManagerState;

  constructor() {
    this.agentId = this.generateId();
    this.nSteps = 0;
    this.consecutiveFailures = 0;
    this.paused = false;
    this.stopped = false;
    this.messageManagerState = {
      history: new MessageHistory(),
      toolId: 1,
    };
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
