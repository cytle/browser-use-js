/**
 * Browser-Use JS 注册表服务模块
 *
 * 源文件: browser_use/controller/registry/service.py
 * 功能描述: 动作注册和管理服务，包括动作注册、执行引擎等
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../../logging.js';
import { timeExecutionAsync } from '../../utils.js';
import type { BrowserSession } from '../../browser/types.js';
import type { Page } from '../../browser/types.js';
import type { FileSystem } from '../../filesystem/file-system.js';
import {
  ActionModel,
  ActionRegistry,
  SpecialActionParameters,
} from './views.js';
import { RegisteredAction } from './views.js';

/**
 * 上下文类型变量
 */
export type Context = any;

/**
 * 动作函数类型
 */
export type ActionFunction = (...args: any[]) => any | Promise<any>;

/**
 * 特殊参数类型映射
 */
interface SpecialParamTypes {
  context: any;
  browserSession: BrowserSession;
  browser: BrowserSession; // legacy
  browserContext: BrowserSession; // legacy
  page: Page;
  pageExtractionLlm: typeof BaseChatModel;
  availableFilePaths: any[];
  hasSensitiveData: boolean;
  fileSystem: typeof FileSystem;
}

/**
 * 注册表服务类
 */
export class Registry<TContext = Context> {
  private registry: ActionRegistry = new ActionRegistry();
  private excludeActions: string[];

  constructor(excludeActions?: string[]) {
    this.excludeActions = excludeActions || [];
  }

  /**
   * 获取特殊参数类型
   */
  private getSpecialParamTypes(): Record<string, any> {
    return {
      context: null, // Context是泛型，无法验证类型
      browserSession: null,
      browser: null, // legacy
      browserContext: null, // legacy
      page: null,
      pageExtractionLlm: BaseChatModel,
      availableFilePaths: Array,
      hasSensitiveData: Boolean,
      fileSystem: null,
    };
  }

  /**
   * 标准化动作函数签名
   */
  private normalizeActionFunctionSignature<T extends ActionModel>(
    func: ActionFunction,
    description: string,
    paramModel?: new () => T
  ): [ActionFunction, new () => T] {
    // 为简化实现，这里返回原函数和一个默认的参数模型
    // 在实际应用中，可能需要更复杂的类型检查和参数验证

    const normalizedFunc = async (...args: any[]) => {
      try {
        const result = await func(...args);
        return result;
      } catch (error) {
        logger.error(`Error executing action ${func.name}:`, error);
        throw error;
      }
    };

    // 如果没有提供参数模型，创建一个默认的
    const actualParamModel =
      paramModel || (class DefaultActionModel {} as new () => T);

    return [normalizedFunc, actualParamModel];
  }

  /**
   * 动作装饰器
   */
  action<T extends ActionModel>(
    description: string,
    options?: {
      paramModel?: new () => T;
      domains?: string[];
      allowedDomains?: string[];
      pageFilter?: (page: any) => boolean;
    }
  ) {
    const finalDomains = options?.allowedDomains || options?.domains;

    if (options?.allowedDomains && options?.domains) {
      throw new Error(
        "Cannot specify both 'domains' and 'allowedDomains' - they are aliases for the same parameter"
      );
    }

    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      const func = descriptor.value;

      // 如果动作在排除列表中，跳过注册
      if (this.excludeActions.includes(func.name)) {
        return descriptor;
      }

      // 标准化函数签名
      const [normalizedFunc, actualParamModel] =
        this.normalizeActionFunctionSignature(
          func,
          description,
          options?.paramModel
        );

      const action = new RegisteredAction({
        name: func.name,
        description,
        function: normalizedFunc,
        paramModel: actualParamModel,
        domains: finalDomains,
        pageFilter: options?.pageFilter,
      });

      this.registry.actions[func.name] = action;

      // 返回标准化的函数
      descriptor.value = normalizedFunc;
      return descriptor;
    };
  }

  /**
   * 执行动作
   */
  @timeExecutionAsync('--execute_action')
  async executeAction(
    actionName: string,
    params: Record<string, any>,
    options?: {
      browserSession?: BrowserSession;
      pageExtractionLlm?: BaseChatModel;
      fileSystem?: FileSystem;
      sensitiveData?: Record<string, string | Record<string, string>>;
      availableFilePaths?: string[];
      context?: TContext;
    }
  ): Promise<any> {
    const action = this.registry.actions[actionName];
    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    try {
      // 创建验证的参数模型
      let validatedParams: any;
      try {
        validatedParams = new action.paramModel();
        Object.assign(validatedParams, params);
      } catch (error) {
        throw new Error(
          `Invalid parameters ${JSON.stringify(params)} for action ${actionName}: ${error}`
        );
      }

      // 处理敏感数据
      if (options?.sensitiveData) {
        let currentUrl: string | undefined;
        if (options.browserSession) {
          const currentPage = await options.browserSession.getCurrentPage();
          currentUrl = currentPage?.url();
        }
        validatedParams = this.replaceSensitiveData(
          validatedParams,
          options.sensitiveData,
          currentUrl
        );
      }

      // 构建特殊上下文
      const specialContext = {
        context: options?.context,
        browserSession: options?.browserSession,
        browser: options?.browserSession, // legacy
        browserContext: options?.browserSession, // legacy
        pageExtractionLlm: options?.pageExtractionLlm,
        availableFilePaths: options?.availableFilePaths,
        hasSensitiveData:
          actionName === 'input_text' && Boolean(options?.sensitiveData),
        fileSystem: options?.fileSystem,
        page: null as Page | null,
      };

      // 处理异步页面参数
      if (options?.browserSession) {
        specialContext.page = await options.browserSession.getCurrentPage();
      }

      // 执行动作
      try {
        return await action.function(validatedParams, specialContext);
      } catch (error) {
        // 重试一次
        logger.warn(
          `⚠️ Action ${actionName}() failed: ${error}, trying one more time...`
        );
        if (options?.browserSession) {
          specialContext.page = await options.browserSession.getCurrentPage();
        }

        try {
          return await action.function(validatedParams, specialContext);
        } catch (retryError) {
          throw new Error(
            `Action ${actionName}() failed: ${error} (page may have closed or navigated away mid-action)`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes(
            'requires browser_session but none provided'
          ) ||
          error.message.includes(
            'requires page_extraction_llm but none provided'
          )
        ) {
          throw new Error(error.message);
        }
      }
      throw new Error(`Error executing action ${actionName}: ${error}`);
    }
  }

  /**
   * 记录敏感数据使用情况
   */
  private logSensitiveDataUsage(
    placeholdersUsed: Set<string>,
    currentUrl?: string
  ): void {
    if (placeholdersUsed.size > 0) {
      const urlInfo =
        currentUrl && currentUrl !== 'about:blank' ? ` on ${currentUrl}` : '';
      logger.info(
        `🔒 Using sensitive data placeholders: ${Array.from(placeholdersUsed).sort().join(', ')}${urlInfo}`
      );
    }
  }

  /**
   * 替换敏感数据占位符
   */
  private replaceSensitiveData(
    params: any,
    sensitiveData: Record<string, any>,
    currentUrl?: string
  ): any {
    const secretPattern = /<secret>(.*?)<\/secret>/g;
    const allMissingPlaceholders = new Set<string>();
    const replacedPlaceholders = new Set<string>();

    // 处理敏感数据格式
    const applicableSecrets: Record<string, string> = {};

    for (const [domainOrKey, content] of Object.entries(sensitiveData)) {
      if (typeof content === 'object' && content !== null) {
        // 新格式: {domain_pattern: {key: value}}
        if (currentUrl && currentUrl !== 'about:blank') {
          // 检查URL是否匹配域模式
          if (this.matchUrlWithDomainPattern(currentUrl, domainOrKey)) {
            Object.assign(applicableSecrets, content);
          }
        }
      } else {
        // 旧格式: {key: value}
        applicableSecrets[domainOrKey] = content;
      }
    }

    // 过滤空值
    Object.keys(applicableSecrets).forEach(key => {
      if (!applicableSecrets[key]) {
        delete applicableSecrets[key];
      }
    });

    // 递归替换密钥
    const recursivelyReplaceSecrets = (value: any): any => {
      if (typeof value === 'string') {
        let matches: RegExpMatchArray | null;
        secretPattern.lastIndex = 0; // 重置正则表达式状态

        while ((matches = secretPattern.exec(value)) !== null) {
          const placeholder = matches[1];
          if (placeholder in applicableSecrets) {
            value = value.replace(
              `<secret>${placeholder}</secret>`,
              applicableSecrets[placeholder]
            );
            replacedPlaceholders.add(placeholder);
          } else {
            allMissingPlaceholders.add(placeholder);
          }
        }
        return value;
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return value.map(recursivelyReplaceSecrets);
        } else {
          const result: Record<string, any> = {};
          for (const [k, v] of Object.entries(value)) {
            result[k] = recursivelyReplaceSecrets(v);
          }
          return result;
        }
      }
      return value;
    };

    const processedParams = recursivelyReplaceSecrets(params);

    // 记录敏感数据使用情况
    this.logSensitiveDataUsage(replacedPlaceholders, currentUrl);

    // 记录缺失的占位符
    if (allMissingPlaceholders.size > 0) {
      logger.warn(
        `Missing or empty keys in sensitive_data dictionary: ${Array.from(allMissingPlaceholders).join(', ')}`
      );
    }

    return processedParams;
  }

  /**
   * URL与域模式匹配
   */
  private matchUrlWithDomainPattern(url: string, pattern: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // 简单的通配符匹配实现
      const regexPattern = pattern.replace(/\*/g, '.*').replace(/\./g, '\\.');

      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(hostname) || regex.test(url);
    } catch {
      return false;
    }
  }

  /**
   * 创建动作模型
   */
  createActionModel(includeActions?: string[], page?: any): any {
    const availableActions: Record<string, RegisteredAction> = {};

    for (const [name, action] of Object.entries(this.registry.actions)) {
      if (includeActions && !includeActions.includes(name)) {
        continue;
      }

      // 如果没有提供页面，只包含没有过滤器的动作
      if (!page) {
        if (!action.pageFilter && !action.domains) {
          availableActions[name] = action;
        }
        continue;
      }

      // 检查域过滤器
      const domainIsAllowed = this.matchDomains(action.domains, page.url());
      const pageIsAllowed = this.matchPageFilter(action.pageFilter, page);

      if (domainIsAllowed && pageIsAllowed) {
        availableActions[name] = action;
      }
    }

    // 返回可用动作的字段定义
    const fields: Record<string, any> = {};
    for (const [name, action] of Object.entries(availableActions)) {
      fields[name] = {
        type: action.paramModel,
        optional: true,
        description: action.description,
      };
    }

    return fields;
  }

  /**
   * 匹配域名
   */
  private matchDomains(domains?: string[], url?: string): boolean {
    if (!domains || !url) return true;

    return domains.some(domain => this.matchUrlWithDomainPattern(url, domain));
  }

  /**
   * 匹配页面过滤器
   */
  private matchPageFilter(
    pageFilter?: (page: any) => boolean,
    page?: any
  ): boolean {
    if (!pageFilter || !page) return true;

    try {
      return pageFilter(page);
    } catch {
      return false;
    }
  }

  /**
   * 获取提示描述
   */
  getPromptDescription(page?: any): string {
    const availableActions = this.createActionModel(undefined, page);
    const actionNames = Object.keys(availableActions);

    if (actionNames.length === 0) {
      return 'No actions available for this page.';
    }

    let description = 'Available actions:\n';
    for (const [name, action] of Object.entries(this.registry.actions)) {
      if (actionNames.includes(name)) {
        description += `- ${name}: ${action.description}\n`;
      }
    }

    return description;
  }

  /**
   * 获取注册的动作列表
   */
  getRegisteredActions(): string[] {
    return Object.keys(this.registry.actions);
  }

  /**
   * 清除所有注册的动作
   */
  clear(): void {
    this.registry.actions = {};
  }
}
