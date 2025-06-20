/**
 * Vitest 测试设置文件
 */

import { beforeAll, afterEach, afterAll } from 'vitest';

// 全局测试设置
beforeAll(() => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
});

// 每个测试后清理
afterEach(() => {
  // 清理测试环境变量
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('TEST_')) {
      delete process.env[key];
    }
  });
});

// 所有测试结束后清理
afterAll(() => {
  // 最终清理
});
