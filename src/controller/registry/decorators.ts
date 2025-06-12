/**
 * @file purpose: 动作注册装饰器
 *
 * 提供装饰器语法来简化动作的注册过程
 */

import { actionRegistry } from './action-registry';
import type { ActionHandler, ActionParams } from '../../types';

/**
 * 动作装饰器选项
 */
export interface ActionDecoratorOptions {
  /** 动作名称（如果不提供，使用方法名） */
  name?: string;
  /** 动作描述 */
  description?: string;
  /** 参数验证函数 */
  validator?: (params: ActionParams) => boolean;
}

/**
 * 动作装饰器
 *
 * 用于自动注册类方法作为动作
 */
export function action(description?: string): MethodDecorator;
export function action(options: ActionDecoratorOptions): MethodDecorator;
export function action(
  descriptionOrOptions?: string | ActionDecoratorOptions
): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const methodName = String(propertyKey);
    const originalMethod = descriptor.value;

    if (typeof originalMethod !== 'function') {
      throw new Error(`@action can only be applied to methods`);
    }

    // 解析参数
    let options: ActionDecoratorOptions;
    if (typeof descriptionOrOptions === 'string') {
      options = { description: descriptionOrOptions };
    } else {
      options = descriptionOrOptions || {};
    }

    const actionName = options.name || methodName;
    const actionDescription = options.description;
    const validator = options.validator;

    // 包装原方法以确保返回 ActionResult
    const wrappedMethod = async function (this: any, params: ActionParams) {
      try {
        const result = await originalMethod.call(this, params);

        // 如果返回的不是 ActionResult 格式，包装它
        if (
          typeof result === 'object' &&
          result !== null &&
          'success' in result
        ) {
          return result;
        } else {
          return {
            success: true,
            extractedContent: result,
            includeInMemory: true,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    // 注册动作
    actionRegistry.register(
      actionName,
      wrappedMethod as ActionHandler,
      actionDescription
    );

    // 如果有验证器，设置它
    if (validator) {
      actionRegistry.setValidator(actionName, validator);
    }

    // 替换原方法
    descriptor.value = wrappedMethod;

    return descriptor;
  };
}

/**
 * 控制器类装饰器
 */
export function controller<T extends { new (...args: any[]): object }>(
  constructor: T
): T {
  // 这个装饰器主要用于标记，实际的注册由 @action 装饰器完成
  return constructor;
}

/**
 * 批量注册动作的辅助函数
 */
export function registerActions(
  actions: Record<
    string,
    {
      handler: ActionHandler;
      description?: string;
      validator?: (params: ActionParams) => boolean;
    }
  >
): void {
  for (const [name, config] of Object.entries(actions)) {
    actionRegistry.register(name, config.handler, config.description);

    if (config.validator) {
      actionRegistry.setValidator(name, config.validator);
    }
  }
}

/**
 * 创建动作验证器的辅助函数
 */
export function createValidator(
  schema: Record<string, string>
): (params: ActionParams) => boolean {
  return (params: ActionParams): boolean => {
    for (const [key, expectedType] of Object.entries(schema)) {
      const value = (params as any)[key];

      if (value === undefined || value === null) {
        return false;
      }

      const actualType = typeof value;
      if (actualType !== expectedType) {
        return false;
      }
    }

    return true;
  };
}
