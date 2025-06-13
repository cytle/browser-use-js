/**
 * @file purpose: 主要的测试应用组件
 */

import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { SystemTest } from './SystemTest';
import { DOMTest } from './DOMTest';
import { AgentTest } from './AgentTest';
import { LogViewer } from './LogViewer';
import { PerformanceMonitor } from './PerformanceMonitor';
import { BrowserUseDemo } from './BrowserUseDemo';
import { TestPageContent } from './TestPageContent';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';

export function TestApp() {
  const { logs, addLog } = useTestState();
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('demo');
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

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
    <div className='h-screen flex bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
      {/* 左侧主内容区域 - 测试页面 */}
      <div
        className={`flex-1 transition-all duration-300 ${isRightPanelCollapsed ? 'mr-0' : 'mr-2'}`}
      >
        <div className='h-full bg-white dark:bg-slate-800 rounded-l-lg shadow-lg overflow-hidden'>
          <div className='h-full flex flex-col'>
            {/* 左侧头部 */}
            <div className='p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'>
              <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
                <Globe className='h-5 w-5 text-blue-500' />
                测试页面区域
              </h2>
              <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                这里将显示被测试的网页内容
              </p>
            </div>

            {/* 左侧内容区域 - 测试页面内容 */}
            <div className='flex-1 overflow-hidden'>
              <TestPageContent />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧测试UI面板 */}
      <div
        className={`transition-all duration-300 ${isRightPanelCollapsed ? 'w-12' : 'w-96'} flex flex-col bg-white dark:bg-slate-800 rounded-r-lg shadow-lg`}
      >
        {/* 折叠/展开按钮 */}
        <div className='p-2 border-b border-slate-200 dark:border-slate-700'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className='w-full flex items-center justify-center'
          >
            {isRightPanelCollapsed ? (
              <ChevronLeft className='h-4 w-4' />
            ) : (
              <ChevronRight className='h-4 w-4' />
            )}
          </Button>
        </div>

        {/* 右侧面板内容 */}
        {!isRightPanelCollapsed && (
          <div className='flex-1 flex flex-col overflow-hidden'>
            {/* 右侧头部信息 */}
            <div className='p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'>
              <div className='mb-3'>
                <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
                  <Sparkles className='h-6 w-6 text-blue-500' />
                  Browser-Use JS
                </h1>
                <p className='text-slate-600 dark:text-slate-400 mt-1 text-sm'>
                  AI 代理浏览器交互演示平台
                </p>
              </div>
              {versionInfo && (
                <div className='text-center'>
                  <Badge variant='secondary' className='text-sm px-3 py-1'>
                    v{versionInfo.version}
                  </Badge>
                  <div className='text-xs text-slate-500 mt-1'>
                    Agent({versionInfo.modules.agent}) | Browser(
                    {versionInfo.modules.browser})
                  </div>
                </div>
              )}
            </div>

            {/* 右侧主要内容区域 - 标签页布局 */}
            <div className='flex-1 overflow-hidden'>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className='h-full flex flex-col'
              >
                <div className='px-2 py-2 border-b border-slate-200 dark:border-slate-700'>
                  <TabsList className='grid w-full grid-cols-3 gap-1 h-auto'>
                    <TabsTrigger
                      value='demo'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <Activity className='h-3 w-3' />
                      演示
                    </TabsTrigger>
                    <TabsTrigger
                      value='system'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <Settings className='h-3 w-3' />
                      系统
                    </TabsTrigger>
                    <TabsTrigger
                      value='dom'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <Globe className='h-3 w-3' />
                      DOM
                    </TabsTrigger>
                  </TabsList>
                  <TabsList className='grid w-full grid-cols-3 gap-1 h-auto mt-1'>
                    <TabsTrigger
                      value='agent'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <Bot className='h-3 w-3' />
                      代理
                    </TabsTrigger>
                    <TabsTrigger
                      value='performance'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <BarChart3 className='h-3 w-3' />
                      性能
                    </TabsTrigger>
                    <TabsTrigger
                      value='logs'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <FileText className='h-3 w-3' />
                      日志
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className='flex-1 overflow-auto p-2'>
                  {/* 综合演示 */}
                  <TabsContent value='demo' className='mt-0 h-full'>
                    <Card className='h-full'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Activity className='h-4 w-4 text-blue-500' />
                          综合演示
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <BrowserUseDemo />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 系统测试 */}
                  <TabsContent value='system' className='mt-0 h-full'>
                    <Card className='h-full'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Settings className='h-4 w-4 text-green-500' />
                          系统测试
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <SystemTest />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* DOM 处理 */}
                  <TabsContent value='dom' className='mt-0 h-full'>
                    <Card className='h-full'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Globe className='h-4 w-4 text-purple-500' />
                          DOM 处理
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <DOMTest />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AI 代理 */}
                  <TabsContent value='agent' className='mt-0 h-full'>
                    <Card className='h-full'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Bot className='h-4 w-4 text-orange-500' />
                          AI 代理
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <AgentTest />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 性能监控 */}
                  <TabsContent value='performance' className='mt-0 h-full'>
                    <Card className='h-full'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <BarChart3 className='h-4 w-4 text-red-500' />
                          性能监控
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <PerformanceMonitor />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 日志查看 */}
                  <TabsContent value='logs' className='mt-0 h-full'>
                    <Card className='h-full'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-indigo-500' />
                          日志查看
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <LogViewer logs={logs} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
