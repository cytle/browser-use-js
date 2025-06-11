/**
 * @file purpose: Browser-Use JS 主入口文件
 *
 * 这是整个 Browser-Use JS 项目的主入口点，负责初始化所有模块并提供统一的 API。
 * 用户通过这个文件来使用 Browser-Use JS 的所有功能。
 */

import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.ts';

// 导入所有模块
import { AGENT_MODULE_VERSION } from '@agent';
import type { AgentConfig, AgentStatus } from '@agent';
import { BROWSER_MODULE_VERSION } from '@browser';
import type { BrowserConfig } from '@browser';
import { CONTROLLER_MODULE_VERSION } from '@controller';
import type { ActionResult } from '@controller';
import { DOM_MODULE_VERSION } from '@dom';
import type { ElementInfo } from '@dom';
import { TYPES_MODULE_VERSION } from '@types';
import type { Result, BaseConfig } from '@types';

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
  ElementInfo,
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

// 开发环境下的演示代码
if (import.meta.env.DEV) {
  console.log('🔧 开发模式已启用');

  // 显示模块版本信息
  console.table(MODULE_VERSIONS);

  // 自动初始化（开发环境）
  initialize({
    timeout: 30000,
  }).then(result => {
    if (result.success) {
      console.log('🎉 开发环境初始化成功');
    } else {
      console.error('💥 开发环境初始化失败:', result.error);
    }
  });
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
