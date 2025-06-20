/**
 * 源文件: 新建文件
 * 功能描述: 定义浏览器相关的基础类型，包括 BrowserSession 和 Page 类型
 */

import type { Page as PlaywrightPage, BrowserContext } from 'playwright';

/**
 * 页面类型别名
 * 使用 Playwright 的 Page 类型
 */
export type Page = PlaywrightPage;

/**
 * 浏览器会话接口
 * 管理浏览器实例和页面
 */
export interface BrowserSession {
  context: BrowserContext;
  pages: Page[];
  currentPageIndex: number;

  /**
   * 获取当前页面
   */
  getCurrentPage(): Promise<Page>;

  /**
   * 创建新页面
   */
  createPage(): Promise<Page>;

  /**
   * 关闭页面
   */
  closePage(page: Page): Promise<void>;

  /**
   * 切换到指定页面
   */
  switchToPage(pageIndex: number): Promise<Page>;

  /**
   * 导航到 URL
   */
  navigateToUrl(url: string): Promise<void>;

  /**
   * 关闭浏览器会话
   */
  close(): Promise<void>;
}
