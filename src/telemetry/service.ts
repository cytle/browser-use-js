/**
 * Browser-Use JS 遥测服务
 *
 * 源文件: browser_use/telemetry/service.py
 * 功能描述: 提供匿名遥测数据收集服务，支持隐私保护和可配置开关
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from '../logging.js';
import { BaseTelemetryEvent } from './views.js';
import { v4 as uuidv4 } from 'uuid';

const logger = getLogger('telemetry');

/**
 * PostHog 事件设置
 */
const POSTHOG_EVENT_SETTINGS = {
  process_person_profile: true,
};

/**
 * 获取 XDG 缓存目录
 */
function xdgCacheHome(): string {
  const defaultPath = path.join(os.homedir(), '.cache');
  const envVar = process.env.XDG_CACHE_HOME;

  if (envVar && path.isAbsolute(envVar)) {
    return envVar;
  }

  return defaultPath;
}

/**
 * PostHog 客户端接口（模拟）
 */
interface PostHogClient {
  capture(
    userId: string,
    eventName: string,
    properties: Record<string, any>
  ): void;
  flush(): void;
}

/**
 * 模拟 PostHog 客户端
 */
class MockPostHogClient implements PostHogClient {
  constructor(
    private apiKey: string,
    private host: string,
    private options: Record<string, any> = {}
  ) {}

  capture(
    userId: string,
    eventName: string,
    properties: Record<string, any>
  ): void {
    if (process.env.BROWSER_USE_LOGGING_LEVEL === 'debug') {
      logger.debug(`PostHog capture: ${eventName}`, { userId, properties });
    }
  }

  flush(): void {
    logger.debug('PostHog client telemetry queue flushed.');
  }
}

/**
 * 单例装饰器函数
 */
function singleton<T extends new (...args: any[]) => any>(constructor: T): T {
  let instance: InstanceType<T>;

  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }

      super(...args);
      instance = this as InstanceType<T>;
      return instance;
    }
  } as T;
}

/**
 * 产品遥测服务
 *
 * 用于捕获匿名遥测数据。
 *
 * 如果环境变量 `ANONYMIZED_TELEMETRY=false`，匿名遥测将被禁用。
 */
@singleton
export class ProductTelemetry {
  private static readonly USER_ID_PATH = path.join(
    xdgCacheHome(),
    'browser_use',
    'telemetry_user_id'
  );
  private static readonly PROJECT_API_KEY =
    'phc_F8JMNjW1i2KbGUTaW1unnDdLSPCoyc52SGRU0JecaUh';
  private static readonly HOST = 'https://eu.i.posthog.com';
  private static readonly UNKNOWN_USER_ID = 'UNKNOWN';

  private _currUserId: string | null = null;
  private _posthogClient: PostHogClient | null = null;
  private debugLogging: boolean;

  constructor() {
    const telemetryDisabled =
      process.env.ANONYMIZED_TELEMETRY?.toLowerCase() === 'false';
    this.debugLogging =
      process.env.BROWSER_USE_LOGGING_LEVEL?.toLowerCase() === 'debug';

    if (telemetryDisabled) {
      this._posthogClient = null;
    } else {
      logger.info(
        'Anonymized telemetry enabled. See https://docs.browser-use.com/development/telemetry for more information.'
      );

      // 使用模拟客户端（在真实环境中应该使用真实的 PostHog 客户端）
      this._posthogClient = new MockPostHogClient(
        ProductTelemetry.PROJECT_API_KEY,
        ProductTelemetry.HOST,
        {
          disable_geoip: false,
          enable_exception_autocapture: true,
        }
      );
    }

    if (this._posthogClient === null) {
      logger.debug('Telemetry disabled');
    }
  }

  /**
   * 捕获遥测事件
   */
  capture(event: BaseTelemetryEvent): void {
    if (this._posthogClient === null) {
      return;
    }

    this._directCapture(event);
  }

  /**
   * 直接捕获事件
   * 不应该阻塞线程，因为 PostHog 会自动处理
   */
  private _directCapture(event: BaseTelemetryEvent): void {
    if (this._posthogClient === null) {
      return;
    }

    try {
      this._posthogClient.capture(this.userId, event.name, {
        ...event.properties,
        ...POSTHOG_EVENT_SETTINGS,
      });
    } catch (error) {
      logger.error(`Failed to send telemetry event ${event.name}: ${error}`);
    }
  }

  /**
   * 刷新遥测队列
   */
  flush(): void {
    if (this._posthogClient) {
      try {
        this._posthogClient.flush();
        logger.debug('PostHog client telemetry queue flushed.');
      } catch (error) {
        logger.error(`Failed to flush PostHog client: ${error}`);
      }
    } else {
      logger.debug('PostHog client not available, skipping flush.');
    }
  }

  /**
   * 获取用户ID
   */
  get userId(): string {
    if (this._currUserId) {
      return this._currUserId;
    }

    // 文件访问可能由于权限或其他原因失败。我们不希望崩溃，所以捕获所有异常。
    try {
      if (!fs.existsSync(ProductTelemetry.USER_ID_PATH)) {
        fs.mkdirSync(path.dirname(ProductTelemetry.USER_ID_PATH), {
          recursive: true,
        });
        const newUserId = uuidv4();
        fs.writeFileSync(ProductTelemetry.USER_ID_PATH, newUserId);
        this._currUserId = newUserId;
      } else {
        this._currUserId = fs
          .readFileSync(ProductTelemetry.USER_ID_PATH, 'utf-8')
          .trim();
      }
    } catch (error) {
      this._currUserId = 'UNKNOWN_USER_ID';
    }

    return this._currUserId;
  }
}
