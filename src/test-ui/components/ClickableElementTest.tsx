/**
 * @file purpose: 可点击元素处理器测试组件 - 增强版
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';

import {
  MousePointer,
  Eye,
  Target,
  Zap,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  Layers,
  Play,
  Pause,
  Settings,
  Download,
  Filter,
} from 'lucide-react';

import { ClickableElementProcessor } from '../../dom/clickable_element_processor';
import type { ClickableElementInfo } from '../../types';

interface TestStats {
  totalElements: number;
  clickableElements: number;
  visibleElements: number;
  enabledElements: number;
  processingTime: number;
  cacheHits: number;
  frameworks: Record<string, number>;
  lastScanTime: Date;
  scanCount: number;
}

interface HighlightOverlay {
  element: ClickableElementInfo;
  color: string;
  visible: boolean;
}

interface FilterOptions {
  showHidden: boolean;
  showDisabled: boolean;
  minConfidence: number;
  tagFilter: string;
  frameworkFilter: string;
}

export function ClickableElementTest() {
  const [processor, setProcessor] = useState<ClickableElementProcessor | null>(
    null
  );
  const [clickableElements, setClickableElements] = useState<
    ClickableElementInfo[]
  >([]);
  const [filteredElements, setFilteredElements] = useState<
    ClickableElementInfo[]
  >([]);
  const [selectedElement, setSelectedElement] =
    useState<ClickableElementInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRealTimeMode, setIsRealTimeMode] = useState(false);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [highlightOverlays, setHighlightOverlays] = useState<
    HighlightOverlay[]
  >([]);
  const [showOverlays, setShowOverlays] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('scan');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showHidden: false,
    showDisabled: false,
    minConfidence: 0,
    tagFilter: '',
    frameworkFilter: '',
  });

  const overlayContainerRef = useRef<HTMLDivElement>(null);
  const scanProgressRef = useRef<number>(0);
  const realTimeScanInterval = useRef<NodeJS.Timeout | null>(null);

  // 初始化处理器
  useEffect(() => {
    try {
      const processorInstance = new ClickableElementProcessor({
        includeHidden: false,
        minClickableArea: 16,
        enableDeepScan: true,
        performanceMode: false,
        frameworkDetection: true,
      });
      setProcessor(processorInstance);
    } catch (err) {
      setError(
        `初始化处理器失败: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    return () => {
      if (processor) {
        processor.dispose();
      }
      if (realTimeScanInterval.current) {
        clearInterval(realTimeScanInterval.current);
      }
    };
  }, []);

  // 应用过滤器
  useEffect(() => {
    let filtered = clickableElements;

    if (!filterOptions.showHidden) {
      filtered = filtered.filter(el => el.visible);
    }

    if (!filterOptions.showDisabled) {
      filtered = filtered.filter(el => el.enabled);
    }

    if (filterOptions.minConfidence > 0) {
      filtered = filtered.filter(
        el => el.analysis.confidence >= filterOptions.minConfidence / 100
      );
    }

    if (filterOptions.tagFilter) {
      filtered = filtered.filter(el =>
        el.tagName.toLowerCase().includes(filterOptions.tagFilter.toLowerCase())
      );
    }

    if (filterOptions.frameworkFilter) {
      filtered = filtered.filter(el =>
        el.framework
          ?.toLowerCase()
          .includes(filterOptions.frameworkFilter.toLowerCase())
      );
    }

    setFilteredElements(filtered);
  }, [clickableElements, filterOptions]);

  // 扫描可点击元素
  const scanClickableElements = useCallback(async () => {
    if (!processor) return;

    setIsScanning(true);
    setError(null);
    scanProgressRef.current = 0;

    try {
      const startTime = performance.now();

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        scanProgressRef.current = Math.min(scanProgressRef.current + 10, 90);
      }, 100);

      // 执行扫描
      const elements = processor.findClickableElements();
      const endTime = performance.now();

      clearInterval(progressInterval);
      scanProgressRef.current = 100;

      // 计算统计信息
      const frameworks: Record<string, number> = {};
      elements.forEach(el => {
        if (el.framework) {
          frameworks[el.framework] = (frameworks[el.framework] || 0) + 1;
        }
      });

      const cacheStats = processor.getCacheStats();

      const testStats: TestStats = {
        totalElements: document.querySelectorAll('*').length,
        clickableElements: elements.length,
        visibleElements: elements.filter(el => el.visible).length,
        enabledElements: elements.filter(el => el.enabled).length,
        processingTime: endTime - startTime,
        cacheHits: cacheStats.cacheSize,
        frameworks,
        lastScanTime: new Date(),
        scanCount: (stats?.scanCount || 0) + 1,
      };

      setClickableElements(elements);
      setStats(testStats);

      // 创建高亮覆盖层
      const overlays: HighlightOverlay[] = elements.map(element => ({
        element,
        color: getElementColor(element),
        visible: true,
      }));
      setHighlightOverlays(overlays);
    } catch (err) {
      setError(`扫描失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsScanning(false);
    }
  }, [processor, stats?.scanCount]);

  // 切换实时扫描模式
  const toggleRealTimeMode = () => {
    if (isRealTimeMode) {
      if (realTimeScanInterval.current) {
        clearInterval(realTimeScanInterval.current);
        realTimeScanInterval.current = null;
      }
      setIsRealTimeMode(false);
    } else {
      realTimeScanInterval.current = setInterval(() => {
        if (!isScanning) {
          scanClickableElements();
        }
      }, 2000); // 每2秒扫描一次
      setIsRealTimeMode(true);
    }
  };

  // 测试元素交互
  const testElementInteraction = async (element: ClickableElementInfo) => {
    try {
      const domElement = element.element as HTMLElement;

      // 滚动到元素
      domElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 高亮元素
      const originalStyle = domElement.style.cssText;
      domElement.style.cssText +=
        '; outline: 3px solid #3b82f6; outline-offset: 2px;';

      // 模拟点击测试
      setTimeout(() => {
        domElement.style.cssText = originalStyle;
      }, 2000);

      // 记录交互测试
      console.log('测试元素交互:', {
        element: element.tagName,
        selector: element.selector,
        capabilities: element.capabilities,
        position: element.position,
      });
    } catch (err) {
      console.error('元素交互测试失败:', err);
    }
  };

  // 导出扫描结果
  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      stats,
      elements: clickableElements.map(el => ({
        tagName: el.tagName,
        selector: el.selector,
        textContent: el.textContent,
        interactionType: el.interactionType,
        capabilities: el.capabilities,
        confidence: el.analysis.confidence,
        visible: el.visible,
        enabled: el.enabled,
        framework: el.framework,
        position: el.position,
        clickableArea: el.clickableArea,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clickable-elements-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 获取元素颜色
  const getElementColor = (element: ClickableElementInfo): string => {
    if (!element.visible) return '#6b7280'; // gray-500
    if (!element.enabled) return '#f59e0b'; // amber-500
    if (element.analysis.confidence > 0.8) return '#10b981'; // emerald-500
    if (element.analysis.confidence > 0.6) return '#3b82f6'; // blue-500
    return '#f97316'; // orange-500
  };

  // 切换覆盖层显示
  const toggleOverlays = () => {
    setShowOverlays(!showOverlays);
  };

  // 选择元素
  const selectElement = (element: ClickableElementInfo) => {
    setSelectedElement(element);

    // 滚动到元素位置
    element.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // 高亮选中的元素
    setHighlightOverlays(prev =>
      prev.map(overlay => ({
        ...overlay,
        visible: overlay.element === element,
      }))
    );
  };

  // 清除选择
  const clearSelection = () => {
    setSelectedElement(null);
    setHighlightOverlays(prev =>
      prev.map(overlay => ({
        ...overlay,
        visible: showOverlays,
      }))
    );
  };

  // 渲染置信度徽章
  const renderConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge variant='default' className='bg-green-500'>
          高 ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    } else if (confidence >= 0.6) {
      return (
        <Badge variant='default' className='bg-blue-500'>
          中 ({(confidence * 100).toFixed(0)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant='secondary'>低 ({(confidence * 100).toFixed(0)}%)</Badge>
      );
    }
  };

  // 渲染过滤器控制
  const renderFilterControls = () => (
    <Card className='mb-4'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm flex items-center gap-2'>
          <Filter className='w-4 h-4' />
          过滤选项
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0 space-y-3'>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={filterOptions.showHidden ? 'default' : 'outline'}
            size='sm'
            onClick={() =>
              setFilterOptions(prev => ({
                ...prev,
                showHidden: !prev.showHidden,
              }))
            }
          >
            <Eye className='w-3 h-3 mr-1' />
            显示隐藏
          </Button>
          <Button
            variant={filterOptions.showDisabled ? 'default' : 'outline'}
            size='sm'
            onClick={() =>
              setFilterOptions(prev => ({
                ...prev,
                showDisabled: !prev.showDisabled,
              }))
            }
          >
            <XCircle className='w-3 h-3 mr-1' />
            显示禁用
          </Button>
        </div>

        <div className='space-y-2'>
          <div>
            <label
              htmlFor='confidence-slider'
              className='text-xs text-gray-600'
            >
              最小置信度: {filterOptions.minConfidence}%
            </label>
            <input
              id='confidence-slider'
              type='range'
              min='0'
              max='100'
              value={filterOptions.minConfidence}
              onChange={e =>
                setFilterOptions(prev => ({
                  ...prev,
                  minConfidence: parseInt(e.target.value),
                }))
              }
              className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer'
            />
          </div>

          <div className='grid grid-cols-2 gap-2'>
            <input
              type='text'
              placeholder='标签过滤...'
              value={filterOptions.tagFilter}
              onChange={e =>
                setFilterOptions(prev => ({
                  ...prev,
                  tagFilter: e.target.value,
                }))
              }
              className='px-2 py-1 text-xs border rounded'
              aria-label='标签过滤器'
            />
            <input
              type='text'
              placeholder='框架过滤...'
              value={filterOptions.frameworkFilter}
              onChange={e =>
                setFilterOptions(prev => ({
                  ...prev,
                  frameworkFilter: e.target.value,
                }))
              }
              className='px-2 py-1 text-xs border rounded'
              aria-label='框架过滤器'
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 渲染元素列表
  const renderElementList = () => (
    <ScrollArea className='h-96'>
      <div className='space-y-2'>
        {filteredElements.map((element, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedElement === element ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => selectElement(element)}
          >
            <CardContent className='p-3'>
              <div className='flex items-start justify-between'>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Badge variant='outline' className='text-xs'>
                      {element.tagName}
                    </Badge>
                    {renderConfidenceBadge(element.analysis.confidence)}
                    {!element.visible && (
                      <Badge variant='secondary' className='text-xs'>
                        <Eye className='w-3 h-3 mr-1' />
                        隐藏
                      </Badge>
                    )}
                    {!element.enabled && (
                      <Badge variant='destructive' className='text-xs'>
                        禁用
                      </Badge>
                    )}
                  </div>

                  <div className='text-sm text-gray-600 truncate'>
                    {element.textContent || element.selector}
                  </div>

                  <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                    <span>类型: {element.interactionType}</span>
                    <span>
                      区域: {element.clickableArea.area.toFixed(0)}px²
                    </span>
                    {element.framework && (
                      <span>框架: {element.framework}</span>
                    )}
                  </div>
                </div>

                <div className='flex flex-col items-end gap-1'>
                  <div
                    className='w-4 h-4 rounded border-2'
                    style={{ backgroundColor: getElementColor(element) }}
                  />
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={e => {
                      e.stopPropagation();
                      testElementInteraction(element);
                    }}
                    className='text-xs px-2 py-1 h-6'
                  >
                    <Play className='w-3 h-3' />
                  </Button>
                  <span className='text-xs text-gray-400'>#{index + 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );

  // 渲染元素详情
  const renderElementDetails = () => {
    if (!selectedElement) {
      return (
        <div className='flex items-center justify-center h-96 text-gray-500'>
          <div className='text-center'>
            <Target className='w-12 h-12 mx-auto mb-2 opacity-50' />
            <p>选择一个元素查看详细信息</p>
          </div>
        </div>
      );
    }

    const { analysis, accessibility, capabilities } = selectedElement;

    return (
      <ScrollArea className='h-96'>
        <div className='space-y-4'>
          {/* 基本信息 */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Info className='w-4 h-4' />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 space-y-2'>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>
                  标签: <code>{selectedElement.tagName}</code>
                </div>
                <div>类型: {selectedElement.interactionType}</div>
                <div>
                  ID: <code>{selectedElement.id || '无'}</code>
                </div>
                <div>
                  类名: <code>{selectedElement.className || '无'}</code>
                </div>
              </div>
              <div className='text-sm'>
                <div>选择器:</div>
                <code className='text-xs bg-gray-100 p-1 rounded block mt-1 break-all'>
                  {selectedElement.selector}
                </code>
              </div>
              {selectedElement.textContent && (
                <div className='text-sm'>
                  <div>文本内容:</div>
                  <div className='bg-gray-50 p-2 rounded text-xs mt-1'>
                    {selectedElement.textContent}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 可点击性分析 */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Activity className='w-4 h-4' />
                可点击性分析
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 space-y-2'>
              <div className='flex items-center gap-2'>
                {analysis.isClickable ? (
                  <CheckCircle className='w-4 h-4 text-green-500' />
                ) : (
                  <XCircle className='w-4 h-4 text-red-500' />
                )}
                <span className='text-sm'>
                  {analysis.isClickable ? '可点击' : '不可点击'}
                </span>
                {renderConfidenceBadge(analysis.confidence)}
              </div>

              {analysis.reasons.length > 0 && (
                <div>
                  <div className='text-sm font-medium mb-1'>判断依据:</div>
                  <ul className='text-xs space-y-1'>
                    {analysis.reasons.map((reason, idx) => (
                      <li key={idx} className='flex items-center gap-1'>
                        <CheckCircle className='w-3 h-3 text-green-500' />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.warnings.length > 0 && (
                <div>
                  <div className='text-sm font-medium mb-1'>警告:</div>
                  <ul className='text-xs space-y-1'>
                    {analysis.warnings.map((warning, idx) => (
                      <li key={idx} className='flex items-center gap-1'>
                        <AlertTriangle className='w-3 h-3 text-yellow-500' />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 位置和尺寸 */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Target className='w-4 h-4' />
                位置和尺寸
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>X: {selectedElement.position.x.toFixed(0)}px</div>
                <div>Y: {selectedElement.position.y.toFixed(0)}px</div>
                <div>宽度: {selectedElement.position.width.toFixed(0)}px</div>
                <div>高度: {selectedElement.position.height.toFixed(0)}px</div>
                <div>
                  可点击区域: {selectedElement.clickableArea.area.toFixed(0)}px²
                </div>
                <div>
                  中心点: ({selectedElement.clickableArea.center.x.toFixed(0)},{' '}
                  {selectedElement.clickableArea.center.y.toFixed(0)})
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 交互能力 */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Zap className='w-4 h-4' />
                交互能力
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0'>
              <div className='flex flex-wrap gap-1'>
                {capabilities.map((capability, idx) => (
                  <Badge key={idx} variant='outline' className='text-xs'>
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 可访问性 */}
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center gap-2'>
                <Eye className='w-4 h-4' />
                可访问性
              </CardTitle>
            </CardHeader>
            <CardContent className='pt-0 space-y-2'>
              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>有标签: {accessibility.hasLabel ? '是' : '否'}</div>
                <div>Tab索引: {accessibility.tabIndex ?? '默认'}</div>
              </div>
              {accessibility.ariaLabel && (
                <div className='text-sm'>
                  <div>
                    ARIA标签: <code>{accessibility.ariaLabel}</code>
                  </div>
                </div>
              )}
              {accessibility.role && (
                <div className='text-sm'>
                  <div>
                    ARIA角色: <code>{accessibility.role}</code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  };

  // 渲染统计信息
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>总元素数</p>
                  <p className='text-2xl font-bold'>{stats.totalElements}</p>
                </div>
                <Layers className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>可点击元素</p>
                  <p className='text-2xl font-bold text-green-600'>
                    {stats.clickableElements}
                  </p>
                </div>
                <MousePointer className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>可见元素</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    {stats.visibleElements}
                  </p>
                </div>
                <Eye className='w-8 h-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600'>处理时间</p>
                  <p className='text-2xl font-bold text-purple-600'>
                    {stats.processingTime.toFixed(1)}ms
                  </p>
                </div>
                <Clock className='w-8 h-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>扫描历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2 text-sm'>
              <div>扫描次数: {stats.scanCount}</div>
              <div>最后扫描: {stats.lastScanTime.toLocaleString()}</div>
              <div>缓存命中: {stats.cacheHits}</div>
            </div>
          </CardContent>
        </Card>

        {Object.keys(stats.frameworks).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>检测到的框架</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                {Object.entries(stats.frameworks).map(([framework, count]) => (
                  <div
                    key={framework}
                    className='flex items-center justify-between'
                  >
                    <span className='text-sm'>{framework}</span>
                    <Badge variant='outline'>{count} 个元素</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-4'>
      {/* 错误提示 */}
      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 控制面板 */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <MousePointer className='h-5 w-5 text-blue-500' />
            可点击元素处理器测试
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='flex items-center gap-2 mb-4 flex-wrap'>
            <Button
              onClick={scanClickableElements}
              disabled={!processor || isScanning}
              className='flex items-center gap-2'
            >
              {isScanning ? (
                <RefreshCw className='w-4 h-4 animate-spin' />
              ) : (
                <Target className='w-4 h-4' />
              )}
              {isScanning ? '扫描中...' : '开始扫描'}
            </Button>

            <Button
              variant={isRealTimeMode ? 'default' : 'outline'}
              onClick={toggleRealTimeMode}
              disabled={!processor}
              className='flex items-center gap-2'
            >
              {isRealTimeMode ? (
                <Pause className='w-4 h-4' />
              ) : (
                <Play className='w-4 h-4' />
              )}
              {isRealTimeMode ? '停止实时' : '实时扫描'}
            </Button>

            {clickableElements.length > 0 && (
              <>
                <Button
                  variant='outline'
                  onClick={toggleOverlays}
                  className='flex items-center gap-2'
                >
                  <Eye className='w-4 h-4' />
                  {showOverlays ? '隐藏' : '显示'}高亮
                </Button>

                <Button
                  variant='outline'
                  onClick={clearSelection}
                  className='flex items-center gap-2'
                >
                  <XCircle className='w-4 h-4' />
                  清除选择
                </Button>

                <Button
                  variant='outline'
                  onClick={exportResults}
                  className='flex items-center gap-2'
                >
                  <Download className='w-4 h-4' />
                  导出结果
                </Button>
              </>
            )}
          </div>

          {isScanning && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span>扫描进度</span>
                <span>{scanProgressRef.current}%</span>
              </div>
              <Progress value={scanProgressRef.current} className='w-full' />
            </div>
          )}

          {isRealTimeMode && (
            <Alert className='mt-2'>
              <Activity className='h-4 w-4' />
              <AlertDescription>
                实时扫描模式已启用，每2秒自动扫描一次页面变化
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      {clickableElements.length > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='scan' className='flex items-center gap-2'>
              <Target className='w-4 h-4' />
              扫描结果 ({filteredElements.length})
            </TabsTrigger>
            <TabsTrigger value='details' className='flex items-center gap-2'>
              <Info className='w-4 h-4' />
              元素详情
            </TabsTrigger>
            <TabsTrigger value='stats' className='flex items-center gap-2'>
              <Activity className='w-4 h-4' />
              统计信息
            </TabsTrigger>
          </TabsList>

          <TabsContent value='scan' className='mt-4'>
            {renderFilterControls()}
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm flex items-center justify-between'>
                  <span className='flex items-center gap-2'>
                    <Target className='w-4 h-4' />
                    发现的可点击元素 ({filteredElements.length}/
                    {clickableElements.length})
                  </span>
                  {selectedElement && (
                    <Badge variant='outline'>
                      已选择: #{clickableElements.indexOf(selectedElement) + 1}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0'>{renderElementList()}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='details' className='mt-4'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm flex items-center gap-2'>
                  <Info className='w-4 h-4' />
                  元素详细信息
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-0'>
                {renderElementDetails()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='stats' className='mt-4'>
            {renderStats()}
          </TabsContent>
        </Tabs>
      )}

      {/* 高亮覆盖层容器 */}
      <div
        ref={overlayContainerRef}
        className='fixed inset-0 pointer-events-none z-50'
      >
        {showOverlays &&
          highlightOverlays.map((overlay, index) => {
            if (!overlay.visible) return null;

            const { element } = overlay;
            const rect = element.element.getBoundingClientRect();

            return (
              <div
                key={index}
                className='absolute border-2 transition-all duration-200'
                style={{
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  borderColor: overlay.color,
                  backgroundColor: `${overlay.color}20`,
                  zIndex: selectedElement === element ? 60 : 50,
                }}
              >
                <div
                  className='absolute -top-6 left-0 px-1 py-0.5 text-xs text-white rounded text-nowrap'
                  style={{ backgroundColor: overlay.color }}
                >
                  #{index + 1} {element.tagName}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
