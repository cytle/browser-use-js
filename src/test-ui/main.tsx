/**
 * @file purpose: 测试UI界面的React主入口
 */

import { createRoot } from 'react-dom/client';
import './index.css';
import { TestApp } from './components/TestApp';
import setupLocatorUI from '@locator/runtime';

// 初始化 React 应用
const container = document.getElementById('app');
if (!container) {
  throw new Error('找不到应用容器元素');
}

setupLocatorUI();

const root = createRoot(container);
root.render(<TestApp />);
