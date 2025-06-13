/**
 * @file purpose: 页面控制台组件 - 直接控制左侧页面的 URL 导航
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface PageControllerProps {
  /** 默认加载的 URL */
  defaultUrl?: string;
  /** 是否显示控制面板 */
  showControls?: boolean;
  /** 容器的 CSS 类名 */
  containerClassName?: string;
  /** 页面导航回调函数 */
  onNavigate?: (url: string) => void;
}

export function IframeTestPage({
  defaultUrl = 'https://www.google.com',
  showControls = true,
  containerClassName = '',
  onNavigate,
}: PageControllerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState(defaultUrl);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  // 预定义的测试页面
  const testPages = [
    {
      name: '内置测试页面',
      url:
        'data:text/html,' +
        encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Browser-Use JS 测试页面</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white; }
            .btn:hover { background: #0056b3; }
            .input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; width: 200px; }
            .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Browser-Use JS 测试页面</h1>
            <p>这是一个专门用于测试 AI 代理交互能力的页面。</p>

            <div class="card">
              <h3>按钮测试</h3>
              <button class="btn" onclick="alert('按钮1被点击!')">点击按钮1</button>
              <button class="btn" onclick="alert('按钮2被点击!')">点击按钮2</button>
              <button class="btn" onclick="document.getElementById('result').innerHTML='按钮3被点击!'">点击按钮3</button>
            </div>

            <div class="card">
              <h3>表单测试</h3>
              <input type="text" class="input" placeholder="请输入文本" id="textInput">
              <button class="btn" onclick="document.getElementById('result').innerHTML='输入内容: ' + document.getElementById('textInput').value">提交文本</button>
            </div>

            <div class="card">
              <h3>链接测试</h3>
              <a href="#" onclick="alert('链接被点击!'); return false;">测试链接</a>
            </div>

            <div class="card">
              <h3>结果显示</h3>
              <div id="result" style="padding: 10px; background: #e9ecef; border-radius: 4px;">等待操作...</div>
            </div>
          </div>
        </body>
        </html>
      `),
    },
    {
      name: 'Google 搜索',
      url: 'https://www.google.com',
    },
    {
      name: 'GitHub',
      url: 'https://github.com',
    },
    {
      name: 'Wikipedia',
      url: 'https://zh.wikipedia.org',
    },
    {
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
    },
    {
      name: '本地测试页面',
      url: window.location.origin + '/test-page.html',
    },
  ];

  // 导航到指定页面
  const navigateToPage = async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 如果提供了导航回调，使用回调函数
      if (onNavigate) {
        await onNavigate(targetUrl);
      } else {
        // 否则直接在当前窗口导航
        window.location.href = targetUrl;
      }

      setCurrentUrl(targetUrl);
      console.log('页面导航成功:', targetUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`导航失败: ${errorMessage}`);
      console.error('页面导航失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新当前页面
  const refreshPage = () => {
    if (currentUrl) {
      navigateToPage(currentUrl);
    } else {
      window.location.reload();
    }
  };

  // 在新标签页中打开
  const openInNewTab = (targetUrl: string) => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`h-full flex flex-col ${containerClassName}`}>
      {/* 控制面板 */}
      {showControls && (
        <Card className='mb-4'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Globe className='h-5 w-5 text-blue-500' />
              页面导航控制台
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* URL 输入 */}
            <div className='space-y-2'>
              <Label htmlFor='url-input'>目标页面 URL</Label>
              <div className='flex gap-2'>
                <Input
                  id='url-input'
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder='输入要导航的页面 URL'
                  className='flex-1'
                  onKeyDown={e => {
                    if (e.key === 'Enter' && url) {
                      navigateToPage(url);
                    }
                  }}
                />
                <Button
                  onClick={() => navigateToPage(url)}
                  disabled={isLoading || !url}
                  className='flex items-center gap-2'
                >
                  {isLoading ? (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  ) : (
                    <Globe className='h-4 w-4' />
                  )}
                  导航
                </Button>
                <Button
                  onClick={() => openInNewTab(url)}
                  disabled={!url}
                  variant='outline'
                  className='flex items-center gap-2'
                >
                  <ExternalLink className='h-4 w-4' />
                  新标签页
                </Button>
              </div>
            </div>

            {/* 预设页面 */}
            <div className='space-y-2'>
              <Label>快速导航到测试页面</Label>
              <div className='flex flex-wrap gap-2'>
                {testPages.map((page, index) => (
                  <Button
                    key={index}
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setUrl(page.url);
                      navigateToPage(page.url);
                    }}
                    disabled={isLoading}
                    className='flex items-center gap-1'
                  >
                    {page.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className='flex gap-2'>
              <Button
                onClick={refreshPage}
                disabled={isLoading}
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <RefreshCw className='h-4 w-4' />
                刷新页面
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant='outline'
                size='sm'
              >
                后退
              </Button>
              <Button
                onClick={() => window.history.forward()}
                variant='outline'
                size='sm'
              >
                前进
              </Button>
            </div>

            {/* 当前页面信息 */}
            {currentUrl && (
              <div className='space-y-2'>
                <Label>当前页面</Label>
                <div className='p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm font-mono break-all'>
                  {currentUrl}
                </div>
              </div>
            )}

            {/* 状态显示 */}
            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentUrl && !error && (
              <Alert>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>页面导航成功</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 说明信息 */}
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center text-gray-600 dark:text-gray-400'>
            <Globe className='h-8 w-8 mx-auto mb-2 opacity-50' />
            <p className='text-sm'>使用上方的控制面板来导航到不同的测试页面</p>
            <p className='text-xs mt-1 opacity-75'>
              页面将在左侧区域或当前窗口中加载
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
