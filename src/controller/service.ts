/**
 * Browser-Use JS 控制器服务
 *
 * 源文件: browser_use/controller/service.py
 * 功能描述: 协调动作执行和注册表管理
 */

import { Registry } from './registry/service.js';
import { ActionResult } from '../agent/views.js';

export class Controller {
  private registry: Registry;

  constructor() {
    this.registry = new Registry();
  }

  /**
   * 获取动作描述
   */
  getActionDescriptions(): string {
    return this.registry.getPromptDescription();
  }

  /**
   * 执行动作
   */
  async executeAction(action: any, context: any): Promise<ActionResult> {
    try {
      const result = await this.registry.executeAction(action, context);
      return result;
    } catch (error) {
      return {
        error: `Action execution failed: ${error}`,
        extractedContent: '',
        includeInMemory: true,
        isDone: false,
      };
    }
  }
}
