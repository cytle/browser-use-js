/**
 * @file purpose: 浏览器交互模块入口点
 *
 * 这个模块负责所有与浏览器的直接交互，包括页面导航、元素操作、事件处理等。
 * 它提供了一个抽象层，让 AI 代理能够以编程方式控制浏览器行为。
 */

// 导出浏览器控制器
export {
  BrowserController,
  browserController,
  PageLoadState,
  type NavigationOptions,
  type WindowInfo,
  type BrowserEventData,
} from './controller';

// 导出交互控制器
export {
  InteractionController,
  createInteractionController,
  type InteractionControllerConfig,
  type InteractionEventData,
} from './interaction-controller';

// 导出交互动作
export {
  registerInteractionActions,
  createInteractionRegistry,
} from './interaction-actions';

// 导出配置类型
export type { BrowserState } from '../types';

// 模块版本
export const BROWSER_MODULE_VERSION = '0.1.0';

/**
 * 浏览器控制器配置接口
 */
export interface BrowserConfig {
  /** 页面加载超时时间（毫秒） */
  timeout?: number;
  /** 是否启用调试模式 */
  debug?: boolean;
  /** 用户代理字符串 */
  userAgent?: string;
}
