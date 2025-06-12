# Browser-Use JS 🌐

[![GitHub stars](https://img.shields.io/github/stars/gregpr07/browser-use?style=social)](https://github.com/gregpr07/browser-use/stargazers)
[![Discord](https://img.shields.io/discord/1303749220842340412?color=7289DA&label=Discord&logo=discord&logoColor=white)](https://link.browser-use.com/discord)

🚀 **Browser-Use JS** 是 [Browser-Use](https://github.com/browser-use/browser-use)
的纯浏览器版本 JavaScript 复刻，让 AI 代理能够直接在浏览器中控制网页交互。

## 🎯 项目简介

Browser-Use JS 是原 Python 版本 Browser-Use 的 JavaScript 实现，专为浏览器环境设计。它允许 AI 代理：

- 🤖 **自主网页交互** - AI 代理可以点击、输入、滚动等操作
- 🧠 **智能决策** - 基于页面内容做出下一步行动决策
- 🎯 **任务导向** - 接受自然语言任务描述并自动完成
- 🌐 **纯浏览器运行** - 无需服务器，直接在浏览器中运行
- 🖼️ **Iframe 沙盒控制** - 通过 Iframe 安全地操控目标网页，支持跨域访问

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动演示

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看演示界面。

## 🎯 演示界面

演示界面提供了完整的 Browser-Use JS 功能展示：

### 📋 主要功能模块

1. **🎯 综合演示** - 完整的 AI 代理工作流程演示

   - 智能网页搜索
   - 表单自动填写
   - 自定义任务执行
   - 实时测试页面

2. **🔧 系统测试** - 系统初始化和配置

   - 调试模式配置
   - 超时时间设置
   - 系统状态监控

3. **🌐 DOM 处理** - 页面元素识别和交互

   - DOM 结构扫描
   - 元素高亮演示
   - 交互性测试

4. **🤖 AI 代理** - AI 任务理解和执行

   - 自然语言任务输入
   - 代理记忆管理
   - 可用动作列表

5. **📊 性能监控** - 系统性能和资源监控

   - CPU 和内存使用率
   - 操作执行时间
   - 错误率统计

6. **📝 日志查看** - 系统运行日志和调试信息
   - 实时日志流
   - 多级别日志分类
   - 错误追踪

### 🎮 使用流程

1. **初始化系统**

   ```
   系统测试 → 配置参数 → 开始初始化
   ```

2. **测试功能**

   ```
   DOM 处理 → 扫描元素 → 高亮测试
   AI 代理 → 输入任务 → 执行验证
   ```

3. **综合演示**
   ```
   综合演示 → 选择场景 → 配置参数 → 开始演示
   ```

## 🔧 技术架构

### 🖼️ Iframe 沙盒架构

Browser-Use JS 采用 Iframe 沙盒技术来安全地操控目标网页：

```
┌─────────────────────────────────────────────────────────────┐
│                    主应用 (Host Application)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ AI Agent    │  │ Controller  │  │ Iframe Manager      │  │
│  │ 智能决策    │  │ 动作协调    │  │ 沙盒管理            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              消息桥接系统 (Message Bridge)               │  │
│  │          postMessage API + 安全验证 + 协议转换          │  │
│  └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                Iframe 沙盒环境                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │ 目标网页    │  │ DOM 操作    │  │ 事件监听        │  │  │
│  │  │ Target Page │  │ Adapter     │  │ Event Handler   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│  │                                                         │  │
│  │  安全策略: sandbox="allow-scripts allow-same-origin"    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**核心优势**:

- 🔒 **安全隔离**: Iframe 沙盒提供天然的安全边界
- 🌐 **跨域支持**: 通过代理机制支持跨域页面操作
- 🛡️ **权限控制**: 细粒度的沙盒权限配置
- 🔄 **消息通信**: 基于 postMessage 的安全通信机制
- 📊 **状态同步**: 实时同步 Iframe 内页面状态

### 核心技术栈

- **语言**: TypeScript
- **构建工具**: Vite
- **前端框架**: React 19
- **样式框架**: Tailwind CSS 4.x
- **组件库**: Radix UI + Shadcn UI
- **AI 集成**: Vercel AI SDK (@ai-sdk/openai)
- **状态管理**: Zustand
- **测试框架**: Vitest
- **沙盒技术**: Iframe + postMessage API
- **跨域处理**: CORS 代理 + 消息通信

### 模块结构

```
browser-use-js/
├── src/
│   ├── main.ts              # 主入口文件
│   ├── agent/               # AI 代理核心逻辑
│   │   ├── index.ts
│   │   ├── memory/          # 记忆管理
│   │   └── message_manager/ # 消息管理
│   ├── browser/             # 浏览器交互模块
│   │   ├── index.ts
│   │   └── controller.ts
│   ├── controller/          # 控制器和动作注册
│   │   ├── index.ts
│   │   └── registry/        # 动作注册系统
│   ├── dom/                 # DOM 处理和元素识别
│   │   ├── index.ts
│   │   ├── clickable_element_processor/
│   │   └── history_tree_processor/
│   ├── iframe/              # Iframe 沙盒控制模块
│   │   ├── index.ts
│   │   ├── manager/         # Iframe 管理器
│   │   ├── bridge/          # 消息桥接
│   │   └── proxy/           # 跨域代理
│   ├── test/                # 测试工具和辅助函数
│   │   └── utils/
│   ├── test-ui/             # 测试界面组件
│   │   ├── components/      # React 组件
│   │   │   └── ui/          # UI 组件库
│   │   ├── lib/             # 工具函数
│   │   ├── main.ts          # 测试 UI 入口
│   │   └── index.css        # 样式文件
│   └── types/               # TypeScript 类型定义
│       └── index.ts
├── public/                  # 静态资源
├── index.html               # HTML 入口
├── package.json             # 项目配置
└── tsconfig.json            # TypeScript 配置
```

## 📚 开发指南

### 添加新功能

1. **新增 AI 动作**

   ```typescript
   @controller.registry.action("动作描述")
   async function newAction(params: ActionParams): Promise<ActionResult> {
     // 实现动作逻辑
     return { success: true, data: result };
   }
   ```

2. **扩展 DOM 处理**

   ```typescript
   export class CustomProcessor extends DOMCoreProcessor {
     async processElements(elements: HTMLElement[]): Promise<ProcessResult> {
       // 自定义处理逻辑
     }
   }
   ```

3. **添加测试组件**
   ```typescript
   export function NewTestComponent() {
     // 新的测试界面组件
   }
   ```

### 配置 AI 模型

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: '你的提示词',
});
```

### Iframe 沙盒操作

```typescript
import { IframeManager } from '@/iframe';

// 创建 Iframe 沙盒
const iframeManager = new IframeManager({
  sandbox: ['allow-scripts', 'allow-same-origin'],
  security: {
    allowedOrigins: ['https://example.com'],
    maxExecutionTime: 30000,
  },
});

// 加载目标页面
await iframeManager.loadPage('https://example.com');

// 在 Iframe 中执行操作
await iframeManager.executeAction('click', {
  selector: '#submit-button',
});
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 启动测试 UI
pnpm test:ui

# 生成覆盖率报告
pnpm test:coverage
```

### 测试页面元素

演示界面包含丰富的测试元素，所有元素都带有 `data-testid` 属性：

- 搜索框: `search-input`
- 表单字段: `name-input`, `email-input`, `phone-input`
- 按钮: `primary-button`, `secondary-button`
- 链接: `home-link`, `about-link`
- 数据列表: `user-item-{id}`

## 📖 详细文档

- [演示指南](./DEMO_GUIDE.md) - 详细的演示界面使用说明
- [开发规范](./MEMORY.md) - 项目开发规范和最佳实践
- [任务管理](./TASK.md) - 项目任务和进度管理

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [原项目 Browser-Use](https://github.com/browser-use/browser-use)
- [文档](https://docs.browser-use.com)
- [Discord 社区](https://link.browser-use.com/discord)
- [云端版本](https://cloud.browser-use.com)

## 🙏 致谢

感谢 [Browser-Use](https://github.com/browser-use/browser-use)
原项目团队的出色工作，为我们提供了优秀的设计理念和实现参考。

---

**让 AI 控制您的浏览器，从未如此简单！** 🚀
