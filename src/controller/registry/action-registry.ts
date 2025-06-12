/**
 * @file purpose: 动作注册系统核心实现
 *
 * 这个模块实现了灵活的动作注册和管理系统，包括：
 * - 动作的注册和注销
 * - 参数类型验证
 * - 异步动作执行
 * - 装饰器语法支持
 * - 执行结果标准化
 */

import type {
  ActionParams,
  ActionResult,
  ActionHandler,
  IActionRegistry,
} from '../../types';

/**
 * 动作元数据接口
 */
export interface ActionMetadata {
  /** 动作名称 */
  name: string;
  /** 动作描述 */
  description?: string;
  /** 动作处理函数 */
  handler: ActionHandler;
  /** 参数验证函数 */
  validator?: (params: ActionParams) => boolean;
  /** 是否为异步动作 */
  async: boolean;
  /** 注册时间 */
  registeredAt: number;
  /** 执行次数 */
  executionCount: number;
  /** 最后执行时间 */
  lastExecutedAt?: number;
}

/**
 * 动作执行统计信息
 */
export interface ActionStats {
  /** 总执行次数 */
  totalExecutions: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 平均执行时间（毫秒） */
  averageExecutionTime: number;
  /** 最后执行时间 */
  lastExecutedAt?: number;
}

/**
 * 动作注册表类
 *
 * 提供动作的注册、管理和执行功能
 */
export class ActionRegistry implements IActionRegistry {
  private actions: Map<string, ActionMetadata> = new Map();
  private stats: Map<string, ActionStats> = new Map();
  private middlewares: Array<
    (name: string, params: ActionParams) => Promise<ActionParams>
  > = [];

  /**
   * 注册动作
   */
  public register<T extends ActionParams>(
    name: string,
    handler: ActionHandler<T>,
    description?: string
  ): void {
    if (this.actions.has(name)) {
      throw new Error(`Action "${name}" is already registered`);
    }

    const metadata: ActionMetadata = {
      name,
      description,
      handler: handler as ActionHandler,
      async: true, // 所有动作都是异步的
      registeredAt: Date.now(),
      executionCount: 0,
    };

    this.actions.set(name, metadata);
    this.stats.set(name, {
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0,
    });

    console.debug(`Action "${name}" registered successfully`);
  }

  /**
   * 注销动作
   */
  public unregister(name: string): boolean {
    const removed = this.actions.delete(name);
    if (removed) {
      this.stats.delete(name);
      console.debug(`Action "${name}" unregistered successfully`);
    }
    return removed;
  }

  /**
   * 执行动作
   */
  public async execute(
    name: string,
    params: ActionParams
  ): Promise<ActionResult> {
    const metadata = this.actions.get(name);
    if (!metadata) {
      return {
        success: false,
        error: `Action "${name}" is not registered`,
      };
    }

    const startTime = Date.now();
    let result: ActionResult;

    try {
      // 应用中间件
      let processedParams = params;
      for (const middleware of this.middlewares) {
        processedParams = await middleware(name, processedParams);
      }

      // 参数验证
      if (metadata.validator && !metadata.validator(processedParams)) {
        return {
          success: false,
          error: `Invalid parameters for action "${name}"`,
        };
      }

      // 执行动作
      result = await metadata.handler(processedParams);

      // 更新统计信息
      this.updateStats(name, true, Date.now() - startTime);

      // 确保结果包含执行时间
      result.duration = Date.now() - startTime;

      console.debug(
        `Action "${name}" executed successfully in ${result.duration}ms`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      result = {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };

      // 更新统计信息
      this.updateStats(name, false, Date.now() - startTime);

      console.error(`Action "${name}" failed:`, errorMessage);
    }

    // 更新元数据
    metadata.executionCount++;
    metadata.lastExecutedAt = Date.now();

    return result;
  }

  /**
   * 获取所有已注册的动作
   */
  public getActions(): Record<
    string,
    { handler: ActionHandler; description?: string }
  > {
    const result: Record<
      string,
      { handler: ActionHandler; description?: string }
    > = {};

    for (const [name, metadata] of this.actions) {
      result[name] = {
        handler: metadata.handler,
        description: metadata.description,
      };
    }

    return result;
  }

  /**
   * 检查动作是否已注册
   */
  public hasAction(name: string): boolean {
    return this.actions.has(name);
  }

  /**
   * 获取动作元数据
   */
  public getActionMetadata(name: string): ActionMetadata | undefined {
    return this.actions.get(name);
  }

  /**
   * 获取动作统计信息
   */
  public getActionStats(name: string): ActionStats | undefined {
    return this.stats.get(name);
  }

  /**
   * 获取所有动作的统计信息
   */
  public getAllStats(): Record<string, ActionStats> {
    const result: Record<string, ActionStats> = {};
    for (const [name, stats] of this.stats) {
      result[name] = { ...stats };
    }
    return result;
  }

  /**
   * 添加中间件
   */
  public addMiddleware(
    middleware: (name: string, params: ActionParams) => Promise<ActionParams>
  ): void {
    this.middlewares.push(middleware);
  }

  /**
   * 移除中间件
   */
  public removeMiddleware(
    middleware: (name: string, params: ActionParams) => Promise<ActionParams>
  ): boolean {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清空所有动作
   */
  public clear(): void {
    this.actions.clear();
    this.stats.clear();
    console.debug('All actions cleared');
  }

  /**
   * 获取注册的动作数量
   */
  public size(): number {
    return this.actions.size;
  }

  /**
   * 列出所有动作名称
   */
  public listActions(): string[] {
    return Array.from(this.actions.keys());
  }

  /**
   * 设置动作验证器
   */
  public setValidator(
    name: string,
    validator: (params: ActionParams) => boolean
  ): boolean {
    const metadata = this.actions.get(name);
    if (metadata) {
      metadata.validator = validator;
      return true;
    }
    return false;
  }

  /**
   * 更新统计信息
   */
  private updateStats(
    name: string,
    success: boolean,
    executionTime: number
  ): void {
    const stats = this.stats.get(name);
    if (!stats) return;

    stats.totalExecutions++;
    stats.lastExecutedAt = Date.now();

    if (success) {
      stats.successCount++;
    } else {
      stats.failureCount++;
    }

    // 更新平均执行时间
    const totalTime =
      stats.averageExecutionTime * (stats.totalExecutions - 1) + executionTime;
    stats.averageExecutionTime = totalTime / stats.totalExecutions;
  }
}

/**
 * 默认动作注册表实例
 */
export const actionRegistry = new ActionRegistry();
