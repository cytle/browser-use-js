/**
 * Browser-Use JS 浏览器服务
 *
 * 源文件: browser_use/browser/service.py
 * 功能描述: 核心浏览器控制服务，管理浏览器会话、页面导航、截图等功能
 */

import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import { BrowserProfile } from './profile.js';
import { TabInfo, BrowserStateSummary, BrowserError } from './views.js';
import { DomService } from '../dom/service.js';
import { ClickableElementProcessor } from '../dom/clickable-element-processor/service.js';
import { logger } from '../logging.js';

interface CachedClickableElementHashes {
  hashes: Set<string>;
  timestamp: number;
}

export class BrowserService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private currentPage: Page | null = null;
  private profile: BrowserProfile;
  private initialized = false;
  private cachedClickableElementHashes: CachedClickableElementHashes | null =
    null;
  private readonly cacheTimeoutMs = 5000; // 5秒缓存超时

  constructor(profile: BrowserProfile = new BrowserProfile()) {
    this.profile = profile;
  }

  /**
   * 启动浏览器会话
   */
  async start(): Promise<void> {
    if (this.initialized && this.isConnected()) {
      return;
    }

    try {
      // 启动浏览器
      this.browser = await chromium.launch({
        headless: this.profile.headless,
        args: this.profile.getChromiumArgs(),
        executablePath: this.profile.executablePath || undefined,
        downloadsPath: this.profile.downloadsPath || undefined,
        proxy: this.profile.proxy || undefined,
      });

      // 创建浏览器上下文
      this.context = await this.browser.newContext({
        viewport: this.profile.viewport || undefined,
        userAgent: this.profile.userAgent || undefined,
        locale: this.profile.locale || undefined,
        colorScheme: this.profile.colorScheme || undefined,
        timezoneId: this.profile.timezoneId || undefined,
        geolocation: this.profile.geolocation || undefined,
        permissions: this.profile.permissions || undefined,
        storageState: this.profile.storageState || undefined,
        recordVideo: this.profile.recordVideo
          ? { dir: this.profile.recordVideo }
          : undefined,
        recordHar: this.profile.recordHar
          ? { path: this.profile.recordHar }
          : undefined,
      });

      // 创建初始页面
      this.currentPage = await this.context.newPage();
      this.initialized = true;

      logger.info('🎭 Browser session started successfully');
    } catch (error) {
      logger.error('Failed to start browser session:', error);
      throw new BrowserError(`Failed to start browser: ${error}`);
    }
  }

  /**
   * 停止浏览器会话
   */
  async stop(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }

      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      this.currentPage = null;
      this.initialized = false;
      this.cachedClickableElementHashes = null;

      logger.info('🛑 Browser session stopped');
    } catch (error) {
      logger.error('Error stopping browser session:', error);
    }
  }

  /**
   * 检查浏览器连接状态
   */
  isConnected(): boolean {
    return !!(this.browser?.isConnected() && this.context && this.currentPage);
  }

  /**
   * 获取当前页面
   */
  async getCurrentPage(): Promise<Page> {
    if (!this.currentPage) {
      throw new BrowserError('No current page available');
    }
    return this.currentPage;
  }

  /**
   * 导航到指定URL
   */
  async navigateToUrl(url: string): Promise<void> {
    const page = await this.getCurrentPage();

    try {
      await page.goto(url, {
        waitUntil: this.profile.waitUntil || 'networkidle',
        timeout: this.profile.timeout,
      });

      // 清除缓存
      this.cachedClickableElementHashes = null;

      logger.info(`🌐 Navigated to: ${url}`);
    } catch (error) {
      logger.error(`Failed to navigate to ${url}:`, error);
      throw new BrowserError(`Navigation failed: ${error}`);
    }
  }

  /**
   * 创建新标签页
   */
  async createNewTab(url?: string): Promise<Page> {
    if (!this.context) {
      throw new BrowserError('Browser context not available');
    }

    const newPage = await this.context.newPage();

    if (url) {
      await newPage.goto(url, {
        waitUntil: this.profile.waitUntil || 'networkidle',
        timeout: this.profile.timeout,
      });
    }

    this.currentPage = newPage;
    this.cachedClickableElementHashes = null;

    logger.info(`📄 Created new tab${url ? ` and navigated to: ${url}` : ''}`);
    return newPage;
  }

  /**
   * 切换到指定标签页
   */
  async switchToTab(pageId: number): Promise<void> {
    if (!this.context) {
      throw new BrowserError('Browser context not available');
    }

    const pages = this.context.pages();
    const targetPage = pages[pageId];

    if (!targetPage) {
      throw new BrowserError(`Tab with ID ${pageId} not found`);
    }

    this.currentPage = targetPage;
    await targetPage.bringToFront();
    this.cachedClickableElementHashes = null;

    logger.info(`🔄 Switched to tab ${pageId}`);
  }

  /**
   * 关闭指定标签页
   */
  async closeTab(pageId: number): Promise<void> {
    if (!this.context) {
      throw new BrowserError('Browser context not available');
    }

    const pages = this.context.pages();
    const targetPage = pages[pageId];

    if (!targetPage) {
      throw new BrowserError(`Tab with ID ${pageId} not found`);
    }

    await targetPage.close();

    // 如果关闭的是当前页面，切换到其他页面
    if (this.currentPage === targetPage) {
      const remainingPages = this.context.pages();
      this.currentPage = remainingPages.length > 0 ? remainingPages[0] : null;
    }

    this.cachedClickableElementHashes = null;
    logger.info(`❌ Closed tab ${pageId}`);
  }

  /**
   * 获取所有标签页信息
   */
  async getTabsInfo(): Promise<TabInfo[]> {
    if (!this.context) {
      throw new BrowserError('Browser context not available');
    }

    const pages = this.context.pages();
    const tabsInfo: TabInfo[] = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      try {
        const title = await page.title();
        const url = page.url();

        tabsInfo.push(new TabInfo(i, url, title));
      } catch (error) {
        logger.warn(`Failed to get info for tab ${i}:`, error);
        tabsInfo.push(new TabInfo(i, 'about:blank', 'Error loading tab info'));
      }
    }

    return tabsInfo;
  }

  /**
   * 截取页面截图
   */
  async takeScreenshot(format: 'png' | 'jpeg' = 'png'): Promise<string> {
    const page = await this.getCurrentPage();

    try {
      const screenshot = await page.screenshot({
        type: format,
        fullPage: false, // 只截取可视区域
        quality: format === 'jpeg' ? 80 : undefined,
      });

      return screenshot.toString('base64');
    } catch (error) {
      logger.error('Failed to take screenshot:', error);
      throw new BrowserError(`Screenshot failed: ${error}`);
    }
  }

  /**
   * 获取可点击元素哈希（带缓存）
   */
  async getClickableElementsHashes(): Promise<Set<string>> {
    const now = Date.now();

    // 检查缓存是否有效
    if (
      this.cachedClickableElementHashes &&
      now - this.cachedClickableElementHashes.timestamp < this.cacheTimeoutMs
    ) {
      return this.cachedClickableElementHashes.hashes;
    }

    const page = await this.getCurrentPage();
    const domService = new DomService(page, logger);
    const domTree = await domService.getClickableElements();

    if (!domTree) {
      return new Set();
    }

    const hashes =
      ClickableElementProcessor.getClickableElementsHashes(domTree);

    // 更新缓存
    this.cachedClickableElementHashes = {
      hashes,
      timestamp: now,
    };

    return hashes;
  }

  /**
   * 清除可点击元素缓存
   */
  clearClickableElementsCache(): void {
    this.cachedClickableElementHashes = null;
  }

  /**
   * 获取浏览器状态摘要
   */
  async getStateSummary(): Promise<BrowserStateSummary> {
    const page = await this.getCurrentPage();
    const domService = new DomService(page, logger);

    try {
      // 获取DOM树和可点击元素
      const elementTree = await domService.getClickableElements();
      const selectorMap = await domService.getSelectorMap();
      const tabs = await this.getTabsInfo();

      const url = page.url();
      const title = await page.title();

      return new BrowserStateSummary(
        url,
        title,
        elementTree,
        selectorMap,
        tabs
      );
    } catch (error) {
      logger.error('Failed to get state summary:', error);
      throw new BrowserError(`Failed to get state summary: ${error}`);
    }
  }

  /**
   * 滚动页面
   */
  async scroll(x: number, y: number): Promise<void> {
    const page = await this.getCurrentPage();

    try {
      await page.evaluate(
        (scrollX, scrollY) => {
          window.scrollBy(scrollX, scrollY);
        },
        x,
        y
      );

      // 清除缓存，因为页面视图可能已改变
      this.cachedClickableElementHashes = null;

      logger.debug(`📜 Scrolled by (${x}, ${y})`);
    } catch (error) {
      logger.error('Failed to scroll:', error);
      throw new BrowserError(`Scroll failed: ${error}`);
    }
  }

  /**
   * 等待元素出现
   */
  async waitForElement(selector: string, timeout = 30000): Promise<void> {
    const page = await this.getCurrentPage();

    try {
      await page.waitForSelector(selector, { timeout });
      logger.debug(`⏳ Element appeared: ${selector}`);
    } catch (error) {
      logger.error(`Element did not appear: ${selector}`, error);
      throw new BrowserError(`Element wait timeout: ${selector}`);
    }
  }

  /**
   * 获取页面内容（文本）
   */
  async getPageContent(): Promise<string> {
    const page = await this.getCurrentPage();

    try {
      return (await page.textContent('body')) || '';
    } catch (error) {
      logger.error('Failed to get page content:', error);
      throw new BrowserError(`Failed to get page content: ${error}`);
    }
  }
}
