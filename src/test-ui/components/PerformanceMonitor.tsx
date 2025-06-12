/**
 * @file purpose: 性能监控和系统资源监测组件
 */

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  Play,
  Square,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useTestState } from '../hooks/useTestState';

interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  loadTime: number;
  fps: number;
  timestamp: number;
}

export function PerformanceMonitor() {
  const { addLog, performanceMonitoring, setPerformanceMonitoring } =
    useTestState();
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] =
    useState<PerformanceMetrics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // 计算 FPS
  const calculateFPS = () => {
    frameCountRef.current++;
    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      return fps;
    }

    return 0;
  };

  // 获取性能指标
  const getPerformanceMetrics = (): PerformanceMetrics => {
    const memory = (performance as any).memory;
    const memoryUsage = memory
      ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      : 0;

    // 模拟 CPU 使用率（实际浏览器中无法直接获取）
    const cpuUsage = Math.random() * 30 + 10; // 10-40% 的模拟值

    const loadTime = performance.now();
    const fps = calculateFPS() || 60; // 默认 60 FPS

    return {
      memoryUsage: Math.round(memoryUsage),
      cpuUsage: Math.round(cpuUsage),
      loadTime: Math.round(loadTime),
      fps,
      timestamp: Date.now(),
    };
  };

  // 开始监控
  const startMonitoring = () => {
    setPerformanceMonitoring(true);
    addLog('📊 开始性能监控...', 'info');

    intervalRef.current = setInterval(() => {
      const newMetrics = getPerformanceMetrics();
      setCurrentMetrics(newMetrics);
      setMetrics(prev => [...prev.slice(-19), newMetrics]); // 保留最近 20 个数据点
    }, 1000);
  };

  // 停止监控
  const stopMonitoring = () => {
    setPerformanceMonitoring(false);
    addLog('⏹️ 停止性能监控', 'info');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 清除数据
  const clearMetrics = () => {
    setMetrics([]);
    setCurrentMetrics(null);
    addLog('🗑️ 已清除性能数据', 'info');
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 计算平均值
  const getAverageMetrics = () => {
    if (metrics.length === 0) return null;

    const avg = metrics.reduce(
      (acc, metric) => ({
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        cpuUsage: acc.cpuUsage + metric.cpuUsage,
        fps: acc.fps + metric.fps,
      }),
      { memoryUsage: 0, cpuUsage: 0, fps: 0 }
    );

    return {
      memoryUsage: Math.round(avg.memoryUsage / metrics.length),
      cpuUsage: Math.round(avg.cpuUsage / metrics.length),
      fps: Math.round(avg.fps / metrics.length),
    };
  };

  const averageMetrics = getAverageMetrics();

  return (
    <div className='space-y-6'>
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            性能监控
          </CardTitle>
          <CardDescription>实时监控系统性能指标</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            {!performanceMonitoring ? (
              <Button onClick={startMonitoring} className='flex-1'>
                <Play className='h-4 w-4 mr-2' />
                开始监控
              </Button>
            ) : (
              <Button
                onClick={stopMonitoring}
                variant='destructive'
                className='flex-1'
              >
                <Square className='h-4 w-4 mr-2' />
                停止监控
              </Button>
            )}
            <Button onClick={clearMetrics} variant='outline'>
              清除数据
            </Button>
          </div>

          {performanceMonitoring && (
            <Badge variant='default' className='flex items-center gap-2'>
              <Activity className='h-3 w-3' />
              监控中...
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* 实时指标 */}
      {currentMetrics && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <HardDrive className='h-4 w-4 text-blue-500' />
                <span className='text-sm font-medium'>内存使用</span>
              </div>
              <div className='space-y-2'>
                <div className='text-2xl font-bold'>
                  {currentMetrics.memoryUsage}%
                </div>
                <Progress value={currentMetrics.memoryUsage} className='h-2' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Cpu className='h-4 w-4 text-green-500' />
                <span className='text-sm font-medium'>CPU 使用</span>
              </div>
              <div className='space-y-2'>
                <div className='text-2xl font-bold'>
                  {currentMetrics.cpuUsage}%
                </div>
                <Progress value={currentMetrics.cpuUsage} className='h-2' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Zap className='h-4 w-4 text-yellow-500' />
                <span className='text-sm font-medium'>帧率</span>
              </div>
              <div className='space-y-2'>
                <div className='text-2xl font-bold'>
                  {currentMetrics.fps} FPS
                </div>
                <Progress
                  value={(currentMetrics.fps / 60) * 100}
                  className='h-2'
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2 mb-2'>
                <Clock className='h-4 w-4 text-purple-500' />
                <span className='text-sm font-medium'>运行时间</span>
              </div>
              <div className='space-y-2'>
                <div className='text-2xl font-bold'>
                  {Math.round(currentMetrics.loadTime / 1000)}s
                </div>
                <div className='text-xs text-muted-foreground'>自页面加载</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 平均指标 */}
      {averageMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5' />
              平均性能指标
            </CardTitle>
            <CardDescription>
              基于 {metrics.length} 个数据点的平均值
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='text-center space-y-2'>
                <div className='text-sm text-muted-foreground'>
                  平均内存使用
                </div>
                <div className='text-3xl font-bold text-blue-600'>
                  {averageMetrics.memoryUsage}%
                </div>
              </div>
              <div className='text-center space-y-2'>
                <div className='text-sm text-muted-foreground'>
                  平均 CPU 使用
                </div>
                <div className='text-3xl font-bold text-green-600'>
                  {averageMetrics.cpuUsage}%
                </div>
              </div>
              <div className='text-center space-y-2'>
                <div className='text-sm text-muted-foreground'>平均帧率</div>
                <div className='text-3xl font-bold text-yellow-600'>
                  {averageMetrics.fps} FPS
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 性能历史 */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>性能历史</CardTitle>
            <CardDescription>最近 {metrics.length} 个数据点</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* 简单的文本图表 */}
              <div className='space-y-2'>
                <div className='text-sm font-medium'>内存使用趋势</div>
                <div className='flex items-end gap-1 h-16'>
                  {metrics.slice(-20).map((metric, index) => (
                    <div
                      key={index}
                      className='bg-blue-500 rounded-t'
                      style={{
                        height: `${(metric.memoryUsage / 100) * 100}%`,
                        width: '4px',
                        minHeight: '2px',
                      }}
                      title={`${metric.memoryUsage}%`}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className='space-y-2'>
                <div className='text-sm font-medium'>CPU 使用趋势</div>
                <div className='flex items-end gap-1 h-16'>
                  {metrics.slice(-20).map((metric, index) => (
                    <div
                      key={index}
                      className='bg-green-500 rounded-t'
                      style={{
                        height: `${(metric.cpuUsage / 100) * 100}%`,
                        width: '4px',
                        minHeight: '2px',
                      }}
                      title={`${metric.cpuUsage}%`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
