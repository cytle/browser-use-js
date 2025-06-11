/**
 * @file purpose: Browser-Use JS 主入口文件
 *
 * 这是整个 Browser-Use JS 项目的主入口点，负责初始化所有模块并提供统一的 API。
 * 用户通过这个文件来使用 Browser-Use JS 的所有功能。
 */

// 导入类型定义
import { TYPES_MODULE_VERSION } from './types';
import type {
  Result,
  BaseConfig,
  AgentConfig,
  AgentStatus,
  BrowserConfig,
  ActionResult,
} from './types';

// 临时版本常量（将在后续任务中从各模块导入）
const AGENT_MODULE_VERSION = '0.1.0';
const BROWSER_MODULE_VERSION = '0.1.0';
const CONTROLLER_MODULE_VERSION = '0.1.0';
const DOM_MODULE_VERSION = '0.1.0';

/**
 * Browser-Use JS 版本信息
 */
export const VERSION = '0.1.0';

/**
 * 模块版本信息
 */
export const MODULE_VERSIONS = {
  agent: AGENT_MODULE_VERSION,
  browser: BROWSER_MODULE_VERSION,
  controller: CONTROLLER_MODULE_VERSION,
  dom: DOM_MODULE_VERSION,
  types: TYPES_MODULE_VERSION,
};

/**
 * 导出所有类型定义
 */
export type {
  AgentConfig,
  AgentStatus,
  BrowserConfig,
  ActionResult,
  Result,
  BaseConfig,
};

/**
 * Browser-Use JS 主配置接口
 */
export interface BrowserUseConfig extends BaseConfig {
  /** 代理配置 */
  agent?: AgentConfig;
  /** 浏览器配置 */
  browser?: BrowserConfig;
}

/**
 * 初始化 Browser-Use JS
 * @param config 配置选项
 * @returns 初始化结果
 */
export async function initialize(
  config: BrowserUseConfig = {}
): Promise<Result<void>> {
  try {
    console.log(`🚀 Browser-Use JS v${VERSION} 正在初始化...`);

    // 使用配置参数（避免未使用警告）
    if (config.debug) {
      console.log('🔧 调试模式已启用');
    }

    if (config.timeout) {
      console.log(`⏱️ 超时时间设置为: ${config.timeout}ms`);
    }

    // TODO: 在后续任务中实现具体的初始化逻辑
    // - 初始化 AI 代理
    // - 设置浏览器控制器
    // - 注册默认动作
    // - 配置 DOM 处理器

    console.log('✅ Browser-Use JS 初始化完成');

    return {
      success: true,
    };
  } catch (error) {
    console.error('❌ Browser-Use JS 初始化失败:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
}

/**
 * 获取 Browser-Use JS 版本信息
 * @returns 版本信息对象
 */
export function getVersionInfo() {
  return {
    version: VERSION,
    modules: MODULE_VERSIONS,
  };
}

// 开发环境下的自动初始化
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 开发模式已启用');

  // 显示模块版本信息
  console.table(MODULE_VERSIONS);

  // 自动初始化（开发环境）
  initialize({
    debug: true,
    timeout: 30000,
  }).then(result => {
    if (result.success) {
      console.log('🎉 开发环境初始化成功');
    } else {
      console.error('💥 开发环境初始化失败:', result.error);
    }
  });
}
