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
import { ClickableElementTest } from './ClickableElementTest';
import { IframeTestPage } from './IframeTestPage';
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
  GripVertical,
  MousePointer,
  Frame,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function TestApp() {
  const { logs, addLog } = useTestState();
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('demo');
  const [useIframeMode, setUseIframeMode] = useState(false);

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
    <div className='h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800'>
      <PanelGroup direction='horizontal' className='h-full'>
        {/* 左侧主内容区域 - 测试页面 */}
        <Panel defaultSize={70} minSize={30} className='flex'>
          <div className='flex-1 bg-white dark:bg-slate-800 rounded-l-lg shadow-lg overflow-hidden m-2 mr-1'>
            <div className='h-full flex flex-col'>
              {/* 左侧头部 */}
              <div className='p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
                      <Globe className='h-5 w-5 text-blue-500' />
                      测试页面区域
                    </h2>
                    <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                      {useIframeMode
                        ? '使用 Iframe 沙盒模式加载测试页面'
                        : '直接显示测试页面内容'}
                    </p>
                  </div>
                  <button
                    onClick={() => setUseIframeMode(!useIframeMode)}
                    className='flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                  >
                    {useIframeMode ? (
                      <>
                        <ToggleRight className='h-4 w-4' />
                        Iframe 模式
                      </>
                    ) : (
                      <>
                        <ToggleLeft className='h-4 w-4' />
                        直接模式
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 左侧内容区域 - 测试页面内容 */}
              <div className='flex-1 overflow-hidden'>
                {useIframeMode ? (
                  <IframeTestPage
                    showControls={false}
                    containerClassName='h-full'
                    defaultUrl={
                      'data:text/html,' +
                      encodeURIComponent(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Browser-Use JS 测试页面</title>
                        <meta charset="utf-8">
                        <style>
                          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; margin: 0; }
                          .container { max-width: 100%; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                          .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; background: #007bff; color: white; }
                          .btn:hover { background: #0056b3; }
                          .input { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; width: 200px; }
                          .card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
                          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <h1>🚀 Browser-Use JS Iframe 测试页面</h1>
                          <p>这是一个在 Iframe 沙盒中运行的测试页面，用于测试 AI 代理的交互能力。</p>

                          <div class="grid">
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
                              <a href="#" onclick="alert('链接被点击!'); return false;" style="color: #007bff; text-decoration: underline;">测试链接</a>
                            </div>

                            <div class="card">
                              <h3>选择器测试</h3>
                              <select id="selector" onchange="document.getElementById('result').innerHTML='选择了: ' + this.value">
                                <option value="">请选择</option>
                                <option value="选项1">选项1</option>
                                <option value="选项2">选项2</option>
                                <option value="选项3">选项3</option>
                              </select>
                            </div>
                          </div>

                          <div class="card">
                            <h3>结果显示</h3>
                            <div id="result" style="padding: 10px; background: #e9ecef; border-radius: 4px; min-height: 40px;">等待操作...</div>
                          </div>
                        </div>
                      </body>
                      </html>
                    `)
                    }
                  />
                ) : (
                  <TestPageContent />
                )}
              </div>
            </div>
          </div>
        </Panel>

        {/* 可调整大小的分隔条 */}
        <PanelResizeHandle className='w-2 bg-transparent hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center group'>
          <div className='w-1 h-8 bg-slate-300 dark:bg-slate-600 rounded-full group-hover:bg-blue-400 dark:group-hover:bg-blue-500 transition-colors duration-200 flex items-center justify-center'>
            <GripVertical className='h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-white' />
          </div>
        </PanelResizeHandle>

        {/* 右侧测试UI面板 */}
        <Panel defaultSize={30} minSize={20} maxSize={50} className='flex'>
          <div className='flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-r-lg shadow-lg overflow-hidden m-2 ml-1'>
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
                  <TabsList className='grid w-full grid-cols-4 gap-1 h-auto'>
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
                    <TabsTrigger
                      value='iframe'
                      className='flex flex-col items-center gap-1 text-xs p-2'
                    >
                      <Frame className='h-3 w-3' />
                      Iframe
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
                  <TabsContent value='demo' className='mt-0'>
                    <Card>
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
                  <TabsContent value='system' className='mt-0'>
                    <Card>
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

                  {/* DOM 测试 */}
                  <TabsContent value='dom' className='mt-0 '>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Globe className='h-4 w-4 text-purple-500' />
                          DOM 测试
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <DOMTest />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Iframe 测试页面 */}
                  <TabsContent value='iframe' className='mt-0'>
                    <div className='h-full'>
                      <IframeTestPage showControls={true} />
                    </div>
                  </TabsContent>

                  {/* 代理测试 */}
                  <TabsContent value='agent' className='mt-0 '>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <Bot className='h-4 w-4 text-orange-500' />
                          代理测试
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <AgentTest />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 性能监控 */}
                  <TabsContent value='performance' className='mt-0 '>
                    <Card>
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

                  {/* 日志查看器 */}
                  <TabsContent value='logs' className='mt-0 '>
                    <Card>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-lg flex items-center gap-2'>
                          <FileText className='h-4 w-4 text-indigo-500' />
                          日志查看器
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
        </Panel>
      </PanelGroup>
    </div>
  );
}
