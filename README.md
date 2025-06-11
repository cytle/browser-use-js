# Browser-Use JS 🌐

[![GitHub stars](https://img.shields.io/github/stars/gregpr07/browser-use?style=social)](https://github.com/gregpr07/browser-use/stargazers)
[![Discord](https://img.shields.io/discord/1303749220842340412?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://link.browser-use.com/discord)

🚀 **Browser-Use JS** 是 [Browser-Use](https://github.com/browser-use/browser-use) 的纯浏览器版本 JavaScript 复刻，让 AI 代理能够直接在浏览器中控制网页交互。

## 🎯 项目简介

Browser-Use JS 是原 Python 版本 Browser-Use 的 JavaScript 实现，专为浏览器环境设计。它允许 AI 代理：

- 🤖 **自主网页交互** - AI 代理可以点击、输入、滚动等操作
- 🧠 **智能决策** - 基于页面内容做出下一步行动决策
- 🎯 **任务导向** - 接受自然语言任务描述并自动完成
- 🌐 **纯浏览器运行** - 无需服务器，直接在浏览器中运行

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 🏗️ 项目结构

```
browser-use-js/
├── src/
│   ├── main.ts          # 主入口文件
│   ├── agent/           # AI 代理核心逻辑
│   ├── browser/         # 浏览器交互模块
│   ├── controller/      # 控制器和动作注册
│   └── dom/             # DOM 处理和元素识别
├── public/              # 静态资源
├── index.html           # HTML 入口
├── package.json         # 项目配置
└── tsconfig.json        # TypeScript 配置
```

## 🔧 核心功能

### AI 代理 (Agent)
- 任务解析和执行
- 智能决策引擎
- 记忆管理

### 浏览器控制 (Browser)
- 页面导航
- 元素交互
- 事件处理

### DOM 处理 (DOM)
- 可点击元素识别
- 页面结构分析
- 内容提取

### 控制器 (Controller)
- 动作注册系统
- 自定义功能扩展
- 结果处理

## 📝 使用示例

```typescript
import { Agent } from './src/agent';
import { BrowserController } from './src/browser';

// 创建 AI 代理
const agent = new Agent({
  task: "在购物网站上搜索笔记本电脑并比较价格",
  model: "gpt-4o" // 或其他支持的模型
});

// 运行任务
await agent.run();
```

## 🎨 自定义动作

您可以轻松添加自定义动作：

```typescript
import { ActionRegistry } from './src/controller/registry';

const registry = new ActionRegistry();

// 注册自定义动作
registry.registerAction("搜索产品", async (query: string) => {
  // 实现搜索逻辑
  return {
    success: true,
    data: "搜索结果"
  };
});
```

## 🌟 特性

- ✅ **TypeScript 支持** - 完整的类型安全
- ✅ **模块化设计** - 易于扩展和维护
- ✅ **现代化构建** - 基于 Vite 的快速开发体验
- ✅ **浏览器原生** - 无需额外运行时环境
- ✅ **AI 模型集成** - 支持多种 LLM 模型
- ✅ **实时交互** - 即时的页面反馈和控制

## 🔗 与原项目的关系

本项目是 [Browser-Use](https://github.com/browser-use/browser-use) 的 JavaScript 移植版本，保持了核心功能的一致性：

- **相同的设计理念** - AI 代理自主控制浏览器
- **相似的 API 设计** - 熟悉的开发体验
- **兼容的任务格式** - 可以运行相同类型的任务
- **浏览器优化** - 专为浏览器环境优化

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](../CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用与原 Browser-Use 项目相同的许可证。

## 🔗 相关链接

- [原项目 Browser-Use](https://github.com/browser-use/browser-use)
- [文档](https://docs.browser-use.com)
- [Discord 社区](https://link.browser-use.com/discord)
- [云端版本](https://cloud.browser-use.com)

## 🙏 致谢

感谢 [Browser-Use](https://github.com/browser-use/browser-use) 原项目团队的出色工作，为我们提供了优秀的设计理念和实现参考。

---

**让 AI 控制您的浏览器，从未如此简单！** 🚀
