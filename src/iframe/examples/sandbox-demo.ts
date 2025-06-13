/**
 * @file purpose: Iframe 沙盒系统集成示例
 *
 * 这个示例展示了如何使用 Iframe 沙盒系统的所有功能：
 * - 创建和管理 Iframe
 * - 消息桥接通信
 * - DOM 操作适配器
 * - 安全管理
 * - 跨域代理
 */

import {
  IframeManager,
  MessageBridge,
  DOMAdapter,
  SecurityManager,
  CrossOriginProxy,
} from '../index';
import {
  IframeConfig,
  IframeSandboxPermission,
  MessageType,
  DOMOperationType,
  SecurityConfig,
  ProxyConfig,
} from '../../types';

/**
 * Iframe 沙盒系统集成示例类
 */
export class IframeSandboxDemo {
  private readonly iframeManager: IframeManager;
  private readonly messageBridge: MessageBridge;
  private readonly domAdapter: DOMAdapter;
  private readonly securityManager: SecurityManager;
  private readonly crossOriginProxy: CrossOriginProxy;

  constructor() {
    // 初始化各个模块
    this.iframeManager = new IframeManager();
    this.messageBridge = new MessageBridge({
      heartbeatInterval: 10000,
      messageTimeout: 5000,
      debug: true,
    });
    this.domAdapter = new DOMAdapter(this.messageBridge);

    const securityConfig: SecurityConfig = {
      contentSecurityPolicy:
        "default-src 'self'; script-src 'self' 'unsafe-inline'",
      allowedScriptSources: ['https://example.com', 'https://demo.com'],
      enableScriptDetection: true,
      maxExecutionTime: 30000,
    };
    this.securityManager = new SecurityManager(securityConfig);

    const proxyConfig: ProxyConfig = {
      proxyUrl: 'https://cors-proxy.example.com',
      timeout: 10000,
      allowedDomains: ['example.com', 'demo.com'],
      cache: {
        enabled: true,
        maxAge: 300000,
        maxSize: 100,
      },
      retry: {
        maxAttempts: 3,
        delay: 1000,
        backoff: 2,
      },
    };
    this.crossOriginProxy = new CrossOriginProxy(proxyConfig);

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 注册消息处理器
    this.messageBridge.registerHandler(MessageType.HANDSHAKE, async message => {
      console.log('收到握手消息:', message);
    });

    this.messageBridge.registerHandler(
      MessageType.DOM_OPERATION,
      async message => {
        console.log('收到 DOM 操作消息:', message);
      }
    );

    this.messageBridge.registerHandler(
      MessageType.ERROR_REPORT,
      async message => {
        console.error('收到错误报告:', message);
      }
    );
  }

  /**
   * 创建安全的 Iframe 沙盒
   */
  async createSecureSandbox(
    url: string,
    containerId?: string
  ): Promise<string> {
    try {
      console.log(`创建安全沙盒: ${url}`);

      // 安全检查
      const isValid = await this.securityManager.validateScript(
        `window.location.href = '${url}'`
      );
      if (!isValid) {
        throw new Error(`URL 安全检查失败: ${url}`);
      }

      // 配置 Iframe
      const iframeConfig: IframeConfig = {
        id: containerId,
        url: url,
        width: '100%',
        height: '600px',
        sandbox: [
          IframeSandboxPermission.ALLOW_SCRIPTS,
          IframeSandboxPermission.ALLOW_SAME_ORIGIN,
          IframeSandboxPermission.ALLOW_FORMS,
        ],
        loadTimeout: 15000,
        hidden: false,
        style: {
          border: '1px solid #ccc',
          borderRadius: '4px',
        },
        attributes: {
          'data-sandbox': 'true',
          'data-created': new Date().toISOString(),
        },
      };

      // 创建 Iframe
      const iframe = await this.iframeManager.createIframe(iframeConfig);
      console.log(`Iframe 创建成功: ${iframe.id}`);

      // 启动心跳检测
      this.messageBridge.startHeartbeat();

      // 执行握手
      await this.messageBridge.performHandshake(iframe.id);
      console.log(`与 Iframe ${iframe.id} 握手成功`);

      return iframe.id;
    } catch (error) {
      console.error('创建安全沙盒失败:', error);
      throw error;
    }
  }

  /**
   * 在沙盒中执行 DOM 操作
   */
  async performDOMOperations(iframeId: string): Promise<void> {
    try {
      console.log(`在 Iframe ${iframeId} 中执行 DOM 操作`);

      // 获取页面信息
      const pageInfo = await this.domAdapter.getPageInfo(iframeId);
      console.log('页面信息:', pageInfo);

      // 查询元素
      const button = await this.domAdapter.queryElement(iframeId, 'button');
      if (button) {
        console.log('找到按钮元素:', button);

        // 点击按钮
        const clickResult = await this.domAdapter.clickElement(
          iframeId,
          'button'
        );
        console.log('点击结果:', clickResult);
      }

      // 查询输入框
      const input = await this.domAdapter.queryElement(
        iframeId,
        'input[type="text"]'
      );
      if (input) {
        console.log('找到输入框:', input);

        // 输入文本
        const typeResult = await this.domAdapter.typeText(
          iframeId,
          'input[type="text"]',
          'Hello from sandbox!'
        );
        console.log('输入结果:', typeResult);
      }

      // 执行自定义脚本
      const scriptResult = await this.domAdapter.executeScript(
        iframeId,
        'document.title = "Modified by Sandbox"; return document.title;'
      );
      console.log('脚本执行结果:', scriptResult);
    } catch (error) {
      console.error('DOM 操作失败:', error);
      throw error;
    }
  }

  /**
   * 监控沙盒安全状态
   */
  async monitorSecurity(iframeId: string): Promise<void> {
    try {
      console.log(`监控 Iframe ${iframeId} 的安全状态`);

      // 检查 Iframe 健康状态
      const isHealthy = await this.iframeManager.checkHealth(iframeId);
      console.log(`Iframe 健康状态: ${isHealthy}`);

      // 生成安全报告
      const iframe = this.iframeManager.getIframe(iframeId);
      if (iframe) {
        const securityReport =
          await this.securityManager.generateSecurityReport(iframe);
        console.log('安全报告:', securityReport);

        // 如果发现安全风险，采取措施
        if (securityReport.threats.length > 0) {
          console.warn('发现安全威胁:', securityReport.threats);

          // 可以选择销毁不安全的 Iframe
          if (securityReport.securityLevel === 'critical') {
            console.log('严重威胁，销毁 Iframe');
            await this.destroySandbox(iframeId);
          }
        }
      }
    } catch (error) {
      console.error('安全监控失败:', error);
    }
  }

  /**
   * 处理跨域请求
   */
  async handleCrossOriginRequest(url: string): Promise<any> {
    try {
      console.log(`处理跨域请求: ${url}`);

      // 使用跨域代理获取数据
      const response = await this.crossOriginProxy.proxyRequest(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const data = await response.json();
      console.log('跨域请求成功:', data);
      return data;
    } catch (error) {
      console.error('跨域请求失败:', error);
      throw error;
    }
  }

  /**
   * 销毁沙盒
   */
  async destroySandbox(iframeId: string): Promise<void> {
    try {
      console.log(`销毁沙盒: ${iframeId}`);

      // 停止心跳检测
      this.messageBridge.stopHeartbeat();

      // 销毁 Iframe
      await this.iframeManager.destroyIframe(iframeId);

      console.log(`沙盒 ${iframeId} 已销毁`);
    } catch (error) {
      console.error('销毁沙盒失败:', error);
      throw error;
    }
  }

  /**
   * 清理所有资源
   */
  async cleanup(): Promise<void> {
    try {
      console.log('清理所有沙盒资源');

      // 停止心跳检测
      this.messageBridge.stopHeartbeat();

      // 清理无效的 Iframe
      await this.iframeManager.cleanup();

      // 销毁消息桥接
      this.messageBridge.destroy();

      console.log('资源清理完成');
    } catch (error) {
      console.error('资源清理失败:', error);
    }
  }

  /**
   * 获取所有沙盒状态
   */
  getSandboxStatus(): Array<{
    id: string;
    url: string;
    status: string;
    createdAt: number;
    lastActivity: number;
  }> {
    const iframes = this.iframeManager.getAllIframes();
    return iframes.map(iframe => ({
      id: iframe.id,
      url: iframe.config.url,
      status: iframe.status,
      createdAt: iframe.createdAt,
      lastActivity: iframe.lastActivity,
    }));
  }
}

/**
 * 运行完整的沙盒示例
 */
export async function runSandboxDemo(): Promise<void> {
  const demo = new IframeSandboxDemo();

  try {
    console.log('=== Iframe 沙盒系统演示开始 ===');

    // 1. 创建安全沙盒
    const sandboxId = await demo.createSecureSandbox('https://example.com');

    // 2. 等待一段时间让 Iframe 完全加载
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. 执行 DOM 操作
    await demo.performDOMOperations(sandboxId);

    // 4. 监控安全状态
    await demo.monitorSecurity(sandboxId);

    // 5. 处理跨域请求
    try {
      await demo.handleCrossOriginRequest('https://api.example.com/data');
    } catch (error) {
      console.log('跨域请求演示完成（预期可能失败）');
    }

    // 6. 显示沙盒状态
    const status = demo.getSandboxStatus();
    console.log('当前沙盒状态:', status);

    // 7. 等待一段时间观察
    console.log('等待 5 秒钟观察沙盒运行...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 8. 清理资源
    await demo.cleanup();

    console.log('=== Iframe 沙盒系统演示完成 ===');
  } catch (error) {
    console.error('沙盒演示失败:', error);
    await demo.cleanup();
  }
}

/**
 * 默认导出
 */
export default IframeSandboxDemo;
