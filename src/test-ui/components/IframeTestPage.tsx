/**
 * @file purpose: Iframe 测试页面组件 - 使用 iframe 系统加载测试页面
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Globe,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Monitor,
} from 'lucide-react';
import { createIframeManager } from '../../iframe';
import type { IframeConfig, IframeInstance } from '../../types';
import { IframeSandboxPermission } from '../../types';

interface IframeTestPageProps {
  /** 默认加载的 URL */
  defaultUrl?: string;
  /** 是否显示控制面板 */
  showControls?: boolean;
  /** iframe 容器的 CSS 类名 */
  containerClassName?: string;
}

export function IframeTestPage({
  defaultUrl = 'data:text/html,<h1>测试页面</h1><p>这是一个简单的测试页面</p>',
  showControls = true,
  containerClassName = '',
}: IframeTestPageProps) {
  const [iframeManager] = useState(() => createIframeManager());
  const [currentIframe, setCurrentIframe] = useState<IframeInstance | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState(defaultUrl);
  const [config, setConfig] = useState<Partial<IframeConfig>>({
    width: '100%',
    height: '600px',
    sandbox: [
      IframeSandboxPermission.ALLOW_SCRIPTS,
      IframeSandboxPermission.ALLOW_SAME_ORIGIN,
      IframeSandboxPermission.ALLOW_FORMS,
    ],
    loadTimeout: 15000,
    hidden: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      name: '本地测试页面',
      url: window.location.origin + '/test-page.html',
    },
  ];

  // 加载 iframe
  const loadIframe = async (targetUrl: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 销毁现有的 iframe
      if (currentIframe) {
        await iframeManager.destroyIframe(currentIframe.id);
        setCurrentIframe(null);
      }

      // 创建新的 iframe 配置
      const iframeConfig: IframeConfig = {
        url: targetUrl,
        ...config,
        style: {
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          ...config.style,
        },
      };

      // 创建 iframe
      const iframe = await iframeManager.createIframe(iframeConfig);

      // 将 iframe 添加到容器中
      if (
        containerRef.current &&
        iframe.element.parentNode !== containerRef.current
      ) {
        if (iframe.element.parentNode) {
          iframe.element.parentNode.removeChild(iframe.element);
        }
        containerRef.current.appendChild(iframe.element);
      }

      setCurrentIframe(iframe);
      console.log('Iframe 加载成功:', iframe);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`加载失败: ${errorMessage}`);
      console.error('Iframe 加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新 iframe
  const refreshIframe = async () => {
    if (currentIframe) {
      const currentSrc = currentIframe.element.src;
      currentIframe.element.src = 'about:blank';
      setTimeout(() => {
        currentIframe.element.src = currentSrc;
      }, 100);
    }
  };

  // 检查 iframe 健康状态
  const checkHealth = async () => {
    if (currentIframe) {
      const isHealthy = await iframeManager.checkHealth(currentIframe.id);
      console.log('Iframe 健康状态:', isHealthy);
      return isHealthy;
    }
    return false;
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (currentIframe) {
        iframeManager.destroyIframe(currentIframe.id);
      }
    };
  }, [currentIframe, iframeManager]);

  // 初始加载
  useEffect(() => {
    if (url) {
      loadIframe(url);
    }
  }, []);

  return (
    <div className={`h-full flex flex-col ${containerClassName}`}>
      {/* 控制面板 */}
      {showControls && (
        <Card className='mb-4'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Globe className='h-5 w-5 text-blue-500' />
              Iframe 测试控制台
              {currentIframe && (
                <Badge variant='outline' className='ml-2'>
                  {currentIframe.status}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* URL 输入 */}
            <div className='space-y-2'>
              <Label htmlFor='url-input'>测试页面 URL</Label>
              <div className='flex gap-2'>
                <Input
                  id='url-input'
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder='输入要测试的页面 URL'
                  className='flex-1'
                />
                <Button
                  onClick={() => loadIframe(url)}
                  disabled={isLoading || !url}
                  className='flex items-center gap-2'
                >
                  {isLoading ? (
                    <RefreshCw className='h-4 w-4 animate-spin' />
                  ) : (
                    <Globe className='h-4 w-4' />
                  )}
                  加载
                </Button>
              </div>
            </div>

            {/* 预设页面 */}
            <div className='space-y-2'>
              <Label>快速选择测试页面</Label>
              <div className='flex flex-wrap gap-2'>
                {testPages.map((page, index) => (
                  <Button
                    key={index}
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setUrl(page.url);
                      loadIframe(page.url);
                    }}
                    disabled={isLoading}
                  >
                    {page.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className='flex gap-2'>
              <Button
                onClick={refreshIframe}
                disabled={!currentIframe || isLoading}
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <RefreshCw className='h-4 w-4' />
                刷新
              </Button>
              <Button
                onClick={checkHealth}
                disabled={!currentIframe}
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <Monitor className='h-4 w-4' />
                健康检查
              </Button>
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant='outline'
                size='sm'
                className='flex items-center gap-2'
              >
                <Settings className='h-4 w-4' />
                {showAdvanced ? '隐藏' : '显示'}高级设置
              </Button>
            </div>

            {/* 高级设置 */}
            {showAdvanced && (
              <div className='space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
                <h4 className='font-semibold flex items-center gap-2'>
                  <Settings className='h-4 w-4' />
                  高级配置
                </h4>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='width'>宽度</Label>
                    <Input
                      id='width'
                      value={config.width || '100%'}
                      onChange={e =>
                        setConfig(prev => ({ ...prev, width: e.target.value }))
                      }
                      placeholder='100% 或 800px'
                    />
                  </div>
                  <div>
                    <Label htmlFor='height'>高度</Label>
                    <Input
                      id='height'
                      value={config.height || '600px'}
                      onChange={e =>
                        setConfig(prev => ({ ...prev, height: e.target.value }))
                      }
                      placeholder='600px'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='timeout'>加载超时 (毫秒)</Label>
                  <Input
                    id='timeout'
                    type='number'
                    value={config.loadTimeout || 15000}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        loadTimeout: parseInt(e.target.value),
                      }))
                    }
                    placeholder='15000'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>沙盒权限</Label>
                  <div className='space-y-2'>
                    {Object.values(IframeSandboxPermission).map(permission => (
                      <div
                        key={permission}
                        className='flex items-center space-x-2'
                      >
                        <Switch
                          id={permission}
                          checked={
                            config.sandbox?.includes(permission) || false
                          }
                          onCheckedChange={checked => {
                            setConfig(prev => ({
                              ...prev,
                              sandbox: checked
                                ? [...(prev.sandbox || []), permission]
                                : (prev.sandbox || []).filter(
                                    p => p !== permission
                                  ),
                            }));
                          }}
                        />
                        <Label htmlFor={permission} className='text-sm'>
                          {permission}
                        </Label>
                      </div>
                    ))}
                  </div>
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

            {currentIframe && !error && (
              <Alert>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>
                  Iframe 已成功加载 - ID: {currentIframe.id}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Iframe 容器 */}
      <div className='flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
        <div
          ref={containerRef}
          className='w-full h-full'
          style={{ minHeight: config.height || '600px' }}
        >
          {!currentIframe && !isLoading && (
            <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>
              <div className='text-center'>
                <Globe className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>请选择或输入一个 URL 来加载测试页面</p>
              </div>
            </div>
          )}
          {isLoading && (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <RefreshCw className='h-8 w-8 mx-auto mb-4 animate-spin text-blue-500' />
                <p className='text-gray-600 dark:text-gray-400'>
                  正在加载页面...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
