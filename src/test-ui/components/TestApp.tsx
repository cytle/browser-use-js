/**
 * @file purpose: 主要的测试应用组件
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { SystemTest } from './SystemTest';
import { DOMTest } from './DOMTest';
import { AgentTest } from './AgentTest';
import { LogViewer } from './LogViewer';
import { PerformanceMonitor } from './PerformanceMonitor';
import { useTestState } from '../hooks/useTestState';
import { getVersionInfo } from '../../main';

export function TestApp() {
  const { logs, addLog } = useTestState();
  const [versionInfo, setVersionInfo] = useState<any>(null);

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
              <h1 className='text-4xl font-bold text-slate-900 dark:text-slate-100'>
                Browser-Use JS 测试界面
              </h1>
              <p className='text-slate-600 dark:text-slate-400 mt-2'>
                AI 代理浏览器交互测试工具
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

        {/* 主要内容区域 */}
        <Tabs defaultValue='system' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='system'>系统测试</TabsTrigger>
            <TabsTrigger value='dom'>DOM 处理</TabsTrigger>
            <TabsTrigger value='agent'>AI 代理</TabsTrigger>
            <TabsTrigger value='performance'>性能监控</TabsTrigger>
            <TabsTrigger value='logs'>日志查看</TabsTrigger>
          </TabsList>

          <TabsContent value='system' className='space-y-6'>
            <SystemTest />
          </TabsContent>

          <TabsContent value='dom' className='space-y-6'>
            <DOMTest />
          </TabsContent>

          <TabsContent value='agent' className='space-y-6'>
            <AgentTest />
          </TabsContent>

          <TabsContent value='performance' className='space-y-6'>
            <PerformanceMonitor />
          </TabsContent>

          <TabsContent value='logs' className='space-y-6'>
            <LogViewer logs={logs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
