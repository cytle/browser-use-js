/**
 * @file purpose: Browser-Use JS 自定义任务演示组件
 *
 * 这个组件提供一个简化的 Browser-Use JS 自定义任务执行界面。
 * 用户可以输入任务描述，AI 代理将解析并执行相应的操作。
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
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Play,
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Brain,
  RotateCcw,
} from 'lucide-react';
import { useTestState } from '../hooks/useTestState';
import { initialize } from '../../main';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: string;
}

export function BrowserUseDemo() {
  const { addLog, isInitialized, setInitialized } = useTestState();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [customTask, setCustomTask] =
    useState('找到页面中的搜索框并输入查询内容');

  // 自定义任务步骤
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([
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
  ]);

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

    if (!customTask.trim()) {
      addLog('⚠️ 请输入任务描述', 'warning');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    addLog(`🚀 开始执行自定义任务: ${customTask}`, 'info');

    try {
      for (let i = 0; i < demoSteps.length; i++) {
        const step = demoSteps[i];
        updateStepStatus(step.id, 'running');
        addLog(`▶️ 执行步骤: ${step.title}`, 'info');

        // 模拟步骤执行
        await simulateStep(step);

        updateStepStatus(step.id, 'completed', '执行成功');
        setProgress(((i + 1) / demoSteps.length) * 100);

        // 步骤间延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      addLog('✅ 自定义任务执行完成', 'success');
    } catch (error) {
      addLog(`❌ 任务执行失败: ${error}`, 'error');
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

  const simulateStep = async (step: DemoStep) => {
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

      case 'parse':
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog(`📋 解析任务: &quot;${customTask}&quot;`, 'info');
        break;

      case 'plan':
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog('🎯 制定执行计划完成', 'info');
        break;

      case 'execute':
        await new Promise(resolve => setTimeout(resolve, delay * 1.5));
        addLog('⚡ 任务执行中...', 'info');
        break;

      case 'report':
        await new Promise(resolve => setTimeout(resolve, delay));
        addLog('📊 生成执行报告完成', 'info');
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
    addLog('🔄 任务已重置', 'info');
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
      {/* 任务输入面板 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bot className='h-5 w-5' />
            AI 代理自定义任务
          </CardTitle>
          <CardDescription>
            输入任务描述，AI 代理将自动解析并执行相应操作
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>任务描述</label>
            <Textarea
              value={customTask}
              onChange={e => setCustomTask(e.target.value)}
              placeholder='描述你希望 AI 代理执行的任务，例如：
• 找到页面中的搜索框并输入"人工智能"
• 点击页面上的"登录"按钮
• 填写联系表单并提交
• 查找页面中的价格信息并记录'
              rows={4}
              className='resize-none'
            />
          </div>

          <Separator />

          <div className='flex gap-2'>
            <Button
              onClick={runDemo}
              disabled={isRunning || !isInitialized || !customTask.trim()}
              className='flex-1'
            >
              <Play className='h-4 w-4 mr-2' />
              {isRunning ? '执行中...' : '开始执行任务'}
            </Button>
            <Button onClick={resetDemo} variant='outline' disabled={isRunning}>
              <RotateCcw className='h-4 w-4 mr-2' />
              重置
            </Button>
          </div>

          {!isInitialized && (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                请先在&quot;系统测试&quot;标签页中初始化系统
              </AlertDescription>
            </Alert>
          )}

          {!customTask.trim() && isInitialized && (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>请输入任务描述后再开始执行</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 执行进度 */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Brain className='h-5 w-5' />
              执行进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>任务进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className='w-full' />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 执行步骤 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            执行步骤
          </CardTitle>
          <CardDescription>
            AI 代理将按以下步骤执行你的自定义任务
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

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Brain className='h-5 w-5' />
            使用说明
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='text-sm text-muted-foreground space-y-2'>
            <p>
              <strong>1. 任务描述：</strong>用自然语言描述你希望 AI
              代理执行的操作
            </p>
            <p>
              <strong>2. 系统初始化：</strong>
              确保在&quot;系统测试&quot;页面已完成初始化
            </p>
            <p>
              <strong>3. 执行监控：</strong>观察执行步骤和进度，查看详细日志
            </p>
            <p>
              <strong>4. 结果验证：</strong>任务完成后检查执行结果和生成的报告
            </p>
          </div>

          <Separator />

          <div className='text-sm'>
            <p className='font-medium mb-2'>示例任务：</p>
            <ul className='space-y-1 text-muted-foreground'>
              <li>• 在当前页面查找所有链接并统计数量</li>
              <li>• 识别页面中的表单元素并分析其类型</li>
              <li>• 查找页面标题并提取关键信息</li>
              <li>• 模拟用户点击特定按钮或链接</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
