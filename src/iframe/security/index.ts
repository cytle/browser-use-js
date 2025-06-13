/**
 * @file purpose: 安全管理器组件实现
 *
 * 这个文件实现了 Iframe 安全管理功能，包括脚本安全验证、恶意代码检测、
 * 安全策略应用、资源使用监控和安全报告生成。
 */

import type {
  ISecurityManager,
  SecurityConfig,
  SecurityReport,
  IframeInstance,
} from '../../types';

/**
 * 威胁类型枚举
 */
enum ThreatType {
  MALICIOUS_SCRIPT = 'malicious_script',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  RESOURCE_ABUSE = 'resource_abuse',
  POLICY_VIOLATION = 'policy_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

/**
 * 威胁严重程度
 */
type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * 威胁信息接口
 */
interface ThreatInfo {
  type: ThreatType;
  severity: ThreatSeverity;
  description: string;
  recommendation: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * 资源使用监控数据
 */
interface ResourceMonitorData {
  memory: number;
  cpu: number;
  network: number;
  timestamp: number;
}

/**
 * 违规行为记录
 */
interface ViolationRecord {
  type: string;
  description: string;
  timestamp: number;
  severity: ThreatSeverity;
  context?: Record<string, unknown>;
}

/**
 * 安全管理器实现类
 */
export class SecurityManager implements ISecurityManager {
  private readonly config: Required<SecurityConfig>;
  private readonly threatDatabase = new Map<string, ThreatInfo[]>();
  private readonly resourceMonitors = new Map<string, ResourceMonitorData[]>();
  private readonly violations = new Map<string, ViolationRecord[]>();
  private readonly malwarePatterns: RegExp[] = [];

  constructor(config: SecurityConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      timeout: config.timeout ?? 30000,
      contentSecurityPolicy:
        config.contentSecurityPolicy ?? this.getDefaultCSP(),
      allowedScriptSources: config.allowedScriptSources ?? ['self'],
      allowedStyleSources: config.allowedStyleSources ?? [
        'self',
        'unsafe-inline',
      ],
      allowedImageSources: config.allowedImageSources ?? [
        'self',
        'data:',
        'https:',
      ],
      enableScriptDetection: config.enableScriptDetection ?? true,
      malwareDetectionRules:
        config.malwareDetectionRules ?? this.getDefaultMalwareRules(),
      maxExecutionTime: config.maxExecutionTime ?? 5000,
      maxMemoryUsage: config.maxMemoryUsage ?? 100 * 1024 * 1024, // 100MB
    };

    this.initializeMalwarePatterns();
    this.log('SecurityManager initialized', { config: this.config });
  }

  /**
   * 验证脚本安全性
   */
  async validateScript(script: string): Promise<boolean> {
    try {
      // 检查恶意代码
      if (await this.detectMalware(script)) {
        this.log('Script validation failed: malware detected', {
          script: script.substring(0, 100),
        });
        return false;
      }

      // 检查危险函数调用
      if (this.containsDangerousFunctions(script)) {
        this.log('Script validation failed: dangerous functions detected');
        return false;
      }

      // 检查 XSS 模式
      if (this.containsXSSPatterns(script)) {
        this.log('Script validation failed: XSS patterns detected');
        return false;
      }

      // 语法验证
      if (!this.validateSyntax(script)) {
        this.log('Script validation failed: syntax error');
        return false;
      }

      this.log('Script validation passed');
      return true;
    } catch (error) {
      this.log(
        'Script validation error:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  /**
   * 检测恶意代码
   */
  async detectMalware(content: string): Promise<boolean> {
    try {
      // 使用预定义的恶意代码模式进行检测
      for (const pattern of this.malwarePatterns) {
        if (pattern.test(content)) {
          this.log('Malware pattern detected:', pattern.source);
          return true;
        }
      }

      // 检查可疑的编码内容
      if (this.containsSuspiciousEncoding(content)) {
        this.log('Suspicious encoding detected');
        return true;
      }

      // 检查混淆代码
      if (this.isObfuscatedCode(content)) {
        this.log('Obfuscated code detected');
        return true;
      }

      return false;
    } catch (error) {
      this.log(
        'Malware detection error:',
        error instanceof Error ? error.message : String(error)
      );
      return true; // 出错时保守处理，认为是恶意代码
    }
  }

  /**
   * 应用安全策略
   */
  async applySecurityPolicy(iframe: IframeInstance): Promise<void> {
    try {
      const element = iframe.element;

      // 设置 CSP
      if (this.config.contentSecurityPolicy) {
        element.setAttribute('csp', this.config.contentSecurityPolicy);
      }

      // 设置沙盒属性
      const sandboxValue =
        iframe.config.sandbox?.join(' ') || 'allow-scripts allow-same-origin';
      element.setAttribute('sandbox', sandboxValue);

      // 设置 referrer 策略
      element.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

      // 禁用某些功能
      element.setAttribute('allow', this.buildAllowAttribute());

      // 添加安全监听器
      this.addSecurityListeners(iframe);

      this.log('Security policy applied to iframe:', iframe.id);
    } catch (error) {
      this.log(
        'Failed to apply security policy:',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * 监控资源使用
   */
  async monitorResourceUsage(iframe: IframeInstance): Promise<void> {
    try {
      const iframeId = iframe.id;

      // 获取当前资源使用情况
      const resourceData = await this.collectResourceData(iframe);

      // 存储监控数据
      if (!this.resourceMonitors.has(iframeId)) {
        this.resourceMonitors.set(iframeId, []);
      }

      const monitors = this.resourceMonitors.get(iframeId)!;
      monitors.push(resourceData);

      // 保持最近的监控数据（最多100条）
      if (monitors.length > 100) {
        monitors.shift();
      }

      // 检查资源使用是否超限
      await this.checkResourceLimits(iframe, resourceData);

      this.log('Resource usage monitored for iframe:', iframeId);
    } catch (error) {
      this.log(
        'Resource monitoring error:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 生成安全报告
   */
  async generateSecurityReport(
    iframe: IframeInstance
  ): Promise<SecurityReport> {
    const iframeId = iframe.id;
    const now = Date.now();

    // 收集威胁信息
    const threats = this.threatDatabase.get(iframeId) || [];

    // 收集资源使用数据
    const resourceMonitors = this.resourceMonitors.get(iframeId) || [];
    const latestResource = resourceMonitors[resourceMonitors.length - 1] || {
      memory: 0,
      cpu: 0,
      network: 0,
      timestamp: now,
    };

    // 收集违规记录
    const violations = this.violations.get(iframeId) || [];

    // 计算安全等级
    const securityLevel = this.calculateSecurityLevel(threats);

    // 生成建议
    const recommendations = this.generateRecommendations(threats, violations);

    const report: SecurityReport = {
      id: `security-report-${iframeId}-${now}`,
      iframeId,
      timestamp: now,
      securityLevel,
      threats: threats.map(threat => ({
        type: threat.type,
        severity: threat.severity,
        description: threat.description,
        recommendation: threat.recommendation,
      })),
      resourceUsage: {
        memory: latestResource.memory,
        cpu: latestResource.cpu,
        network: latestResource.network,
      },
      violations: violations.map(violation => ({
        type: violation.type,
        description: violation.description,
        timestamp: violation.timestamp,
      })),
      recommendations,
    };

    this.log('Security report generated for iframe:', iframeId);
    return report;
  }

  /**
   * 添加威胁记录
   */
  addThreat(iframeId: string, threat: Omit<ThreatInfo, 'timestamp'>): void {
    if (!this.threatDatabase.has(iframeId)) {
      this.threatDatabase.set(iframeId, []);
    }

    const threats = this.threatDatabase.get(iframeId)!;
    threats.push({
      ...threat,
      timestamp: Date.now(),
    });

    // 保持最近的威胁记录（最多50条）
    if (threats.length > 50) {
      threats.shift();
    }

    this.log('Threat added for iframe:', { iframeId, threat: threat.type });
  }

  /**
   * 添加违规记录
   */
  addViolation(
    iframeId: string,
    violation: Omit<ViolationRecord, 'timestamp'>
  ): void {
    if (!this.violations.has(iframeId)) {
      this.violations.set(iframeId, []);
    }

    const violations = this.violations.get(iframeId)!;
    violations.push({
      ...violation,
      timestamp: Date.now(),
    });

    // 保持最近的违规记录（最多50条）
    if (violations.length > 50) {
      violations.shift();
    }

    this.log('Violation added for iframe:', {
      iframeId,
      violation: violation.type,
    });
  }

  /**
   * 清理安全数据
   */
  cleanup(iframeId: string): void {
    this.threatDatabase.delete(iframeId);
    this.resourceMonitors.delete(iframeId);
    this.violations.delete(iframeId);
    this.log('Security data cleaned up for iframe:', iframeId);
  }

  /**
   * 初始化恶意代码模式
   */
  private initializeMalwarePatterns(): void {
    this.config.malwareDetectionRules.forEach(rule => {
      try {
        this.malwarePatterns.push(new RegExp(rule, 'i'));
      } catch (error) {
        this.log('Invalid malware detection rule:', rule);
      }
    });
  }

  /**
   * 检查危险函数
   */
  private containsDangerousFunctions(script: string): boolean {
    const dangerousFunctions = [
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
      'document.write',
      'document.writeln',
      'innerHTML',
      'outerHTML',
      'insertAdjacentHTML',
    ];

    return dangerousFunctions.some(func =>
      new RegExp(`\\b${func}\\s*\\(`, 'i').test(script)
    );
  }

  /**
   * 检查 XSS 模式
   */
  private containsXSSPatterns(script: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(script));
  }

  /**
   * 验证语法
   */
  private validateSyntax(script: string): boolean {
    try {
      new Function(script);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查可疑编码
   */
  private containsSuspiciousEncoding(content: string): boolean {
    // 检查过度的 URL 编码
    const urlEncodedCount = (content.match(/%[0-9A-Fa-f]{2}/g) || []).length;
    if (urlEncodedCount > content.length * 0.3) {
      return true;
    }

    // 检查 Base64 编码
    const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
    const base64Matches = content.match(base64Pattern) || [];
    if (base64Matches.length > 5) {
      return true;
    }

    return false;
  }

  /**
   * 检查是否为混淆代码
   */
  private isObfuscatedCode(content: string): boolean {
    // 检查变量名长度和复杂度
    const variablePattern = /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g;
    const variables = content.match(variablePattern) || [];

    if (variables.length > 0) {
      const avgLength =
        variables.reduce((sum, v) => sum + v.length, 0) / variables.length;
      const shortVarCount = variables.filter(v => v.length <= 2).length;

      // 如果平均变量名长度很短或短变量名占比很高，可能是混淆代码
      if (avgLength < 3 || shortVarCount / variables.length > 0.7) {
        return true;
      }
    }

    return false;
  }

  /**
   * 收集资源数据
   */
  private async collectResourceData(
    iframe: IframeInstance
  ): Promise<ResourceMonitorData> {
    // 这里应该实现实际的资源监控逻辑
    // 由于浏览器限制，我们只能提供模拟数据
    return {
      memory: Math.random() * 50 * 1024 * 1024, // 模拟内存使用
      cpu: Math.random() * 100, // 模拟 CPU 使用率
      network: Math.random() * 1024 * 1024, // 模拟网络使用
      timestamp: Date.now(),
    };
  }

  /**
   * 检查资源限制
   */
  private async checkResourceLimits(
    iframe: IframeInstance,
    resourceData: ResourceMonitorData
  ): Promise<void> {
    const iframeId = iframe.id;

    // 检查内存使用
    if (resourceData.memory > this.config.maxMemoryUsage) {
      this.addThreat(iframeId, {
        type: ThreatType.RESOURCE_ABUSE,
        severity: 'high',
        description: `Memory usage exceeded limit: ${Math.round(resourceData.memory / 1024 / 1024)}MB`,
        recommendation: 'Consider reducing memory usage or increasing limits',
      });
    }

    // 检查 CPU 使用
    if (resourceData.cpu > 80) {
      this.addThreat(iframeId, {
        type: ThreatType.RESOURCE_ABUSE,
        severity: 'medium',
        description: `High CPU usage detected: ${Math.round(resourceData.cpu)}%`,
        recommendation: 'Monitor for excessive computation or infinite loops',
      });
    }
  }

  /**
   * 添加安全监听器
   */
  private addSecurityListeners(iframe: IframeInstance): void {
    const element = iframe.element;
    const iframeId = iframe.id;

    // 监听加载错误
    element.addEventListener('error', () => {
      this.addViolation(iframeId, {
        type: 'load_error',
        description: 'Iframe failed to load',
        severity: 'medium',
      });
    });

    // 监听安全策略违规（如果支持）
    if ('securitypolicyviolation' in window) {
      element.addEventListener('securitypolicyviolation', (event: any) => {
        this.addViolation(iframeId, {
          type: 'csp_violation',
          description: `CSP violation: ${event.violatedDirective}`,
          severity: 'high',
          context: {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
          },
        });
      });
    }
  }

  /**
   * 构建 allow 属性
   */
  private buildAllowAttribute(): string {
    return [
      "camera 'none'",
      "microphone 'none'",
      "geolocation 'none'",
      "payment 'none'",
      "usb 'none'",
    ].join('; ');
  }

  /**
   * 计算安全等级
   */
  private calculateSecurityLevel(
    threats: ThreatInfo[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.some(t => t.severity === 'critical')) {
      return 'critical';
    }
    if (threats.some(t => t.severity === 'high')) {
      return 'high';
    }
    if (threats.some(t => t.severity === 'medium')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    threats: ThreatInfo[],
    violations: ViolationRecord[]
  ): string[] {
    const recommendations: string[] = [];

    if (threats.length > 0) {
      recommendations.push('Review and address detected security threats');
    }

    if (violations.length > 0) {
      recommendations.push(
        'Investigate policy violations and strengthen security measures'
      );
    }

    if (threats.some(t => t.type === ThreatType.MALICIOUS_SCRIPT)) {
      recommendations.push(
        'Implement stricter script validation and content filtering'
      );
    }

    if (threats.some(t => t.type === ThreatType.RESOURCE_ABUSE)) {
      recommendations.push(
        'Monitor resource usage and implement resource limits'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring for security threats');
    }

    return recommendations;
  }

  /**
   * 获取默认 CSP
   */
  private getDefaultCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'",
    ].join('; ');
  }

  /**
   * 获取默认恶意代码检测规则
   */
  private getDefaultMalwareRules(): string[] {
    return [
      // 常见的恶意脚本模式
      'document\\.cookie',
      'window\\.location\\.href\\s*=',
      'eval\\s*\\(',
      'setTimeout\\s*\\(\\s*["\'].*["\']',
      'setInterval\\s*\\(\\s*["\'].*["\']',
      'new\\s+Function\\s*\\(',
      'XMLHttpRequest',
      'fetch\\s*\\(',
      // XSS 模式
      '<script[^>]*>',
      'javascript:',
      'on\\w+\\s*=',
      // 数据泄露模式
      'btoa\\s*\\(',
      'atob\\s*\\(',
      'JSON\\.stringify',
      // 恶意重定向
      'window\\.open\\s*\\(',
      'location\\.replace\\s*\\(',
    ];
  }

  /**
   * 日志记录
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[SecurityManager] ${message}`, data || '');
    }
  }
}

/**
 * 创建安全管理器实例
 */
export function createSecurityManager(
  config?: SecurityConfig
): ISecurityManager {
  return new SecurityManager(config);
}

// 默认导出
export default SecurityManager;
