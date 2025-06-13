/**
 * @file purpose: iframe 测试页面
 */

import { createRoot } from 'react-dom/client';
import './index.css';
import setupLocatorUI from '@locator/runtime';
import { TestPageContent } from './components/TestPageContent';

// 初始化 React 应用
const container = document.getElementById('app');
if (!container) {
  throw new Error('找不到应用容器元素');
}

setupLocatorUI();

const root = createRoot(container);
root.render(<TestPageContent />);
