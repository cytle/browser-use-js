/**
 * @file purpose: DOM 处理和元素识别测试组件
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
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Eye, MousePointer, Scan, Zap } from 'lucide-react';
import { useTestState } from '../hooks/useTestState';

interface DOMStats {
  clickableCount: number;
  interactiveCount: number;
  totalElements: number;
}

export function DOMTest() {
  const { addLog } = useTestState();
  const [domStats, setDomStats] = useState<DOMStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [highlightProgress, setHighlightProgress] = useState(0);

  const handleDOMScan = async () => {
    setIsScanning(true);
    addLog('🔍 开始 DOM 处理测试...', 'info');

    try {
      // 模拟扫描过程
      await new Promise(resolve => setTimeout(resolve, 1000));

      const clickableElements = document.querySelectorAll(
        'button, a, input[type="button"], input[type="submit"], [onclick]'
      );
      const interactiveElements = document.querySelectorAll(
        'input, select, textarea'
      );

      const stats: DOMStats = {
        clickableCount: clickableElements.length,
        interactiveCount: interactiveElements.length,
        totalElements: document.querySelectorAll('*').length,
      };

      setDomStats(stats);
      addLog(
        `✅ DOM扫描完成: 可点击元素(${stats.clickableCount}) 交互元素(${stats.interactiveCount}) 总元素(${stats.totalElements})`,
        'success'
      );
    } catch (error) {
      addLog(`❌ DOM处理测试失败: ${error}`, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleElementHighlight = async () => {
    setIsHighlighting(true);
    setHighlightProgress(0);
    addLog('✨ 开始元素高亮测试...', 'info');

    const demoElements = document.querySelectorAll('[data-testid]');

    if (demoElements.length === 0) {
      addLog(
        '⚠️ 未找到测试元素，请确保页面包含 data-testid 属性的元素',
        'warning'
      );
      setIsHighlighting(false);
      return;
    }

    for (let i = 0; i < demoElements.length; i++) {
      // 清除之前的高亮
      demoElements.forEach(el => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.backgroundColor = '';
      });

      const element = demoElements[i] as HTMLElement;
      element.style.outline = '3px solid #667eea';
      element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';

      addLog(
        `🎯 高亮元素: ${element.tagName} [${element.getAttribute('data-testid')}]`,
        'info'
      );

      setHighlightProgress(((i + 1) / demoElements.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 清除所有高亮
    setTimeout(() => {
      demoElements.forEach(el => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.backgroundColor = '';
      });
    }, 2000);

    addLog('✅ 元素高亮测试完成', 'success');
    setIsHighlighting(false);
    setHighlightProgress(0);
  };

  return (
    <div className='grid gap-6 md:grid-cols-2'>
      {/* DOM 扫描 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Scan className='h-5 w-5' />
            DOM 扫描
          </CardTitle>
          <CardDescription>扫描页面中的可交互元素</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            onClick={handleDOMScan}
            disabled={isScanning}
            className='w-full'
          >
            <Eye className='h-4 w-4 mr-2' />
            {isScanning ? '扫描中...' : '开始扫描'}
          </Button>

          {domStats && (
            <div className='space-y-3'>
              <Separator />
              <div className='grid grid-cols-3 gap-2 text-center'>
                <div className='space-y-1'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {domStats.clickableCount}
                  </div>
                  <div className='text-xs text-muted-foreground'>可点击</div>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-bold text-green-600'>
                    {domStats.interactiveCount}
                  </div>
                  <div className='text-xs text-muted-foreground'>可交互</div>
                </div>
                <div className='space-y-1'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {domStats.totalElements}
                  </div>
                  <div className='text-xs text-muted-foreground'>总元素</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 元素高亮 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            元素高亮
          </CardTitle>
          <CardDescription>逐个高亮页面中的测试元素</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            onClick={handleElementHighlight}
            disabled={isHighlighting}
            className='w-full'
          >
            <MousePointer className='h-4 w-4 mr-2' />
            {isHighlighting ? '高亮中...' : '开始高亮'}
          </Button>

          {isHighlighting && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>高亮进度</span>
                <span>{Math.round(highlightProgress)}%</span>
              </div>
              <Progress value={highlightProgress} className='w-full' />
            </div>
          )}

          <Alert>
            <Eye className='h-4 w-4' />
            <AlertDescription>
              此功能会高亮页面中带有 data-testid 属性的元素
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 测试元素示例 */}
      <Card className='md:col-span-2'>
        <CardHeader>
          <CardTitle>测试元素示例</CardTitle>
          <CardDescription>这些元素用于测试 DOM 处理功能</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Button data-testid='demo-button-1' variant='outline'>
              测试按钮 1
            </Button>
            <Button data-testid='demo-button-2' variant='secondary'>
              测试按钮 2
            </Button>
            <Badge data-testid='demo-badge' variant='default'>
              测试标签
            </Badge>
            <div
              data-testid='demo-div'
              className='p-2 border rounded cursor-pointer hover:bg-gray-50'
            >
              测试区域
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
