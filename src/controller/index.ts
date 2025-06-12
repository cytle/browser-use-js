/**
 * @file purpose: 控制器模块入口点
 *
 * 这个模块负责动作的注册、执行和结果处理。
 * 它是 AI 代理和具体浏览器操作之间的桥梁。
 */

// 导出动作注册系统
export {
  ActionRegistry,
  actionRegistry,
  action,
  controller,
  registerActions,
  createValidator,
  type ActionMetadata,
  type ActionStats,
  type ActionDecoratorOptions,
} from './registry';

// 导出类型
export type {
  ActionParams,
  ActionResult,
  ActionHandler,
  IActionRegistry,
} from '../types';

// 模块版本
export const CONTROLLER_MODULE_VERSION = '0.1.0';
