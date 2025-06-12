/**
 * @file purpose: 动作注册系统入口点
 *
 * 导出动作注册系统的所有核心功能
 */

// 导出核心类和实例
export {
  ActionRegistry,
  actionRegistry,
  type ActionMetadata,
  type ActionStats,
} from './action-registry';

// 导出装饰器和辅助函数
export {
  action,
  controller,
  registerActions,
  createValidator,
  type ActionDecoratorOptions,
} from './decorators';

// 导出类型
export type {
  ActionParams,
  ActionResult,
  ActionHandler,
  IActionRegistry,
} from '../../types';
