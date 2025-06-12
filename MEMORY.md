# Browser-Use JS 项目记忆

## 📅 2024-12-19

### 🎯 当前进度

**里程碑 2 进度**: 基础模块实现 - 50% 完成 (2/4 任务)

- ✅ T-004: DOM 核心处理器 (已完成)
- ✅ T-005: 可点击元素处理器 (已完成)
- [ ] T-006: 历史树处理器 (下一步)
- [ ] T-007: 浏览器核心控制器

### 🔄 最新更新

#### 测试 UI 状态管理重构 ✅

**重构内容**: 将 React hooks 状态管理迁移到 Zustand

**技术变更**:

- 从 `useState` + `useCallback` 迁移到 Zustand store
- 添加 Redux DevTools 支持 (devtools middleware)
- 保持相同的 API 接口，确保组件无需修改

**优势**:

- 更好的性能 (减少不必要的重渲染)
- 简化的状态管理逻辑
- 更好的开发体验 (Redux DevTools)
- 类型安全的状态管理

**文件变更**: `src/test-ui/hooks/useTestState.ts`

### ✅ 已完成任务

#### T-001 项目基础配置搭建 ✅

- Vite + TypeScript + 热重载
- ESLint + Prettier + Husky
- 基础目录结构

#### T-003 测试框架配置 ✅

- Vitest + jsdom 环境
- 覆盖率阈值 80%
- CI/CD 流程 (GitHub Actions)
- 测试工具和辅助函数

#### T-004 DOM 核心处理器 ✅

- DOM 树遍历和分析
- 智能元素选择器生成
- Shadow DOM 支持
- 性能优化

#### T-005 可点击元素处理器 ✅

**核心功能**:

- 智能可点击元素识别 (标准 HTML + ARIA + 事件监听器)
- 框架组件检测 (React/Vue/Angular)
- 置信度评分算法 (0-1 范围)
- 可访问性信息收集

**性能优化**:

- 结果缓存 + MutationObserver 自动失效
- Shadow DOM 深度扫描
- 大型 DOM 树优化

#### 可视化测试页面 ✅

**功能特性**:

- 🚀 系统初始化测试 (配置调试模式、超时时间)
- 🔍 DOM 处理测试 (元素扫描、高亮、历史树)
- 🌐 浏览器控制测试 (导航验证、截图功能)
- 🧠 AI 代理测试 (任务执行、记忆系统)
- ⚡ 动作系统测试 (动作列表、自定义动作)
- 📊 性能监控 (内存、DOM元素、响应时间)

**技术实现**:

- 现代化响应式UI设计
- 实时日志系统 (彩色分类显示)
- 状态指示器 (成功/错误/处理中)
- 测试元素区域 (带data-testid属性)
- 日志导出功能

**访问方式**: `pnpm dev` → `http://localhost:3000`

### 📋 下一步: T-006 历史树处理器

**任务概述**: 页面变化追踪和状态管理

**验收标准**:

- DOM 变更历史记录
- 状态快照管理
- 回滚和恢复机制
- 内存优化的历史存储

**技术要求**: MutationObserver API + 高效数据结构

## 📚 核心知识点

### 可点击元素识别算法

**多维度评分权重**:

- 标准 HTML 元素: 0.9
- 事件监听器: 0.8
- ARIA 角色: 0.7
- CSS 样式: 0.6
- 框架组件: 0.5

### 框架检测技术

- **React**: `__react` 属性, `data-reactroot`
- **Vue**: `v-` 指令, `__vue` 属性
- **Angular**: `ng-` 属性

### 选择器生成策略

1. ID 选择器 (最高优先级)
2. 类名 + nth-of-type 组合
3. 路径选择器 (后备方案)
4. 特殊字符转义处理

### 测试框架要点

- **jsdom 限制**: 需手动设置 offset 属性
- **覆盖率**: v8 provider, 80% 阈值
- **Mock 工厂**: 统一创建接口, 类型安全

### 性能优化策略

- 结果缓存避免重复计算
- MutationObserver 监听变化
- TreeWalker 高效遍历
- 性能模式跳过昂贵检查

## 项目概述

Browser-Use
JS 是 Browser-Use 的纯浏览器版本 JavaScript 复刻，让 AI 代理能够直接在浏览器中控制网页交互。

## 技术栈更新记录

### 2024-12 AI Provider 技术栈更新

- **更新前**: 直接使用字符串模型名称 (如 "gpt-4o")
- **更新后**: 使用 Vercel AI SDK (@ai-sdk/openai)
- **原因**:
  - 提供更好的类型安全
  - 统一的 AI 模型接口
  - 更好的错误处理和流式响应支持
  - 与现代 AI 开发最佳实践保持一致

### AI 集成技术栈

- **AI SDK**: @ai-sdk/openai - Vercel AI SDK OpenAI Provider
- **AI 核心**: ai - Vercel AI SDK 核心库
- **支持模型**: OpenAI GPT 系列 (gpt-4o, gpt-4-turbo, gpt-3.5-turbo 等)

## 目录结构更新

### test-ui 目录 (新增)

```
src/test-ui/
├── components/      # React 组件
│   └── ui/          # UI 组件库 (基于 Radix UI)
├── lib/             # 工具函数
├── main.ts          # 测试 UI 入口
└── index.css        # 样式文件 (Tailwind CSS)
```

**用途**:

- 提供可视化的测试界面
- 方便开发者调试和测试 AI 代理功能
- 展示项目功能和使用示例

**技术栈**:

- React 19
- Tailwind CSS 4.x
- Radix UI 组件库
- Lucide React 图标
- tw-animate-css 动画

## 核心架构

### 模块组织

```
src/
├── main.ts              # 主入口文件
├── agent/               # AI 代理核心逻辑
│   ├── index.ts
│   ├── memory/          # 记忆管理
│   └── message_manager/ # 消息管理
├── browser/             # 浏览器交互模块
│   ├── index.ts
│   └── controller.ts
├── controller/          # 控制器和动作注册
│   ├── index.ts
│   └── registry/        # 动作注册系统
├── dom/                 # DOM 处理和元素识别
│   ├── index.ts
│   ├── clickable_element_processor/
│   └── history_tree_processor/
├── test/                # 测试工具和辅助函数
│   └── utils/
├── test-ui/             # 测试界面组件
└── types/               # TypeScript 类型定义
```

## 开发工具链

### 包管理

- **工具**: pnpm
- **原因**: 更快的安装速度，更好的磁盘空间利用率

### 测试框架

- **测试运行器**: Vitest
- **测试 UI**: @vitest/ui - 可视化测试界面
- **覆盖率**: @vitest/coverage-v8
- **DOM 测试**: jsdom

### 状态管理

- **全局状态**: Zustand - 轻量级状态管理库
- **开发工具**: Redux DevTools 支持
- **特性**: TypeScript 类型安全、性能优化

### 代码质量

- **代码检查**: ESLint 9.x
- **代码格式化**: Prettier
- **Git Hooks**: Husky
- **预提交检查**: lint-staged

## 使用示例更新

### 新的 AI 模型使用方式

```typescript
import { openai } from '@ai-sdk/openai';
import { Agent } from './src/agent';

// 创建 AI 代理
const agent = new Agent({
  task: '执行网页任务',
  model: openai('gpt-4o'), // 使用 Vercel AI SDK
  controller: new BrowserController(),
});

const result = await agent.run();
```

## 重要决策记录

1. **AI SDK 选择**: 选择 Vercel AI SDK 而非直接调用 OpenAI API

   - 更好的 TypeScript 支持
   - 统一的流式响应处理
   - 更好的错误处理机制

2. **测试 UI 技术栈**: 选择 React + Tailwind CSS

   - 快速开发现代化界面
   - 与主项目技术栈保持一致
   - 丰富的组件生态系统

3. **包管理器**: 选择 pnpm
   - 更快的安装速度
   - 更好的依赖管理
   - 节省磁盘空间

## 待解决问题

- [ ] AI SDK 的流式响应集成
- [ ] 测试 UI 的完整功能实现
- [ ] 性能优化和内存管理
- [ ] 错误处理机制完善

## 参考资源

- [Vercel AI SDK 文档](https://sdk.vercel.ai/)
- [OpenAI Provider 文档](https://sdk.vercel.ai/providers/ai-sdk-providers/openai)
- [Vitest 文档](https://vitest.dev/)
- [Tailwind CSS 4.x 文档](https://tailwindcss.com/)
