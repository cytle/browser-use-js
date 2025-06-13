/**
 * @file purpose: 跨域代理组件实现
 *
 * 这个文件实现了跨域代理功能，允许 Iframe 安全地访问跨域资源。
 * 包括请求代理、域名白名单管理、缓存机制和重试逻辑。
 */

import type { ICrossOriginProxy, ProxyConfig } from '../../types';

/**
 * 缓存项接口
 */
interface CacheItem {
  /** 响应数据 */
  response: Response;
  /** 缓存时间 */
  timestamp: number;
  /** 过期时间 */
  expiresAt: number;
}

/**
 * 请求统计信息
 */
interface RequestStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 缓存命中数 */
  cacheHits: number;
  /** 平均响应时间 */
  averageResponseTime: number;
}

/**
 * 跨域代理实现类
 */
export class CrossOriginProxy implements ICrossOriginProxy {
  private readonly config: Required<ProxyConfig>;
  private readonly cache = new Map<string, CacheItem>();
  private readonly allowedDomains = new Set<string>();
  private readonly blockedDomains = new Set<string>();
  private readonly stats: RequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    averageResponseTime: 0,
  };

  constructor(config: ProxyConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      timeout: config.timeout ?? 30000,
      proxyUrl: config.proxyUrl ?? '',
      allowedDomains: config.allowedDomains ?? [],
      blockedDomains: config.blockedDomains ?? [],
      allowedHeaders: config.allowedHeaders ?? [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Referer',
      ],
      cache: {
        enabled: config.cache?.enabled ?? true,
        maxAge: config.cache?.maxAge ?? 300000, // 5 minutes
        maxSize: config.cache?.maxSize ?? 100,
        ...config.cache,
      },
      retry: {
        maxAttempts: config.retry?.maxAttempts ?? 3,
        delay: config.retry?.delay ?? 1000,
        backoff: config.retry?.backoff ?? 2,
        ...config.retry,
      },
    };

    // 初始化允许和禁止的域名列表
    this.config.allowedDomains.forEach(domain =>
      this.allowedDomains.add(domain)
    );
    this.config.blockedDomains.forEach(domain =>
      this.blockedDomains.add(domain)
    );

    this.log('CrossOriginProxy initialized', { config: this.config });
  }

  /**
   * 代理请求
   */
  async proxyRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // 验证 URL
      const parsedUrl = new URL(url);
      if (!this.isDomainAllowed(parsedUrl.hostname)) {
        throw new Error(`Domain not allowed: ${parsedUrl.hostname}`);
      }

      // 检查缓存
      if (
        this.config.cache.enabled &&
        (!options.method || options.method === 'GET')
      ) {
        const cached = this.getCachedResponse(url);
        if (cached) {
          this.stats.cacheHits++;
          this.log('Cache hit for URL:', url);
          return cached.clone();
        }
      }

      // 执行请求（带重试）
      const response = await this.executeRequestWithRetry(url, options);

      // 缓存响应
      if (
        this.config.cache.enabled &&
        response.ok &&
        (!options.method || options.method === 'GET')
      ) {
        this.cacheResponse(url, response.clone());
      }

      this.stats.successfulRequests++;
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);

      this.log('Request successful:', {
        url,
        status: response.status,
        responseTime,
      });
      return response;
    } catch (error) {
      this.stats.failedRequests++;
      this.log('Request failed:', { url, error: error.message });
      throw error;
    }
  }

  /**
   * 检查域名是否被允许
   */
  isDomainAllowed(domain: string): boolean {
    // 如果在禁止列表中，直接拒绝
    if (this.blockedDomains.has(domain)) {
      return false;
    }

    // 如果没有设置允许列表，默认允许（除非在禁止列表中）
    if (this.allowedDomains.size === 0) {
      return true;
    }

    // 检查是否在允许列表中
    if (this.allowedDomains.has(domain)) {
      return true;
    }

    // 检查通配符匹配
    for (const allowedDomain of this.allowedDomains) {
      if (allowedDomain.startsWith('*.')) {
        const baseDomain = allowedDomain.slice(2);
        if (domain.endsWith(baseDomain)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 添加允许的域名
   */
  addAllowedDomain(domain: string): void {
    this.allowedDomains.add(domain);
    this.log('Added allowed domain:', domain);
  }

  /**
   * 移除允许的域名
   */
  removeAllowedDomain(domain: string): void {
    this.allowedDomains.delete(domain);
    this.log('Removed allowed domain:', domain);
  }

  /**
   * 添加禁止的域名
   */
  addBlockedDomain(domain: string): void {
    this.blockedDomains.add(domain);
    this.log('Added blocked domain:', domain);
  }

  /**
   * 移除禁止的域名
   */
  removeBlockedDomain(domain: string): void {
    this.blockedDomains.delete(domain);
    this.log('Removed blocked domain:', domain);
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * 获取统计信息
   */
  getStats(): RequestStats {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    Object.assign(this.stats, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
    });
    this.log('Stats reset');
  }

  /**
   * 执行带重试的请求
   */
  private async executeRequestWithRetry(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    let lastError: Error;
    let delay = this.config.retry.delay;

    for (let attempt = 1; attempt <= this.config.retry.maxAttempts; attempt++) {
      try {
        return await this.executeRequest(url, options);
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.retry.maxAttempts) {
          break;
        }

        this.log(
          `Request attempt ${attempt} failed, retrying in ${delay}ms:`,
          error.message
        );
        await this.sleep(delay);
        delay *= this.config.retry.backoff;
      }
    }

    throw lastError!;
  }

  /**
   * 执行单次请求
   */
  private async executeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    // 准备请求选项
    const requestOptions: RequestInit = {
      ...options,
      headers: this.sanitizeHeaders(options.headers),
    };

    // 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // 如果配置了代理服务器，使用代理
      const requestUrl = this.config.proxyUrl
        ? `${this.config.proxyUrl}?url=${encodeURIComponent(url)}`
        : url;

      const response = await fetch(requestUrl, {
        ...requestOptions,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 清理请求头
   */
  private sanitizeHeaders(headers?: HeadersInit): HeadersInit {
    if (!headers) {
      return {};
    }

    const sanitized: Record<string, string> = {};
    const headersObj = new Headers(headers);

    for (const [key, value] of headersObj.entries()) {
      if (this.config.allowedHeaders.includes(key)) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * 获取缓存的响应
   */
  private getCachedResponse(url: string): Response | null {
    const cached = this.cache.get(url);
    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(url);
      return null;
    }

    return cached.response;
  }

  /**
   * 缓存响应
   */
  private cacheResponse(url: string, response: Response): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.cache.maxSize) {
      // 删除最旧的缓存项
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const now = Date.now();
    this.cache.set(url, {
      response,
      timestamp: now,
      expiresAt: now + this.config.cache.maxAge,
    });
  }

  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(responseTime: number): void {
    const totalTime =
      this.stats.averageResponseTime * (this.stats.successfulRequests - 1);
    this.stats.averageResponseTime =
      (totalTime + responseTime) / this.stats.successfulRequests;
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 日志记录
   */
  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[CrossOriginProxy] ${message}`, data || '');
    }
  }
}

/**
 * 创建跨域代理实例
 */
export function createCrossOriginProxy(
  config?: ProxyConfig
): ICrossOriginProxy {
  return new CrossOriginProxy(config);
}

// 默认导出
export default CrossOriginProxy;
