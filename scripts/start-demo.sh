#!/bin/bash

# Browser-Use JS 演示启动脚本

echo "🚀 Browser-Use JS 演示启动脚本"
echo "================================"

# 检查 Node.js 版本
echo "📋 检查环境..."
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js (推荐版本 18+)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  警告: Node.js 版本过低 (当前: $(node -v))，推荐使用 18+ 版本"
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 未找到 pnpm，正在安装..."
    npm install -g pnpm
fi

echo "✅ 环境检查完成"

# 安装依赖
echo ""
echo "📦 安装依赖..."
if [ ! -d "node_modules" ]; then
    pnpm install
else
    echo "✅ 依赖已存在，跳过安装"
fi

# 检查端口
echo ""
echo "🔍 检查端口 3000..."
if lsof -i :3000 &> /dev/null; then
    echo "⚠️  端口 3000 已被占用，请关闭占用进程或修改端口配置"
    echo "   可以使用以下命令查看占用进程: lsof -i :3000"
    read -p "是否继续启动? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动开发服务器
echo ""
echo "🎯 启动 Browser-Use JS 演示界面..."
echo "   访问地址: http://localhost:3000"
echo "   按 Ctrl+C 停止服务器"
echo ""

# 等待一下让用户看到信息
sleep 2

# 启动服务器
pnpm dev
