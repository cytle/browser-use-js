/**
 * @file purpose: 日志查看和管理组件
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useTestState, type LogEntry } from '../hooks/useTestState';

interface LogViewerProps {
  logs: LogEntry[];
}

export function LogViewer({ logs }: LogViewerProps) {
  const { clearLogs } = useTestState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // 导出日志
  const handleExportLogs = () => {
    const logText = filteredLogs
      .map(
        log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `browser-use-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 获取日志类型图标
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
      default:
        return <Info className='h-4 w-4 text-blue-500' />;
    }
  };

  // 获取日志类型统计
  const logStats = logs.reduce(
    (acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className='space-y-6'>
      {/* 日志统计 */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {logs.length}
            </div>
            <div className='text-sm text-muted-foreground'>总日志</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {logStats.success || 0}
            </div>
            <div className='text-sm text-muted-foreground'>成功</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-red-600'>
              {logStats.error || 0}
            </div>
            <div className='text-sm text-muted-foreground'>错误</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-yellow-600'>
              {logStats.warning || 0}
            </div>
            <div className='text-sm text-muted-foreground'>警告</div>
          </CardContent>
        </Card>
      </div>

      {/* 日志控制 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            日志查看器
          </CardTitle>
          <CardDescription>查看、搜索和管理系统日志</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 搜索和过滤 */}
          <div className='flex gap-2'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='搜索日志...'
                className='pl-10'
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='w-32'>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>全部</SelectItem>
                <SelectItem value='info'>信息</SelectItem>
                <SelectItem value='success'>成功</SelectItem>
                <SelectItem value='warning'>警告</SelectItem>
                <SelectItem value='error'>错误</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 操作按钮 */}
          <div className='flex gap-2'>
            <Button onClick={handleExportLogs} variant='outline' size='sm'>
              <Download className='h-4 w-4 mr-2' />
              导出日志
            </Button>
            <Button onClick={clearLogs} variant='outline' size='sm'>
              <Trash2 className='h-4 w-4 mr-2' />
              清空日志
            </Button>
            <Button
              onClick={() => setAutoScroll(!autoScroll)}
              variant={autoScroll ? 'default' : 'outline'}
              size='sm'
            >
              自动滚动
            </Button>
          </div>

          <Separator />

          {/* 日志列表 */}
          <ScrollArea
            className='h-96 w-full border rounded-md p-4'
            ref={scrollAreaRef}
          >
            {filteredLogs.length === 0 ? (
              <div className='text-center text-muted-foreground py-8'>
                {logs.length === 0 ? '暂无日志' : '没有匹配的日志'}
              </div>
            ) : (
              <div className='space-y-2'>
                {filteredLogs.map(log => (
                  <div
                    key={log.id}
                    className='flex items-start gap-3 p-2 rounded hover:bg-muted/50'
                  >
                    {getLogIcon(log.type)}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <Badge variant='outline' className='text-xs'>
                          {log.timestamp}
                        </Badge>
                        <Badge
                          variant={
                            log.type === 'success'
                              ? 'default'
                              : log.type === 'error'
                                ? 'destructive'
                                : log.type === 'warning'
                                  ? 'secondary'
                                  : 'outline'
                          }
                          className='text-xs'
                        >
                          {log.type}
                        </Badge>
                      </div>
                      <div className='text-sm break-words'>{log.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {filteredLogs.length > 0 && (
            <div className='text-sm text-muted-foreground text-center'>
              显示 {filteredLogs.length} / {logs.length} 条日志
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
