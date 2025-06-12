/**
 * @file purpose: 主要的测试应用组件
 */

import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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

        {/* 主要内容区域 - 平铺布局 */}
        <div className='space-y-8'>
          {/* 系统测试 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>🔧 系统测试</CardTitle>
            </CardHeader>
            <CardContent>
              <SystemTest />
            </CardContent>
          </Card>

          {/* DOM 处理 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>🌐 DOM 处理</CardTitle>
            </CardHeader>
            <CardContent>
              <DOMTest />
            </CardContent>
          </Card>

          {/* AI 代理 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>🤖 AI 代理</CardTitle>
            </CardHeader>
            <CardContent>
              <AgentTest />
            </CardContent>
          </Card>

          {/* 性能监控 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>📊 性能监控</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceMonitor />
            </CardContent>
          </Card>

          {/* 日志查看 */}
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>📝 日志查看</CardTitle>
            </CardHeader>
            <CardContent>
              <LogViewer logs={logs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
