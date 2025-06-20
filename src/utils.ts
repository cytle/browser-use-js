/**
 * Browser-Use JS 工具模块
 *
 * 来源文件: browser_use/utils.py
 * 功能描述: 提供项目基础工具函数，包括信号处理、时间执行装饰器、
 *          单例模式、环境变量检查、URL匹配验证、字典合并等核心功能
 */

import { readFileSync } from 'fs';
import { homedir, platform } from 'os';
import { resolve, relative } from 'path';
import { URL } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 配置目录
const BROWSER_USE_CONFIG_DIR = resolve(homedir(), '.config', 'browseruse');

// 全局退出状态标志
let _exiting = false;

// 泛型类型定义
type AnyFunction = (...args: any[]) => any;
type AsyncFunction = (...args: any[]) => Promise<any>;

/**
 * 信号处理器类
 *
 * 提供跨平台的信号处理功能，管理 SIGINT (Ctrl+C)、SIGTERM 等信号，
 * 支持暂停/恢复回调和优雅退出机制
 */
export class SignalHandler {
  private loop?: any; // 在 Node.js 中我们不需要事件循环引用
  private pauseCallback?: () => void;
  private resumeCallback?: () => void;
  private customExitCallback?: () => void;
  private exitOnSecondInt: boolean;
  private interruptibleTaskPatterns: string[];
  private isWindows: boolean;
  private ctrlCPressed: boolean = false;
  private waitingForInput: boolean = false;
  private originalSigintHandler?: any;
  private originalSigtermHandler?: any;

  constructor(
    options: {
      pauseCallback?: () => void;
      resumeCallback?: () => void;
      customExitCallback?: () => void;
      exitOnSecondInt?: boolean;
      interruptibleTaskPatterns?: string[];
    } = {}
  ) {
    this.pauseCallback = options.pauseCallback;
    this.resumeCallback = options.resumeCallback;
    this.customExitCallback = options.customExitCallback;
    this.exitOnSecondInt = options.exitOnSecondInt ?? true;
    this.interruptibleTaskPatterns = options.interruptibleTaskPatterns || [
      'step',
      'multi_act',
      'get_next_action',
    ];
    this.isWindows = platform() === 'win32';
  }

  /**
   * 注册信号处理器
   */
  register(): void {
    try {
      if (this.isWindows) {
        // Windows 系统使用简单的信号处理
        const windowsHandler = () => {
          console.error(
            '\n\n🛑 Got Ctrl+C. Exiting immediately on Windows...\n'
          );
          if (this.customExitCallback) {
            this.customExitCallback();
          }
          process.exit(0);
        };

        this.originalSigintHandler = process.listeners('SIGINT');
        process.on('SIGINT', windowsHandler);
      } else {
        // Unix-like 系统使用更复杂的信号处理
        const sigintHandler = () => this.sigintHandler();
        const sigtermHandler = () => this.sigtermHandler();

        this.originalSigintHandler = process.listeners('SIGINT');
        this.originalSigtermHandler = process.listeners('SIGTERM');

        process.on('SIGINT', sigintHandler);
        process.on('SIGTERM', sigtermHandler);
      }
    } catch (error) {
      // 某些情况下信号处理器不被支持，例如在非主线程中运行
      console.warn('Signal handlers not supported in this environment');
    }
  }

  /**
   * 注销信号处理器
   */
  unregister(): void {
    try {
      process.removeAllListeners('SIGINT');
      process.removeAllListeners('SIGTERM');

      // 恢复原始处理器
      if (
        this.originalSigintHandler &&
        Array.isArray(this.originalSigintHandler)
      ) {
        this.originalSigintHandler.forEach(handler => {
          process.on('SIGINT', handler);
        });
      }

      if (
        this.originalSigtermHandler &&
        Array.isArray(this.originalSigtermHandler)
      ) {
        this.originalSigtermHandler.forEach(handler => {
          process.on('SIGTERM', handler);
        });
      }
    } catch (error) {
      console.warn(`Error while unregistering signal handlers: ${error}`);
    }
  }

  /**
   * 处理第二次 Ctrl+C 按下
   */
  private handleSecondCtrlC(): void {
    if (!_exiting) {
      _exiting = true;

      if (this.customExitCallback) {
        try {
          this.customExitCallback();
        } catch (error) {
          console.error(`Error in exit callback: ${error}`);
        }
      }
    }

    console.error('\n\n🛑  Got second Ctrl+C. Exiting immediately...\n');

    // 重置终端状态
    process.stderr.write('\x1b[?25h'); // 显示光标
    process.stdout.write('\x1b[?25h');
    process.stderr.write('\x1b[0m'); // 重置文本属性
    process.stdout.write('\x1b[0m');
    process.stderr.write('\x1b[?1l'); // 重置光标键模式
    process.stdout.write('\x1b[?1l');
    process.stderr.write('\x1b[?2004l'); // 禁用括号粘贴模式
    process.stdout.write('\x1b[?2004l');
    process.stderr.write('\r');
    process.stdout.write('\r');

    console.error(
      '(tip: press [Enter] once to fix escape codes appearing after chrome exit)'
    );
    process.exit(0);
  }

  /**
   * SIGINT (Ctrl+C) 处理器
   */
  private sigintHandler(): void {
    if (_exiting) {
      process.exit(0);
    }

    if (this.ctrlCPressed) {
      if (this.waitingForInput) {
        return;
      }

      if (this.exitOnSecondInt) {
        this.handleSecondCtrlC();
      }
    }

    this.ctrlCPressed = true;
    this.cancelInterruptibleTasks();

    if (this.pauseCallback) {
      try {
        this.pauseCallback();
      } catch (error) {
        console.error(`Error in pause callback: ${error}`);
      }
    }

    console.error(
      '----------------------------------------------------------------------'
    );
  }

  /**
   * SIGTERM 处理器
   */
  private sigtermHandler(): void {
    if (!_exiting) {
      _exiting = true;
      console.error('\n\n🛑 SIGTERM received. Exiting immediately...\n\n');

      if (this.customExitCallback) {
        this.customExitCallback();
      }
    }

    process.exit(0);
  }

  /**
   * 取消可中断的任务
   */
  private cancelInterruptibleTasks(): void {
    // 在 Node.js 中，我们无法像 Python asyncio 那样直接取消任务
    // 这里可以通过事件发射器或其他机制来通知任务取消
    // 具体实现依赖于应用的任务管理系统
    console.debug('Cancelling interruptible tasks...');
  }

  /**
   * 等待恢复输入
   */
  waitForResume(): void {
    this.waitingForInput = true;

    const green = '\x1b[32;1m';
    const red = '\x1b[31m';
    const blink = '\x1b[33;5m';
    const unblink = '\x1b[0m';
    const reset = '\x1b[0m';

    try {
      process.stderr.write(
        `➡️  Press ${green}[Enter]${reset} to resume or ${red}[Ctrl+C]${reset} again to exit${blink}...${unblink} `
      );

      // 在 Node.js 中，我们需要使用不同的方式来处理输入
      // 这里简化实现，实际项目中可能需要使用 readline 或类似库
      process.stdin.once('data', () => {
        if (this.resumeCallback) {
          this.resumeCallback();
        }
      });
    } catch (error) {
      this.handleSecondCtrlC();
    } finally {
      this.waitingForInput = false;
    }
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.ctrlCPressed = false;
    this.waitingForInput = false;
  }
}

/**
 * 同步函数执行时间装饰器
 */
export function timeExecutionSync<T extends AnyFunction>(
  additionalText: string = ''
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = function (this: any, ...args: any[]) {
      const startTime = Date.now();
      const result = originalMethod.apply(this, args);
      const executionTime = (Date.now() - startTime) / 1000;

      if (executionTime > 0.25) {
        const logger = this.logger || console;
        logger.debug(
          `⏳ ${additionalText.replace(/-/g, '')}() took ${executionTime.toFixed(2)}s`
        );
      }

      return result;
    } as T;

    return descriptor;
  };
}

/**
 * 异步函数执行时间装饰器
 */
export function timeExecutionAsync<T extends AsyncFunction>(
  additionalText: string = ''
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: any, ...args: any[]) {
      const startTime = Date.now();
      const result = await originalMethod.apply(this, args);
      const executionTime = (Date.now() - startTime) / 1000;

      if (executionTime > 0.25) {
        const logger = this.logger || console;
        logger.debug(
          `⏳ ${additionalText.replace(/-/g, '')}() took ${executionTime.toFixed(2)}s`
        );
      }

      return result;
    } as T;

    return descriptor;
  };
}

/**
 * 单例模式装饰器
 */
export function singleton<T extends new (...args: any[]) => any>(
  constructor: T
): T {
  let instance: InstanceType<T> | null = null;

  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }
      super(...args);
      instance = this as InstanceType<T>;
      return this;
    }
  } as T;
}

/**
 * 检查环境变量是否设置
 */
export function checkEnvVariables(
  keys: string[],
  anyOrAll: 'any' | 'all' = 'all'
): boolean {
  const checkFunction = anyOrAll === 'any' ? 'some' : 'every';
  return keys[checkFunction](key => Boolean(process.env[key]?.trim()));
}

/**
 * 检查域名模式是否不安全
 */
export function isUnsafePattern(pattern: string): boolean {
  // 提取域名部分
  if (pattern.includes('://')) {
    pattern = pattern.split('://')[1];
  }

  // 移除安全模式 (*.domain 和 domain.*)
  const bareDomain = pattern.replace(/\*\./g, '').replace(/\.\*/g, '');

  // 如果还有通配符，则可能不安全
  return bareDomain.includes('*');
}

/**
 * URL 与域名模式匹配检查 - 安全关键功能
 */
export function matchUrlWithDomainPattern(
  url: string,
  domainPattern: string,
  logWarnings: boolean = false
): boolean {
  try {
    if (url === 'about:blank') {
      return false;
    }

    const parsedUrl = new URL(url);
    const scheme = parsedUrl.protocol.slice(0, -1).toLowerCase(); // 移除末尾的 ':'
    const domain = parsedUrl.hostname.toLowerCase();

    if (!scheme || !domain) {
      return false;
    }

    // 规范化域名模式
    const normalizedPattern = domainPattern.toLowerCase();
    let patternScheme = 'https'; // 默认使用 https 提高安全性
    let patternDomain = normalizedPattern;

    // 处理包含协议的模式
    if (normalizedPattern.includes('://')) {
      [patternScheme, patternDomain] = normalizedPattern.split('://', 2);
    }

    // 处理端口号
    if (patternDomain.includes(':') && !patternDomain.startsWith(':')) {
      patternDomain = patternDomain.split(':')[0];
    }

    // 检查协议是否匹配
    if (!matchPattern(scheme, patternScheme)) {
      return false;
    }

    // 精确匹配
    if (patternDomain === '*' || domain === patternDomain) {
      return true;
    }

    // 处理通配符模式
    if (patternDomain.includes('*')) {
      // 检查不安全的通配符模式
      if (
        patternDomain.split('*.').length > 2 ||
        patternDomain.split('.*').length > 2
      ) {
        if (logWarnings) {
          console.error(
            `⛔️ Multiple wildcards in pattern=[${domainPattern}] are not supported`
          );
        }
        return false;
      }

      // 检查 TLD 通配符
      if (patternDomain.endsWith('.*')) {
        if (logWarnings) {
          console.error(
            `⛔️ Wildcard TLDs like in pattern=[${domainPattern}] are not supported for security`
          );
        }
        return false;
      }

      // 检查嵌入的通配符
      const bareDomain = patternDomain.replace(/\*\./g, '');
      if (bareDomain.includes('*')) {
        if (logWarnings) {
          console.error(
            `⛔️ Only *.domain style patterns are supported, ignoring pattern=[${domainPattern}]`
          );
        }
        return false;
      }

      // 特殊处理 *.google.com 也匹配 google.com
      if (patternDomain.startsWith('*.')) {
        const parentDomain = patternDomain.slice(2);
        if (domain === parentDomain || matchPattern(domain, parentDomain)) {
          return true;
        }
      }

      // 正常情况：域名与模式匹配
      if (matchPattern(domain, patternDomain)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    if (logWarnings) {
      console.error(
        `⛔️ Error matching URL ${url} with pattern ${domainPattern}: ${error}`
      );
    }
    return false;
  }
}

/**
 * 简单的通配符模式匹配
 */
function matchPattern(text: string, pattern: string): boolean {
  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
    .replace(/\*/g, '.*'); // 将 * 替换为 .*

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(text);
}

/**
 * 合并字典对象
 */
export function mergeDicts(
  a: Record<string, any>,
  b: Record<string, any>,
  path: string[] = []
): Record<string, any> {
  const result = { ...a };

  for (const key in b) {
    if (key in result) {
      if (
        typeof result[key] === 'object' &&
        typeof b[key] === 'object' &&
        result[key] !== null &&
        b[key] !== null &&
        !Array.isArray(result[key]) &&
        !Array.isArray(b[key])
      ) {
        result[key] = mergeDicts(result[key], b[key], [...path, key]);
      } else if (Array.isArray(result[key]) && Array.isArray(b[key])) {
        result[key] = [...result[key], ...b[key]];
      } else if (result[key] !== b[key]) {
        throw new Error(`Conflict at ${[...path, key].join('.')}`);
      }
    } else {
      result[key] = b[key];
    }
  }

  return result;
}

/**
 * LLM 异常类
 */
export class LLMException extends Error {
  public code: number;
  public message: string;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'LLMException';
    this.code = code;
    this.message = message;
  }
}

/**
 * 处理 LLM API 错误
 */
export function handleLlmError(error: any): {
  response: { raw: any; parsed: any };
  parsed: any;
} {
  // 处理 OpenAI BadRequestError
  if (error.name === 'BadRequestError' && error.body?.failed_generation) {
    const raw = error.body.failed_generation;
    console.debug(
      `Failed to do tool call, trying to parse raw response: ${raw}`
    );
    return {
      response: { raw, parsed: null },
      parsed: null,
    };
  }

  // 处理其他 LLM 提供商的错误
  if (error.body?.error?.failed_generation) {
    const raw = error.body.error.failed_generation;
    console.debug(
      `Failed to do tool call, trying to parse raw response: ${raw}`
    );
    return {
      response: { raw, parsed: null },
      parsed: null,
    };
  }

  // 如果不是可识别的错误类型，记录并抛出
  console.error(`Failed to invoke model: ${error.message || error}`);
  throw new LLMException(401, `LLM API call failed: ${error.message || error}`);
}

/**
 * 获取 browser-use 版本号
 */
export function getBrowserUseVersion(): string {
  try {
    // 尝试从 package.json 读取版本
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    if (packageJson.version) {
      const version = packageJson.version;
      process.env.LIBRARY_VERSION = version;
      return version;
    }

    return 'unknown';
  } catch (error) {
    console.debug(`Error detecting browser-use version: ${error}`);
    return 'unknown';
  }
}

/**
 * 美化路径显示
 */
export function logPrettyPath(path: string | null | undefined): string {
  if (!path || !path.trim()) {
    return '';
  }

  if (typeof path !== 'string') {
    return `<${typeof path}>`;
  }

  // 替换 home 目录和当前工作目录
  let prettyPath = path.replace(homedir(), '~').replace(process.cwd(), '.');

  // 如果包含空格则用引号包围
  if (prettyPath.trim() && prettyPath.includes(' ')) {
    prettyPath = `"${prettyPath}"`;
  }

  return prettyPath;
}

/**
 * 美化 URL 显示
 */
export function logPrettyUrl(url: string, maxLen: number = 22): string {
  const prettyUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '');

  if (prettyUrl.length > maxLen) {
    return prettyUrl.slice(0, maxLen) + '…';
  }

  return prettyUrl;
}

// 导出常量
export { BROWSER_USE_CONFIG_DIR };
