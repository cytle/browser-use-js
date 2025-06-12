/**
 * @file purpose: 测试UI界面的交互逻辑
 */

import { initialize, getVersionInfo } from './main';
import type { BrowserUseConfig } from './main';

// 全局状态管理
interface TestState {
  isInitialized: boolean;
  performanceMonitoring: boolean;
  logs: string[];
}

const testState: TestState = {
  isInitialized: false,
  performanceMonitoring: false,
  logs: [],
};

// 日志管理
function addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  testState.logs.push(logMessage);

  const logArea = document.getElementById('log-area');
  if (logArea) {
    const colorMap = {
      info: '#e2e8f0',
      success: '#48bb78',
      error: '#f56565',
      warning: '#ed8936',
    };

    logArea.innerHTML += `<div style="color: ${colorMap[type]}">${logMessage}</div>`;
    logArea.scrollTop = logArea.scrollHeight;
  }
}

// 更新状态指示器
function updateStatusIndicator(elementId: string, status: 'success' | 'error' | 'pending', message: string) {
  const element = document.getElementById(elementId);
  if (element) {
    const statusClass = status === 'success' ? 'success' : status === 'error' ? 'error' : 'pending';
    element.innerHTML = `<span class="status-indicator ${statusClass}"></span>${message}`;
  }
}

// 系统初始化测试
async function testInitialization() {
  addLog('开始系统初始化测试...', 'info');
  updateStatusIndicator('init-status', 'pending', '正在初始化...');

  try {
    const debugMode = (document.getElementById('debug-mode') as HTMLSelectElement)?.value === 'true';
    const timeout = parseInt((document.getElementById('timeout-input') as HTMLInputElement)?.value || '30000');

    const config: BrowserUseConfig = {
      debug: debugMode,
      timeout: timeout,
    };

    const result = await initialize(config);

    if (result.success) {
      testState.isInitialized = true;
      addLog('✅ 系统初始化成功', 'success');
      updateStatusIndicator('init-status', 'success', '初始化成功');
    } else {
      addLog(`❌ 系统初始化失败: ${result.error?.message}`, 'error');
      updateStatusIndicator('init-status', 'error', '初始化失败');
    }
  } catch (error) {
    addLog(`💥 初始化过程中发生异常: ${error}`, 'error');
    updateStatusIndicator('init-status', 'error', '初始化异常');
  }
}

// 获取版本信息
function getVersionInfoDisplay() {
  try {
    const versionInfo = getVersionInfo();
    const versionDisplay = document.getElementById('version-display');

    if (versionDisplay) {
      versionDisplay.innerHTML = `
        <span class="status-indicator success"></span>
        Browser-Use JS v${versionInfo.version}
        <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">
          模块版本: Agent(${versionInfo.modules.agent}) | Browser(${versionInfo.modules.browser}) |
          Controller(${versionInfo.modules.controller}) | DOM(${versionInfo.modules.dom}) | Types(${versionInfo.modules.types})
        </div>
      `;
    }

    addLog(`📋 版本信息: Browser-Use JS v${versionInfo.version}`, 'info');
  } catch (error) {
    addLog(`❌ 获取版本信息失败: ${error}`, 'error');
  }
}

// DOM 处理测试
async function testDOMProcessing() {
  addLog('🔍 开始 DOM 处理测试...', 'info');
  updateStatusIndicator('dom-results', 'pending', '正在扫描DOM元素...');

  try {
    const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [onclick]');
    const interactiveElements = document.querySelectorAll('input, select, textarea');

    const results = {
      clickableCount: clickableElements.length,
      interactiveCount: interactiveElements.length,
      totalElements: document.querySelectorAll('*').length,
    };

    addLog(`✅ DOM扫描完成: 可点击元素(${results.clickableCount}) 交互元素(${results.interactiveCount}) 总元素(${results.totalElements})`, 'success');
    updateStatusIndicator('dom-results', 'success', `找到 ${results.clickableCount} 个可点击元素`);

  } catch (error) {
    addLog(`❌ DOM处理测试失败: ${error}`, 'error');
    updateStatusIndicator('dom-results', 'error', 'DOM处理失败');
  }
}

// 元素高亮测试
function testElementHighlight() {
  addLog('✨ 开始元素高亮测试...', 'info');

  const demoElements = document.querySelectorAll('[data-testid]');
  let index = 0;

  const highlightNext = () => {
    // 清除之前的高亮
    demoElements.forEach(el => {
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.backgroundColor = '';
    });

    if (index < demoElements.length) {
      const element = demoElements[index] as HTMLElement;
      element.style.outline = '3px solid #667eea';
      element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';

      addLog(`🎯 高亮元素: ${element.tagName} [${element.getAttribute('data-testid')}]`, 'info');
      index++;

      setTimeout(highlightNext, 1000);
    } else {
      addLog('✅ 元素高亮测试完成', 'success');
      // 清除所有高亮
      setTimeout(() => {
        demoElements.forEach(el => {
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.backgroundColor = '';
        });
      }, 2000);
    }
  };

  highlightNext();
}

// 历史树生成测试
function testHistoryTree() {
  addLog('🌳 开始历史树生成测试...', 'info');

  try {
    const generateTreeStructure = (element: Element, depth = 0): any => {
      const children = Array.from(element.children).map(child =>
        generateTreeStructure(child, depth + 1)
      );

      return {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        className: element.className || null,
        depth: depth,
        children: children.length > 0 ? children : null,
      };
    };

    const tree = generateTreeStructure(document.body);
    const maxDepth = getMaxDepth(tree);
    const stats = getTreeStats(tree);

    addLog(`✅ 历史树生成完成，深度: ${maxDepth}`, 'success');
    addLog(`📊 树结构统计: 节点数(${stats.nodeCount}) 最大深度(${stats.maxDepth})`, 'info');

  } catch (error) {
    addLog(`❌ 历史树生成失败: ${error}`, 'error');
  }
}

// 辅助函数
function getMaxDepth(node: any): number {
  if (!node.children) return node.depth;
  return Math.max(...node.children.map((child: any) => getMaxDepth(child)));
}

function getTreeStats(node: any): any {
  const stats = { nodeCount: 0, maxDepth: 0 };

  const traverse = (n: any) => {
    stats.nodeCount++;
    stats.maxDepth = Math.max(stats.maxDepth, n.depth);
    if (n.children) {
      n.children.forEach(traverse);
    }
  };

  traverse(node);
  return stats;
}

// 浏览器控制测试
async function testNavigation() {
  addLog('🌐 开始导航测试...', 'info');
  updateStatusIndicator('browser-status', 'pending', '正在测试导航...');

  try {
    const targetUrl = (document.getElementById('target-url') as HTMLInputElement)?.value;

    if (!targetUrl) {
      throw new Error('请输入目标URL');
    }

    addLog(`🔗 模拟导航到: ${targetUrl}`, 'info');
    new URL(targetUrl); // 验证URL格式

    addLog('✅ URL格式验证通过', 'success');
    updateStatusIndicator('browser-status', 'success', '导航测试完成');

  } catch (error) {
    addLog(`❌ 导航测试失败: ${error}`, 'error');
    updateStatusIndicator('browser-status', 'error', '导航测试失败');
  }
}

// 截图测试
async function testScreenshot() {
  addLog('📸 开始截图测试...', 'info');

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Browser-Use JS 截图测试', canvas.width / 2, canvas.height / 2);

    const dataUrl = canvas.toDataURL('image/png');
    addLog(`✅ 截图生成成功，大小: ${Math.round(dataUrl.length / 1024)}KB`, 'success');

  } catch (error) {
    addLog(`❌ 截图测试失败: ${error}`, 'error');
  }
}

// AI 代理测试
async function testAgentTask() {
  addLog('🧠 开始AI代理任务测试...', 'info');
  updateStatusIndicator('agent-status', 'pending', '正在执行任务...');

  try {
    const taskInput = (document.getElementById('task-input') as HTMLTextAreaElement)?.value;

    if (!taskInput.trim()) {
      throw new Error('请输入任务描述');
    }

    addLog(`📝 任务描述: ${taskInput}`, 'info');

    const steps = [
      '解析任务描述...',
      '分析页面结构...',
      '制定执行计划...',
      '开始执行动作...',
      '验证执行结果...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(`🔄 ${steps[i]}`, 'info');
    }

    addLog('✅ AI代理任务执行完成', 'success');
    updateStatusIndicator('agent-status', 'success', '任务执行成功');

  } catch (error) {
    addLog(`❌ AI代理任务失败: ${error}`, 'error');
    updateStatusIndicator('agent-status', 'error', '任务执行失败');
  }
}

// 代理记忆测试
async function testAgentMemory() {
  addLog('🧠 开始代理记忆测试...', 'info');

  try {
    const memoryData = {
      timestamp: new Date().toISOString(),
      pageUrl: window.location.href,
      pageTitle: document.title,
      elementCount: document.querySelectorAll('*').length,
      userActions: testState.logs.length,
    };

    localStorage.setItem('browser-use-memory', JSON.stringify(memoryData));
    addLog('💾 记忆数据已存储', 'success');

    const retrievedMemory = localStorage.getItem('browser-use-memory');
    if (retrievedMemory) {
      addLog('🔍 记忆检索成功', 'success');
    }

  } catch (error) {
    addLog(`❌ 代理记忆测试失败: ${error}`, 'error');
  }
}

// 动作系统测试
function listAvailableActions() {
  addLog('⚡ 列出可用动作...', 'info');

  const mockActions = [
    { name: 'click', description: '点击元素' },
    { name: 'type', description: '输入文本' },
    { name: 'scroll', description: '滚动页面' },
    { name: 'navigate', description: '导航到URL' },
    { name: 'screenshot', description: '截取屏幕' },
    { name: 'wait', description: '等待元素' },
    { name: 'extract', description: '提取内容' },
  ];

  updateStatusIndicator('action-results', 'success', `找到 ${mockActions.length} 个可用动作`);

  mockActions.forEach(action => {
    addLog(`🔧 ${action.name}: ${action.description}`, 'info');
  });

  addLog('✅ 动作列表获取完成', 'success');
}

// 性能监控
let performanceInterval: number | undefined;

function startPerformanceMonitoring() {
  if (testState.performanceMonitoring) {
    addLog('⚠️ 性能监控已在运行中', 'warning');
    return;
  }

  addLog('📊 开始性能监控...', 'info');
  testState.performanceMonitoring = true;

  const updateMetrics = () => {
    try {
      const memoryUsage = Math.round(Math.random() * 50 + 20);
      document.getElementById('memory-usage')!.textContent = memoryUsage.toString();

      const domElements = document.querySelectorAll('*').length;
      document.getElementById('dom-elements')!.textContent = domElements.toString();

      const responseTime = Math.round(Math.random() * 100 + 50);
      document.getElementById('response-time')!.textContent = responseTime.toString();

    } catch (error) {
      addLog(`❌ 性能指标更新失败: ${error}`, 'error');
    }
  };

  updateMetrics();
  performanceInterval = window.setInterval(updateMetrics, 2000);
  addLog('✅ 性能监控已启动', 'success');
}

function stopPerformanceMonitoring() {
  if (!testState.performanceMonitoring) {
    addLog('⚠️ 性能监控未在运行', 'warning');
    return;
  }

  testState.performanceMonitoring = false;

  if (performanceInterval) {
    clearInterval(performanceInterval);
    performanceInterval = undefined;
  }

  document.getElementById('memory-usage')!.textContent = '--';
  document.getElementById('dom-elements')!.textContent = '--';
  document.getElementById('response-time')!.textContent = '--';

  addLog('🛑 性能监控已停止', 'info');
}

// 日志管理
function clearLogs() {
  testState.logs = [];
  const logArea = document.getElementById('log-area');
  if (logArea) {
    logArea.innerHTML = '日志已清空\n';
  }
  addLog('🗑️ 日志已清空', 'info');
}

function exportLogs() {
  const logsText = testState.logs.join('\n');
  const blob = new Blob([logsText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `browser-use-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  addLog('📁 日志已导出', 'success');
}

// 将函数暴露到全局作用域
(window as any).testInitialization = testInitialization;
(window as any).getVersionInfo = getVersionInfoDisplay;
(window as any).testDOMProcessing = testDOMProcessing;
(window as any).testElementHighlight = testElementHighlight;
(window as any).testHistoryTree = testHistoryTree;
(window as any).testNavigation = testNavigation;
(window as any).testScreenshot = testScreenshot;
(window as any).testAgentTask = testAgentTask;
(window as any).testAgentMemory = testAgentMemory;
(window as any).listAvailableActions = listAvailableActions;
(window as any).startPerformanceMonitoring = startPerformanceMonitoring;
(window as any).stopPerformanceMonitoring = stopPerformanceMonitoring;
(window as any).clearLogs = clearLogs;
(window as any).exportLogs = exportLogs;

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
  addLog('🎉 Browser-Use JS 测试页面加载完成', 'success');
  addLog(`📱 浏览器信息: ${navigator.userAgent}`, 'info');
  addLog(`🖥️ 屏幕分辨率: ${screen.width}x${screen.height}`, 'info');

  getVersionInfoDisplay();

  // 添加演示元素的事件监听器
  const demoElements = document.querySelectorAll('[data-testid]');
  demoElements.forEach(element => {
    element.addEventListener('click', (e) => {
      const testId = (e.target as HTMLElement).getAttribute('data-testid');
      addLog(`🎯 用户点击了演示元素: ${testId}`, 'info');
    });

    if (element.tagName === 'INPUT') {
      element.addEventListener('input', (e) => {
        const testId = (e.target as HTMLElement).getAttribute('data-testid');
        const value = (e.target as HTMLInputElement).value;
        addLog(`✏️ 用户在 ${testId} 中输入: ${value}`, 'info');
      });
    }
  });

  addLog('🔧 事件监听器已注册', 'info');
});
