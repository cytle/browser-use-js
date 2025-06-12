/**
 * @file purpose: AI 代理功能测试组件
 */

import { useState } from 'react';
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
import { Separator } from './ui/separator';
import { Bot, Brain, MessageSquare, Zap, Play, RotateCcw } from 'lucide-react';
import { useTestState } from '../hooks/useTestState';

export function AgentTest() {
  const { addLog } = useTestState();
  const [taskInput, setTaskInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [agentMemory, setAgentMemory] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  const handleAgentTask = async () => {
    if (!taskInput.trim()) {
      addLog('⚠️ 请输入任务描述', 'warning');
      return;
    }

    setIsRunning(true);
    addLog(`🤖 开始执行代理任务: ${taskInput}`, 'info');

    try {
      // 模拟代理任务执行
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模拟任务结果
      const mockResult = {
        success: true,
        steps: ['分析任务需求', '识别页面元素', '执行交互操作', '验证结果'],
        result: '任务执行成功',
      };

      for (const step of mockResult.steps) {
        addLog(`📝 ${step}`, 'info');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addLog(`✅ ${mockResult.result}`, 'success');
    } catch (error) {
      addLog(`❌ 代理任务执行失败: ${error}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleMemoryTest = async () => {
    addLog('🧠 开始代理记忆测试...', 'info');

    try {
      // 模拟记忆操作
      const mockMemories = [
        '用户偏好: 喜欢简洁的界面',
        '上次操作: 点击了登录按钮',
        '页面状态: 已加载完成',
        '任务历史: 完成了3个测试任务',
      ];

      setAgentMemory(mockMemories);
      addLog(
        `✅ 记忆测试完成，共加载 ${mockMemories.length} 条记忆`,
        'success'
      );
    } catch (error) {
      addLog(`❌ 记忆测试失败: ${error}`, 'error');
    }
  };

  const handleListActions = () => {
    addLog('📋 获取可用动作列表...', 'info');

    const mockActions = [
      'click(element) - 点击元素',
      'type(text, element) - 输入文本',
      'scroll(direction) - 滚动页面',
      'wait(seconds) - 等待指定时间',
      'screenshot() - 截取屏幕',
      'navigate(url) - 导航到URL',
    ];

    setAvailableActions(mockActions);
    addLog(`✅ 找到 ${mockActions.length} 个可用动作`, 'success');
  };

  const clearMemory = () => {
    setAgentMemory([]);
    addLog('🗑️ 已清空代理记忆', 'info');
  };

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* 任务执行 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bot className='h-5 w-5' />
            AI 代理任务
          </CardTitle>
          <CardDescription>输入任务描述，让 AI 代理自动执行</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>任务描述</label>
            <Textarea
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              placeholder="例如：在页面中找到搜索框并输入'hello world'"
              rows={3}
            />
          </div>

          <Button
            onClick={handleAgentTask}
            disabled={isRunning || !taskInput.trim()}
            className='w-full'
          >
            <Play className='h-4 w-4 mr-2' />
            {isRunning ? '执行中...' : '开始执行'}
          </Button>

          {isRunning && (
            <Alert>
              <Zap className='h-4 w-4' />
              <AlertDescription>
                AI 代理正在分析任务并执行相应操作...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 代理记忆 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Brain className='h-5 w-5' />
            代理记忆
          </CardTitle>
          <CardDescription>查看和管理 AI 代理的记忆系统</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Button
              onClick={handleMemoryTest}
              variant='outline'
              className='flex-1'
            >
              <Brain className='h-4 w-4 mr-2' />
              测试记忆
            </Button>
            <Button onClick={clearMemory} variant='outline' size='icon'>
              <RotateCcw className='h-4 w-4' />
            </Button>
          </div>

          {agentMemory.length > 0 && (
            <div className='space-y-2'>
              <Separator />
              <div className='space-y-2 max-h-40 overflow-y-auto'>
                {agentMemory.map((memory, index) => (
                  <div key={index} className='text-sm p-2 bg-muted rounded'>
                    {memory}
                  </div>
                ))}
              </div>
              <Badge variant='secondary'>{agentMemory.length} 条记忆</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 可用动作 */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            可用动作
          </CardTitle>
          <CardDescription>AI 代理可以执行的操作列表</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button onClick={handleListActions} variant='outline'>
            <MessageSquare className='h-4 w-4 mr-2' />
            获取动作列表
          </Button>

          {availableActions.length > 0 && (
            <div className='space-y-2'>
              <Separator />
              <div className='grid gap-2'>
                {availableActions.map((action, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 p-2 border rounded'
                  >
                    <Badge variant='outline'>{index + 1}</Badge>
                    <code className='text-sm'>{action}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
