/**
 * 源文件: browser_use/logging_config.py
 * 功能描述: 实现日志系统，支持多日志级别、文件和控制台输出、日志格式化
 */

import winston from 'winston';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'result';

/**
 * 自定义日志级别定义
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    result: 2, // 对应 Python 的 RESULT level (35)
    info: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    result: 'green',
    info: 'blue',
    debug: 'gray',
  },
};

/**
 * 自定义格式化器，类似 Python 的 BrowserUseFormatter
 */
const browserUseFormatter = winston.format.printf(info => {
  const { level, message, label } = info;
  const formattedLevel = level.toUpperCase().padEnd(8);
  const moduleName = label || 'browser-use-js';

  // 对于 result 级别，只显示消息内容（类似 Python 版本）
  if (level === 'result') {
    return message as string;
  }

  return `${formattedLevel} [${moduleName}] ${message}`;
});

/**
 * 日志配置管理类
 */
class LoggingConfig {
  private static instance: LoggingConfig;
  private logger: winston.Logger;
  private isSetup = false;

  private constructor() {
    this.logger = winston.createLogger();
  }

  public static getInstance(): LoggingConfig {
    if (!LoggingConfig.instance) {
      LoggingConfig.instance = new LoggingConfig();
    }
    return LoggingConfig.instance;
  }

  /**
   * 设置日志系统
   * @param logLevel 日志级别，默认从环境变量 BROWSER_USE_LOGGING_LEVEL 读取
   */
  public setupLogging(logLevel?: LogLevel): winston.Logger {
    if (this.isSetup) {
      return this.logger;
    }

    const level =
      logLevel ||
      (process.env.BROWSER_USE_LOGGING_LEVEL?.toLowerCase() as LogLevel) ||
      'info';

    // 添加自定义级别
    winston.addColors(customLevels.colors);

    // 清除现有传输器
    this.logger.clear();

    // 创建控制台传输器
    const consoleTransport = new winston.transports.Console({
      level: level,
      format: winston.format.combine(
        winston.format.colorize(),
        browserUseFormatter
      ),
    });

    // 配置 logger
    this.logger.configure({
      levels: customLevels.levels,
      level: level,
      transports: [consoleTransport],
      // 防止退出时出现未处理的异常
      exitOnError: false,
    });

    // 静默第三方库的日志
    this.configureSilentLoggers();

    this.isSetup = true;

    // 不显示设置完成消息，保持与 Python 版本一致
    // this.logger.info('BrowserUse logging setup complete with level %s', level);

    return this.logger;
  }

  /**
   * 配置第三方库日志静默
   */
  private configureSilentLoggers(): void {
    // 这些库在 Node.js 环境下的对应包
    const thirdPartyLoggers = [
      'playwright',
      'chromium',
      'axios',
      'fetch',
      'node-fetch',
      'http',
      'https',
      'openai',
      'anthropic',
    ];

    // 注意：在 Node.js 中，不同的库有不同的日志静默方式
    // 这里主要是设置 winston 的子 logger
    thirdPartyLoggers.forEach(loggerName => {
      const childLogger = this.logger.child({ service: loggerName });
      childLogger.level = 'error';
    });
  }

  /**
   * 获取配置好的 logger 实例
   */
  public getLogger(moduleName?: string): winston.Logger {
    if (!this.isSetup) {
      this.setupLogging();
    }

    if (moduleName) {
      return this.logger.child({ label: moduleName });
    }

    return this.logger;
  }

  /**
   * 添加自定义日志级别方法（类似 Python 的 addLoggingLevel）
   */
  public addLoggingLevel(levelName: string, levelNum: number): void {
    if ((this.logger.levels as any)[levelName]) {
      throw new Error(`${levelName} already defined in logger levels`);
    }

    // 动态添加级别
    (this.logger.levels as any)[levelName] = levelNum;
    (customLevels.levels as any)[levelName] = levelNum;
  }

  /**
   * 重置日志配置
   */
  public reset(): void {
    this.isSetup = false;
    this.logger.clear();
  }
}

/**
 * 设置日志系统的便捷函数
 */
export function setupLogging(logLevel?: LogLevel): winston.Logger {
  return LoggingConfig.getInstance().setupLogging(logLevel);
}

/**
 * 获取 logger 实例的便捷函数
 */
export function getLogger(moduleName?: string): winston.Logger {
  return LoggingConfig.getInstance().getLogger(moduleName);
}

/**
 * 添加自定义日志级别的便捷函数
 */
export function addLoggingLevel(levelName: string, levelNum: number): void {
  LoggingConfig.getInstance().addLoggingLevel(levelName, levelNum);
}

// 导出默认 logger 实例
export const logger = getLogger('browser-use-js');
