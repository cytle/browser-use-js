/**
 * @file purpose: Iframe 沙盒系统集成示例测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IframeSandboxDemo } from './sandbox-demo';

describe('IframeSandboxDemo', () => {
  let demo: IframeSandboxDemo;

  beforeEach(() => {
    // Mock DOM methods
    global.document = {
      createElement: vi.fn(() => ({
        id: '',
        src: '',
        style: {},
        sandbox: {
          add: vi.fn(),
        },
        setAttribute: vi.fn(),
        addEventListener: vi.fn(),
      })),
      body: {
        appendChild: vi.fn(),
      },
      contains: vi.fn(() => true),
    } as any;

    // Mock window methods
    global.window = {
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;

    demo = new IframeSandboxDemo();
  });

  afterEach(async () => {
    if (demo) {
      await demo.cleanup();
    }
  });

  describe('构造函数', () => {
    it('应该正确初始化所有模块', () => {
      expect(demo).toBeDefined();
      expect(demo.getSandboxStatus()).toEqual([]);
    });
  });

  describe('createSecureSandbox', () => {
    it('应该能够创建安全沙盒', async () => {
      // Mock 安全验证
      const mockValidateScript = vi.fn().mockResolvedValue(true);
      (demo as any).securityManager.validateScript = mockValidateScript;

      // Mock Iframe 创建
      const mockCreateIframe = vi.fn().mockResolvedValue({
        id: 'test-iframe-1',
        element: document.createElement('iframe'),
        config: { url: 'https://example.com' },
        status: 'ready',
        createdAt: Date.now(),
        lastActivity: Date.now(),
        communicationEstablished: false,
      });
      (demo as any).iframeManager.createIframe = mockCreateIframe;

      // Mock 握手
      const mockPerformHandshake = vi.fn().mockResolvedValue({
        type: 'handshake_response',
        protocolVersion: '1.0',
        capabilities: ['dom_operations'],
      });
      (demo as any).messageBridge.performHandshake = mockPerformHandshake;

      const sandboxId = await demo.createSecureSandbox('https://example.com');

      expect(sandboxId).toBe('test-iframe-1');
      expect(mockValidateScript).toHaveBeenCalled();
      expect(mockCreateIframe).toHaveBeenCalled();
      expect(mockPerformHandshake).toHaveBeenCalledWith('test-iframe-1');
    });

    it('应该在安全检查失败时抛出错误', async () => {
      // Mock 安全验证失败
      const mockValidateScript = vi.fn().mockResolvedValue(false);
      (demo as any).securityManager.validateScript = mockValidateScript;

      await expect(
        demo.createSecureSandbox('https://malicious.com')
      ).rejects.toThrow('URL 安全检查失败');
    });
  });

  describe('performDOMOperations', () => {
    it('应该能够执行 DOM 操作', async () => {
      const iframeId = 'test-iframe-1';

      // Mock DOM 适配器方法
      const mockGetPageInfo = vi.fn().mockResolvedValue({
        url: 'https://example.com',
        title: 'Test Page',
        readyState: 'complete',
        viewport: { x: 0, y: 0, width: 1024, height: 768 },
        pageSize: { width: 1024, height: 768 },
        scrollPosition: { x: 0, y: 0 },
        elementStats: { total: 10, visible: 8, interactive: 3 },
      });

      const mockQueryElement = vi.fn().mockResolvedValue({
        tagName: 'BUTTON',
        id: 'test-button',
        visible: true,
        interactive: true,
        selector: '#test-button',
        position: { x: 100, y: 100, width: 80, height: 30 },
        attributes: { type: 'button' },
        role: 'button',
      });

      const mockClickElement = vi.fn().mockResolvedValue({
        success: true,
        duration: 50,
      });

      const mockExecuteScript = vi
        .fn()
        .mockResolvedValue('Modified by Sandbox');

      (demo as any).domAdapter.getPageInfo = mockGetPageInfo;
      (demo as any).domAdapter.queryElement = mockQueryElement;
      (demo as any).domAdapter.clickElement = mockClickElement;
      (demo as any).domAdapter.executeScript = mockExecuteScript;

      await demo.performDOMOperations(iframeId);

      expect(mockGetPageInfo).toHaveBeenCalledWith(iframeId);
      expect(mockQueryElement).toHaveBeenCalledWith(iframeId, 'button');
      expect(mockClickElement).toHaveBeenCalledWith(iframeId, 'button');
      expect(mockExecuteScript).toHaveBeenCalledWith(
        iframeId,
        'document.title = "Modified by Sandbox"; return document.title;'
      );
    });
  });

  describe('monitorSecurity', () => {
    it('应该能够监控安全状态', async () => {
      const iframeId = 'test-iframe-1';

      // Mock Iframe 管理器方法
      const mockCheckHealth = vi.fn().mockResolvedValue(true);
      const mockGetIframe = vi.fn().mockReturnValue({
        id: iframeId,
        config: { url: 'https://example.com' },
        status: 'ready',
      });

      // Mock 安全管理器方法
      const mockGenerateSecurityReport = vi.fn().mockResolvedValue({
        id: 'report-1',
        iframeId,
        timestamp: Date.now(),
        securityLevel: 'low',
        threats: [],
        resourceUsage: { memory: 1024, cpu: 10, network: 0 },
        violations: [],
        recommendations: [],
      });

      (demo as any).iframeManager.checkHealth = mockCheckHealth;
      (demo as any).iframeManager.getIframe = mockGetIframe;
      (demo as any).securityManager.generateSecurityReport =
        mockGenerateSecurityReport;

      await demo.monitorSecurity(iframeId);

      expect(mockCheckHealth).toHaveBeenCalledWith(iframeId);
      expect(mockGetIframe).toHaveBeenCalledWith(iframeId);
      expect(mockGenerateSecurityReport).toHaveBeenCalled();
    });

    it('应该在发现严重威胁时销毁沙盒', async () => {
      const iframeId = 'test-iframe-1';

      // Mock 方法
      const mockCheckHealth = vi.fn().mockResolvedValue(true);
      const mockGetIframe = vi.fn().mockReturnValue({
        id: iframeId,
        config: { url: 'https://example.com' },
        status: 'ready',
      });

      const mockGenerateSecurityReport = vi.fn().mockResolvedValue({
        id: 'report-1',
        iframeId,
        timestamp: Date.now(),
        securityLevel: 'critical',
        threats: [
          {
            type: 'malicious_script',
            severity: 'critical',
            description: 'Detected malicious script execution',
            recommendation: 'Destroy iframe immediately',
          },
        ],
        resourceUsage: { memory: 1024, cpu: 10, network: 0 },
        violations: [],
        recommendations: ['Destroy iframe'],
      });

      const mockDestroyIframe = vi.fn().mockResolvedValue(undefined);
      const mockStopHeartbeat = vi.fn();

      (demo as any).iframeManager.checkHealth = mockCheckHealth;
      (demo as any).iframeManager.getIframe = mockGetIframe;
      (demo as any).iframeManager.destroyIframe = mockDestroyIframe;
      (demo as any).securityManager.generateSecurityReport =
        mockGenerateSecurityReport;
      (demo as any).messageBridge.stopHeartbeat = mockStopHeartbeat;

      await demo.monitorSecurity(iframeId);

      expect(mockDestroyIframe).toHaveBeenCalledWith(iframeId);
      expect(mockStopHeartbeat).toHaveBeenCalled();
    });
  });

  describe('handleCrossOriginRequest', () => {
    it('应该能够处理跨域请求', async () => {
      const url = 'https://api.example.com/data';
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ data: 'test data' }),
      };

      const mockProxyRequest = vi.fn().mockResolvedValue(mockResponse);
      (demo as any).crossOriginProxy.proxyRequest = mockProxyRequest;

      const result = await demo.handleCrossOriginRequest(url);

      expect(mockProxyRequest).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      expect(result).toEqual({ data: 'test data' });
    });
  });

  describe('getSandboxStatus', () => {
    it('应该返回所有沙盒的状态', () => {
      const mockGetAllIframes = vi.fn().mockReturnValue([
        {
          id: 'iframe-1',
          config: { url: 'https://example.com' },
          status: 'ready',
          createdAt: 1234567890,
          lastActivity: 1234567900,
        },
        {
          id: 'iframe-2',
          config: { url: 'https://demo.com' },
          status: 'loading',
          createdAt: 1234567800,
          lastActivity: 1234567850,
        },
      ]);

      (demo as any).iframeManager.getAllIframes = mockGetAllIframes;

      const status = demo.getSandboxStatus();

      expect(status).toHaveLength(2);
      expect(status[0]).toEqual({
        id: 'iframe-1',
        url: 'https://example.com',
        status: 'ready',
        createdAt: 1234567890,
        lastActivity: 1234567900,
      });
    });
  });

  describe('cleanup', () => {
    it('应该正确清理所有资源', async () => {
      const mockStopHeartbeat = vi.fn();
      const mockCleanup = vi.fn().mockResolvedValue(undefined);
      const mockDestroy = vi.fn();

      (demo as any).messageBridge.stopHeartbeat = mockStopHeartbeat;
      (demo as any).iframeManager.cleanup = mockCleanup;
      (demo as any).messageBridge.destroy = mockDestroy;

      await demo.cleanup();

      expect(mockStopHeartbeat).toHaveBeenCalled();
      expect(mockCleanup).toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
