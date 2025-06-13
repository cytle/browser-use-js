/**
 * @file purpose: 系统初始化和配置测试组件
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { CheckCircle, XCircle, Clock, Settings, Play } from 'lucide-react';
import { useTestState } from '../hooks/useTestState';
import { initialize } from '../../main';
import type { BrowserUseConfig } from '../../main';

interface StatusIndicatorProps {
  status: 'success' | 'error' | 'pending' | 'idle';
  message: string;
}

function StatusIndicator({ status, message }: StatusIndicatorProps) {
  const icons = {
    success: <CheckCircle className='h-4 w-4 text-green-500' />,
    error: <XCircle className='h-4 w-4 text-red-500' />,
    pending: <Clock className='h-4 w-4 text-yellow-500 animate-spin' />,
    idle: <Settings className='h-4 w-4 text-gray-400' />,
  };

  const variants = {
    success: 'default',
    error: 'destructive',
    pending: 'secondary',
    idle: 'outline',
  } as const;

  return (
    <Badge variant={variants[status]} className='flex items-center gap-2'>
      {icons[status]}
      {message}
    </Badge>
  );
}

export function SystemTest() {
  const { addLog, setInitialized } = useTestState();
  const [initStatus, setInitStatus] = useState<
    'success' | 'error' | 'pending' | 'idle'
  >('idle');
  const [debugMode, setDebugMode] = useState('false');
  const [timeout, setTimeout] = useState('30000');
  const [isLoading, setIsLoading] = useState(false);

  const handleInitialization = async () => {
    setIsLoading(true);
    setInitStatus('pending');
    addLog('开始系统初始化测试...', 'info');

    try {
      const config: BrowserUseConfig = {
        debug: debugMode === 'true',
        timeout: parseInt(timeout),
      };

      const result = await initialize(config);

      if (result.success) {
        setInitialized(true);
        setInitStatus('success');
        addLog('✅ 系统初始化成功', 'success');
      } else {
        setInitStatus('error');
        addLog(`❌ 系统初始化失败: ${result.error?.message}`, 'error');
      }
    } catch (error) {
      setInitStatus('error');
      addLog(`💥 初始化过程中发生异常: ${error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* 系统配置 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            系统配置
          </CardTitle>
          <CardDescription>配置 Browser-Use JS 的运行参数</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>调试模式</label>
            <Select value={debugMode} onValueChange={setDebugMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='false'>关闭</SelectItem>
                <SelectItem value='true'>开启</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>超时时间 (毫秒)</label>
            <Input
              type='number'
              value={timeout}
              onChange={e => setTimeout(e.target.value)}
              placeholder='30000'
            />
          </div>

          <Separator />

          <Button
            onClick={handleInitialization}
            disabled={isLoading}
            className='w-full'
          >
            <Play className='h-4 w-4 mr-2' />
            {isLoading ? '初始化中...' : '开始初始化'}
          </Button>
        </CardContent>
      </Card>

      {/* 系统状态 */}
      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
          <CardDescription>查看当前系统的运行状态</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>初始化状态</span>
              <StatusIndicator
                status={initStatus}
                message={
                  initStatus === 'success'
                    ? '初始化成功'
                    : initStatus === 'error'
                      ? '初始化失败'
                      : initStatus === 'pending'
                        ? '正在初始化...'
                        : '未初始化'
                }
              />
            </div>

            <Separator />

            <div className='space-y-2'>
              <span className='text-sm font-medium'>当前配置</span>
              <div className='text-sm text-muted-foreground space-y-1'>
                <div>调试模式: {debugMode === 'true' ? '开启' : '关闭'}</div>
                <div>超时时间: {timeout}ms</div>
              </div>
            </div>
          </div>

          {initStatus === 'error' && (
            <Alert variant='destructive'>
              <XCircle className='h-4 w-4' />
              <AlertDescription>
                系统初始化失败，请检查配置并重试
              </AlertDescription>
            </Alert>
          )}

          {initStatus === 'success' && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>
                系统已成功初始化，可以开始测试其他功能
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
