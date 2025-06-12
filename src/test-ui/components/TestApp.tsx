/**
 * @file purpose: 主要的测试应用组件
 */

import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SystemTest } from './SystemTest';
import { DOMTest } from './DOMTest';
import { AgentTest } from './AgentTest';
import { LogViewer } from './LogViewer';
import { PerformanceMonitor } from './PerformanceMonitor';
import { BrowserUseDemo } from './BrowserUseDemo';
import { useTestState } from '../hooks/useTestState';
import { getVersionInfo } from '../../main';
import {
  Activity,
  Settings,
  Globe,
  Bot,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';

export function TestApp() {
  const { logs, addLog } = useTestState();
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('demo');

  useEffect(() => {
    try {
      const info = getVersionInfo();
      setVersionInfo(info);
      addLog(`📋 版本信息: Browser-Use JS v${info.version}`, 'info');
    } catch (error) {
      addLog(`❌ 获取版本信息失败: ${error}`, 'error');
    }
  }, [addLog]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
      <div className='container mx-auto p-6'>
        {/* 头部信息 */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-4xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3'>
                <Sparkles className='h-10 w-10 text-blue-500' />
                Browser-Use JS
              </h1>
              <p className='text-slate-600 dark:text-slate-400 mt-2 text-lg'>
                AI 代理浏览器交互演示平台
              </p>
            </div>
            {versionInfo && (
              <div className='text-right'>
                <Badge variant='secondary' className='text-lg px-4 py-2'>
                  v{versionInfo.version}
                </Badge>
                <div className='text-sm text-slate-500 mt-2'>
                  Agent({versionInfo.modules.agent}) | Browser(
                  {versionInfo.modules.browser}) | Controller(
                  {versionInfo.modules.controller}) | DOM(
                  {versionInfo.modules.dom})
                </div>
              </div>
            )}
          </div>
          <Separator />
        </div>

        {/* 主要内容区域 - 标签页布局 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-6'>
            <TabsTrigger value='demo' className='flex items-center gap-2'>
              <Activity className='h-4 w-4' />
              综合演示
            </TabsTrigger>
            <TabsTrigger value='system' className='flex items-center gap-2'>
              <Settings className='h-4 w-4' />
              系统测试
            </TabsTrigger>
            <TabsTrigger value='dom' className='flex items-center gap-2'>
              <Globe className='h-4 w-4' />
              DOM 处理
            </TabsTrigger>
            <TabsTrigger value='agent' className='flex items-center gap-2'>
              <Bot className='h-4 w-4' />
              AI 代理
            </TabsTrigger>
            <TabsTrigger
              value='performance'
              className='flex items-center gap-2'
            >
              <BarChart3 className='h-4 w-4' />
              性能监控
            </TabsTrigger>
            <TabsTrigger value='logs' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              日志查看
            </TabsTrigger>
          </TabsList>

          {/* 综合演示 */}
          <TabsContent value='demo'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl flex items-center gap-2'>
                  <Activity className='h-6 w-6 text-blue-500' />
                  🎯 综合演示
                </CardTitle>
                <p className='text-muted-foreground'>
                  体验 Browser-Use JS 的完整工作流程，从系统初始化到 AI
                  代理任务执行
                </p>
              </CardHeader>
              <CardContent>
                <BrowserUseDemo />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 系统测试 */}
          <TabsContent value='system'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl flex items-center gap-2'>
                  <Settings className='h-6 w-6 text-green-500' />
                  🔧 系统测试
                </CardTitle>
                <p className='text-muted-foreground'>
                  初始化和配置 Browser-Use JS 系统
                </p>
              </CardHeader>
              <CardContent>
                <SystemTest />
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOM 处理 */}
          <TabsContent value='dom'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl flex items-center gap-2'>
                  <Globe className='h-6 w-6 text-purple-500' />
                  🌐 DOM 处理
                </CardTitle>
                <p className='text-muted-foreground'>
                  测试页面元素识别和交互功能
                </p>
              </CardHeader>
              <CardContent>
                <DOMTest />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI 代理 */}
          <TabsContent value='agent'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl flex items-center gap-2'>
                  <Bot className='h-6 w-6 text-orange-500' />
                  🤖 AI 代理
                </CardTitle>
                <p className='text-muted-foreground'>
                  测试 AI 代理的任务理解和执行能力
                </p>
              </CardHeader>
              <CardContent>
                <AgentTest />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 性能监控 */}
          <TabsContent value='performance'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl flex items-center gap-2'>
                  <BarChart3 className='h-6 w-6 text-red-500' />
                  📊 性能监控
                </CardTitle>
                <p className='text-muted-foreground'>
                  监控系统性能和资源使用情况
                </p>
              </CardHeader>
              <CardContent>
                <PerformanceMonitor />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 日志查看 */}
          <TabsContent value='logs'>
            <Card>
              <CardHeader>
                <CardTitle className='text-2xl flex items-center gap-2'>
                  <FileText className='h-6 w-6 text-indigo-500' />
                  📝 日志查看
                </CardTitle>
                <p className='text-muted-foreground'>
                  查看系统运行日志和调试信息
                </p>
              </CardHeader>
              <CardContent>
                <LogViewer logs={logs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 底部信息 */}
        <div className='mt-12 pt-6 border-t border-slate-200 dark:border-slate-700'>
          <div className='text-center text-sm text-slate-500 dark:text-slate-400'>
            <p>Browser-Use JS - AI 代理浏览器交互框架</p>
            <p className='mt-1'>
              基于 TypeScript + Vite + React 构建 | 集成 Vercel AI SDK |
              支持现代浏览器
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
