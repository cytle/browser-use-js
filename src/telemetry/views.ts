/**
 * Browser-Use JS 遥测视图定义
 *
 * 源文件: browser_use/telemetry/views.py
 * 功能描述: 定义遥测事件的基类和具体事件类型
 */

/**
 * 基础遥测事件接口
 */
export interface BaseTelemetryEvent {
  name: string;
  properties: Record<string, any>;
}

/**
 * 抽象基础遥测事件类
 */
export abstract class AbstractBaseTelemetryEvent implements BaseTelemetryEvent {
  abstract name: string;

  get properties(): Record<string, any> {
    const result: Record<string, any> = {};
    const instance = this as any;

    for (const key in instance) {
      if (
        key !== 'name' &&
        Object.prototype.hasOwnProperty.call(instance, key)
      ) {
        result[key] = instance[key];
      }
    }

    return result;
  }
}

/**
 * 注册函数信息
 */
export interface RegisteredFunction {
  name: string;
  params: Record<string, any>;
}

/**
 * 控制器注册函数遥测事件
 */
export class ControllerRegisteredFunctionsTelemetryEvent extends AbstractBaseTelemetryEvent {
  name = 'controller_registered_functions';

  constructor(public registeredFunctions: RegisteredFunction[]) {
    super();
  }
}

/**
 * 代理遥测事件
 */
export class AgentTelemetryEvent extends AbstractBaseTelemetryEvent {
  name = 'agent_event';

  constructor(
    // 开始详情
    public task: string,
    public model: string,
    public modelProvider: string,
    public plannerLlm: string | null,
    public maxSteps: number,
    public maxActionsPerStep: number,
    public useVision: boolean,
    public useValidation: boolean,
    public version: string,
    public source: string,
    // 步骤详情
    public actionErrors: (string | null)[],
    public actionHistory: (Record<string, any>[] | null)[],
    public urlsVisited: (string | null)[],
    // 结束详情
    public steps: number,
    public totalInputTokens: number,
    public totalDurationSeconds: number,
    public success: boolean | null,
    public finalResultResponse: string | null,
    public errorMessage: string | null
  ) {
    super();
  }
}
