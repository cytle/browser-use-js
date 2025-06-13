/**
 * @file purpose: Iframe 沙盒系统模块入口点
 *
 * 这个模块是 Iframe 沙盒系统的主要入口点，导出所有相关的类和接口。
 * 包括 Iframe 管理器、消息桥接、跨域代理、安全管理器和 DOM 适配器。
 */

// 导出 Iframe 管理器
export { IframeManager, createIframeManager } from './manager';

// 导出类型定义（从主类型模块重新导出）
export type {
  IframeConfig,
  IframeInstance,
  IframeStatus,
  IframeSandboxPermission,
  IIframeManager,
  IMessageBridge,
  ICrossOriginProxy,
  ISecurityManager,
  IDOMAdapter,
  MessageType,
  IframeMessage,
  MessageHandler,
  MessageBridgeConfig,
  ProxyConfig,
  SecurityConfig,
  SecurityReport,
  PageInfo,
  ScreenshotOptions,
} from '../types';

// 模块版本
export const IFRAME_MODULE_VERSION = '0.1.0';

// 默认导出管理器类
export { IframeManager as default } from './manager';
