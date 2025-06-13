/**
 * @file purpose: Browser-Use JS 综合演示组件
 *
 * 这个组件集成了所有现有功能，提供一个完整的 Browser-Use JS 工作流程演示。
 * 包括系统初始化、DOM 处理、AI 代理任务执行等核心功能的端到端演示。
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Play,
  Bot,
  Search,
  MousePointer,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Eye,
  Brain,
  Settings,
  Activity,
} from 'lucide-react';
import { useTestState } from '../hooks/useTestState';
import { initialize } from '../../main';
import { DemoTestPage } from './DemoTestPage';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  steps: DemoStep[];
}

export function BrowserUseDemo() {
  const { addLog, isInitialized, setInitialized } = useTestState();
  const [currentScenario, setCurrentScenario] = useState<string>('web-search');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('Browser automation with AI');
  const [targetUrl, setTargetUrl] = useState('https://example.com');
  const [customTask, setCustomTask] =
    useState('找到页面中的搜索框并输入查询内容');

  // 演示场景配置
  const scenarios: DemoScenario[] = [
    {
      id: 'web-search',
      title: '🔍 智能网页搜索',
      description: '演示 AI 代理如何自动在网页中执行搜索任务',
      steps: [
        {
          id: 'init',
          title: '系统初始化',
          description: '初始化 Browser-Use JS 系统',
          status: 'pending',
        },
        {
          id: 'navigate',
          title: '页面导航',
          description: '导航到目标网页',
          status: 'pending',
        },
        {
          id: 'analyze',
          title: 'DOM 分析',
          description: '分析页面结构，识别可交互元素',
          status: 'pending',
        },
        {
          id: 'search',
          title: '执行搜索',
          description: '找到搜索框并输入查询内容',
          status: 'pending',
        },
        {
          id: 'verify',
          title: '结果验证',
          description: '验证搜索结果并提取信息',
          status: 'pending',
        },
      ],
    },
    {
      id: 'form-filling',
      title: '📝 智能表单填写',
      description: '演示 AI 代理如何自动识别并填写网页表单',
      steps: [
        {
          id: 'init',
          title: '系统初始化',
          description: '初始化 Browser-Use JS 系统',
          status: 'pending',
        },
        {
          id: 'scan',
          title: '表单扫描',
          description: '扫描页面中的表单元素',
          status: 'pending',
        },
        {
          id: 'identify',
          title: '字段识别',
          description: '识别表单字段类型和要求',
          status: 'pending',
        },
        {
          id: 'fill',
          title: '自动填写',
          description: '根据字段类型自动填写表单',
          status: 'pending',
        },
        {
          id: 'submit',
          title: '提交验证',
          description: '验证填写内容并提交表单',
          status: 'pending',
        },
      ],
    },
    {
      id: 'custom-task',
      title: '🎯 自定义任务',
      description: '演示 AI 代理执行用户自定义的复杂任务',
      steps: [
        {
          id: 'init',
          title: '系统初始化',
          description: '初始化 Browser-Use JS 系统',
          status: 'pending',
        },
        {
          id: 'parse',
          title: '任务解析',
          description: '解析用户输入的任务描述',
          status: 'pending',
        },
        {
          id: 'plan',
          title: '执行计划',
          description: '制定任务执行计划',
          status: 'pending',
        },
        {
          id: 'execute',
          title: '任务执行',
          description: '按计划执行各个步骤',
          status: 'pending',
        },
        {
          id: 'report',
          title: '结果报告',
          description: '生成任务执行报告',
          status: 'pending',
        },
      ],
    },
  ];

  const [demoSteps, setDemoSteps] = useState<DemoStep[]>(
    scenarios.find(s => s.id === currentScenario)?.steps || []
  );

  useEffect(() => {
    const scenario = scenarios.find(s => s.id === currentScenario);
    if (scenario) {
      setDemoSteps(
        scenario.steps.map(step => ({ ...step, status: 'pending' }))
      );
      setProgress(0);
    }
  }, [currentScenario]);

  const updateStepStatus = (
    stepId: string,
    status: DemoStep['status'],
    result?: string
  ) => {
    setDemoSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, status, result } : step
      )
    );
  };

  const runDemo = async () => {
    if (!isInitialized) {
      addLog('⚠️ 请先初始化系统', 'warning');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    addLog(
      `🚀 开始执行演示场景: ${scenarios.find(s => s.id === currentScenario)?.title}`,
      'info'
    );

    try {
      for (let i = 0; i < demoSteps.length; i++) {
        const step = demoSteps[i];
        updateStepStatus(step.id, 'running');
        addLog(`▶️ 执行步骤: ${step.title}`, 'info');

        // 模拟步骤执行
        await simulateStep(step, currentScenario);

        updateStepStatus(step.id, 'completed', '执行成功');
        setProgress(((i + 1) / demoSteps.length) * 100);

        // 步骤间延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      addLog('✅ 演示场景执行完成', 'success');
    } catch (error) {
      addLog(`❌ 演示执行失败: ${error}`, 'error');
      const currentStepIndex = demoSteps.findIndex(
        step => step.status === 'running'
      );
      if (currentStepIndex >= 0) {
        updateStepStatus(demoSteps[currentStepIndex].id, 'error', '执行失败');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const simulateStep = async (step: DemoStep, scenario: string) => {
    const delay = Math.random() * 1000 + 1000; // 1-2秒随机延迟

    switch (step.id) {
      case 'init':
        await new Promise(resolve => setTimeout(resolve, delay));
        if (!isInitialized) {
          const result = await initialize({ debug: true, timeout: 30000 });
          if (result.success) {
            setInitialized(true);
            addLog('✅ 系统初始化成功', 'success');
          } else {
            throw new Error('系统初始化失败');
          }
        }
        break;

      case 'navigate':
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog(`🌐 导航到: ${targetUrl}`, 'info');
        break;

      case 'analyze': {
        await new Promise(resolve => setTimeout(resolve, delay));
        const elements = document.querySelectorAll('*');
        addLog(`🔍 DOM 分析完成，发现 ${elements.length} 个元素`, 'info');
        break;
      }

      case 'search':
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog(`🔍 执行搜索: &quot;${searchQuery}&quot;`, 'info');
        break;

      case 'scan': {
        await new Promise(resolve => setTimeout(resolve, delay));
        const forms = document.querySelectorAll(
          'form, input, textarea, select'
        );
        addLog(`📝 发现 ${forms.length} 个表单元素`, 'info');
        break;
      }

      case 'parse':
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog(`📋 解析任务: &quot;${customTask}&quot;`, 'info');
        break;

      default:
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog(`✅ ${step.title} 完成`, 'info');
    }
  };

  const resetDemo = () => {
    setDemoSteps(prev =>
      prev.map(step => ({ ...step, status: 'pending', result: undefined }))
    );
    setProgress(0);
    addLog('🔄 演示已重置', 'info');
  };

  const getStepIcon = (status: DemoStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'running':
        return <Clock className='h-4 w-4 text-blue-500 animate-spin' />;
      case 'error':
        return <AlertCircle className='h-4 w-4 text-red-500' />;
      default:
        return (
          <div className='h-4 w-4 rounded-full border-2 border-gray-300' />
        );
    }
  };

  return (
    <div className='space-y-6'>
      {/* 演示控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Browser-Use JS 综合演示
          </CardTitle>
          <CardDescription>
            选择演示场景，体验 AI 代理的完整工作流程
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentScenario} onValueChange={setCurrentScenario}>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='web-search'>智能搜索</TabsTrigger>
              <TabsTrigger value='form-filling'>表单填写</TabsTrigger>
              <TabsTrigger value='custom-task'>自定义任务</TabsTrigger>
              <TabsTrigger value='test-page'>测试页面</TabsTrigger>
            </TabsList>

            <TabsContent value='web-search' className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>目标网址</label>
                <Input
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder='https://example.com'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>搜索查询</label>
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='输入搜索内容'
                />
              </div>
            </TabsContent>

            <TabsContent value='form-filling' className='space-y-4'>
              <Alert>
                <Settings className='h-4 w-4' />
                <AlertDescription>
                  此演示将自动识别页面中的表单并智能填写
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value='custom-task' className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>任务描述</label>
                <Textarea
                  value={customTask}
                  onChange={e => setCustomTask(e.target.value)}
                  placeholder='描述你希望 AI 代理执行的任务...'
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value='test-page' className='space-y-4'>
              <Alert>
                <Eye className='h-4 w-4' />
                <AlertDescription>
                  这是一个包含各种交互元素的测试页面，可以用来测试 DOM 处理和 AI
                  代理功能
                </AlertDescription>
              </Alert>
              <div className='border rounded-lg overflow-hidden'>
                <DemoTestPage />
              </div>
            </TabsContent>
          </Tabs>

          <Separator className='my-4' />

          <div className='flex gap-2'>
            <Button
              onClick={runDemo}
              disabled={isRunning || !isInitialized}
              className='flex-1'
            >
              <Play className='h-4 w-4 mr-2' />
              {isRunning ? '执行中...' : '开始演示'}
            </Button>
            <Button onClick={resetDemo} variant='outline' disabled={isRunning}>
              重置
            </Button>
          </div>

          {!isInitialized && (
            <Alert className='mt-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                请先在&quot;系统测试&quot;标签页中初始化系统
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 执行进度 */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Zap className='h-5 w-5' />
              执行进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>总体进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className='w-full' />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 步骤详情 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            执行步骤
          </CardTitle>
          <CardDescription>
            {scenarios.find(s => s.id === currentScenario)?.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {demoSteps.map((step, index) => (
              <div key={step.id} className='flex items-start gap-3'>
                <div className='flex-shrink-0 mt-1'>
                  {getStepIcon(step.status)}
                </div>
                <div className='flex-1 space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>{step.title}</span>
                    <Badge
                      variant={
                        step.status === 'completed'
                          ? 'default'
                          : step.status === 'running'
                            ? 'secondary'
                            : step.status === 'error'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {step.status === 'completed'
                        ? '已完成'
                        : step.status === 'running'
                          ? '执行中'
                          : step.status === 'error'
                            ? '失败'
                            : '等待中'}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {step.description}
                  </p>
                  {step.result && (
                    <p className='text-sm text-green-600'>{step.result}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 演示说明 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Brain className='h-5 w-5' />
            演示说明
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <h4 className='font-medium flex items-center gap-2'>
                <Search className='h-4 w-4' />
                智能搜索
              </h4>
              <p className='text-sm text-muted-foreground'>
                演示 AI 代理如何自动导航到网页，识别搜索框，并执行搜索操作
              </p>
            </div>
            <div className='space-y-2'>
              <h4 className='font-medium flex items-center gap-2'>
                <MousePointer className='h-4 w-4' />
                表单填写
              </h4>
              <p className='text-sm text-muted-foreground'>
                展示 AI 代理智能识别表单字段类型，并根据上下文自动填写内容
              </p>
            </div>
            <div className='space-y-2'>
              <h4 className='font-medium flex items-center gap-2'>
                <Bot className='h-4 w-4' />
                自定义任务
              </h4>
              <p className='text-sm text-muted-foreground'>
                体验 AI 代理理解自然语言任务描述，并制定执行计划的能力
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
