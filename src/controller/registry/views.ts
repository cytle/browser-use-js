/**
 * 源文件: browser_use/controller/registry/views.py
 * 功能描述: 定义动作注册表相关的视图类型，包括注册动作、动作模型、特殊参数等
 */

import { z } from 'zod';
import type { Page, BrowserSession } from '../../browser/types.js';
import type { FileSystem } from '../../filesystem/types.js';

/**
 * 注册动作类
 * 表示一个已注册的动作
 */
export class RegisteredAction {
  name: string;
  description: string;
  function: (...args: any[]) => any | Promise<any>;
  paramModel: new () => any;

  // 过滤器：提供特定域名或函数来确定该动作是否应在给定页面上可用
  domains?: string[]; // 例如 ['*.google.com', 'www.bing.com', 'yahoo.*']
  pageFilter?: (page: Page) => boolean;

  constructor(data: RegisteredAction) {
    this.name = data.name;
    this.description = data.description;
    this.function = data.function;
    this.paramModel = data.paramModel;
    this.domains = data.domains;
    this.pageFilter = data.pageFilter;
  }
}

/**
 * RegisteredAction 的实现类
 */
export class RegisteredActionImpl implements RegisteredAction {
  public name: string;
  public description: string;
  public function: (...args: any[]) => any | Promise<any>;
  public paramModel: z.ZodType<any>;
  public domains?: string[];
  public pageFilter?: (page: Page) => boolean;

  constructor(data: RegisteredAction) {
    this.name = data.name;
    this.description = data.description;
    this.function = data.function;
    this.paramModel = data.paramModel;
    this.domains = data.domains;
    this.pageFilter = data.pageFilter;
  }

  /**
   * 获取动作的提示描述
   */
  public promptDescription(): string {
    const skipKeys = ['title'];
    let s = `${this.description}: \n`;
    s += '{' + this.name + ': ';

    // 简化的 schema 描述，跳过复杂的 Zod schema 转换
    s += 'object';
    s += '}';
    return s;
  }
}

/**
 * 动作模型基类
 * 用于动态创建的动作模型
 */
export abstract class ActionModel {
  /**
   * 获取动作的索引
   */
  public getIndex(): number | null {
    // 获取模型数据
    const data = this.toObject();
    const params = Object.values(data);

    if (!params.length) {
      return null;
    }

    for (const param of params) {
      if (param && typeof param === 'object' && 'index' in param) {
        return (param as any).index;
      }
    }
    return null;
  }

  /**
   * 设置动作的索引
   */
  public setIndex(index: number): void {
    // 获取动作数据
    const actionData = this.toObject();
    const actionName = Object.keys(actionData)[0];

    if (actionName && (this as any)[actionName]) {
      const actionParams = (this as any)[actionName];
      if (
        actionParams &&
        typeof actionParams === 'object' &&
        'index' in actionParams
      ) {
        actionParams.index = index;
      }
    }
  }

  /**
   * 将模型转换为对象
   */
  protected abstract toObject(): Record<string, any>;
}

/**
 * 动作注册表类
 * 表示动作注册表
 */
export class ActionRegistry {
  public actions: Record<string, RegisteredAction> = {};

  /**
   * 匹配域名模式
   */
  private static matchDomains(
    domains: string[] | null | undefined,
    url: string
  ): boolean {
    if (!domains || !url) {
      return true;
    }

    // 使用简化的域名匹配逻辑
    // 实际实现时应该使用 utils 中的 matchUrlWithDomainPattern
    for (const domainPattern of domains) {
      // 简化的匹配逻辑，实际应该支持通配符
      if (url.includes(domainPattern.replace('*', ''))) {
        return true;
      }
    }
    return false;
  }

  /**
   * 匹配页面过滤器
   */
  private static matchPageFilter(
    pageFilter: ((page: Page) => boolean) | null | undefined,
    page: Page
  ): boolean {
    if (!pageFilter) {
      return true;
    }
    return pageFilter(page);
  }

  /**
   * 获取所有动作的提示描述
   */
  public getPromptDescription(page?: Page): string {
    if (!page) {
      // 对于系统提示（未提供页面），只包含没有过滤器的动作
      return Object.values(this.actions)
        .filter(action => !action.pageFilter && !action.domains)
        .map(action => new RegisteredActionImpl(action).promptDescription())
        .join('\n');
    }

    // 只包含当前页面的过滤动作
    const filteredActions: RegisteredAction[] = [];

    for (const action of Object.values(this.actions)) {
      if (!action.domains && !action.pageFilter) {
        // 跳过没有过滤器的动作，它们已经包含在系统提示中
        continue;
      }

      const domainIsAllowed = ActionRegistry.matchDomains(
        action.domains,
        page.url()
      );
      const pageIsAllowed = ActionRegistry.matchPageFilter(
        action.pageFilter,
        page
      );

      if (domainIsAllowed && pageIsAllowed) {
        filteredActions.push(action);
      }
    }

    return filteredActions
      .map(action => new RegisteredActionImpl(action).promptDescription())
      .join('\n');
  }

  /**
   * 注册动作
   */
  public register(action: RegisteredAction): void {
    this.actions[action.name] = action;
  }

  /**
   * 注销动作
   */
  public unregister(name: string): void {
    delete this.actions[name];
  }

  /**
   * 获取动作
   */
  public get(name: string): RegisteredAction | undefined {
    return this.actions[name];
  }

  /**
   * 检查动作是否存在
   */
  public has(name: string): boolean {
    return name in this.actions;
  }

  /**
   * 获取所有动作名称
   */
  public getActionNames(): string[] {
    return Object.keys(this.actions);
  }
}

/**
 * Context 接口（从 agent/service 导入时可能的类型）
 */
export interface Context {
  [key: string]: any;
}

/**
 * 特殊动作参数类
 * 定义可以注入到动作中的所有特殊参数
 */
export interface SpecialActionParameters {
  // 用户提供的可选上下文对象，从 Agent(context=...) 传递下来
  // 例如可以包含任何内容：外部数据库连接、文件句柄、队列、运行时配置对象等
  // 你可能希望能够从许多动作中快速访问的内容
  // browser-use 代码根本不使用这个，我们只是为了方便而将它传递给你的动作
  context?: Context | null;

  // browser-use 会话对象，可用于创建新标签页、导航、访问 playwright 对象等
  browserSession?: BrowserSession | null;

  // 对请求旧模型名称的动作的遗留支持
  browser?: BrowserSession | null;
  browserContext?: BrowserSession | null; // 额外令人困惑的是，这实际上不是指 playwright BrowserContext，
  // 而是来自 <v0.2.0 的 BrowserUse 自己的旧 BrowserContext 对象的名称
  // 应该在 v0.3.0 后弃用然后删除以避免歧义

  // 动作可以获取 playwright Page，page = await browserSession.getCurrentPage() 的快捷方式
  page?: Page | null;

  // 如果动作请求这些参数名称，则注入额外配置
  pageExtractionLlm?: any | null; // 这里使用 any，因为 LLM 类型可能复杂
  fileSystem?: FileSystem | null;
  availableFilePaths?: string[] | null;
  hasSensitiveData?: boolean;
}

/**
 * 特殊动作参数的实现类
 */
export class SpecialActionParametersImpl implements SpecialActionParameters {
  public context?: Context | null;
  public browserSession?: BrowserSession | null;
  public browser?: BrowserSession | null;
  public browserContext?: BrowserSession | null;
  public page?: Page | null;
  public pageExtractionLlm?: any | null;
  public fileSystem?: FileSystem | null;
  public availableFilePaths?: string[] | null;
  public hasSensitiveData?: boolean = false;

  constructor(data: Partial<SpecialActionParameters> = {}) {
    Object.assign(this, data);
  }

  /**
   * 获取需要 browser_session 的参数名称
   */
  public static getBrowserRequiringParams(): Set<string> {
    return new Set(['browserSession', 'browser', 'browserContext', 'page']);
  }
}
