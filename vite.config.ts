import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 在 ES 模块中获取 __dirname 的等价物
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true,
  },

  // 构建配置
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['typescript'],
        },
      },
    },
    // 构建优化
    chunkSizeWarningLimit: 1000,
  },

  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@agent': resolve(__dirname, 'src/agent'),
      '@browser': resolve(__dirname, 'src/browser'),
      '@controller': resolve(__dirname, 'src/controller'),
      '@dom': resolve(__dirname, 'src/dom'),
      '@types': resolve(__dirname, 'src/types'),
    },
  },

  // 优化配置
  optimizeDeps: {
    include: ['typescript'],
  },

  // 环境变量
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
