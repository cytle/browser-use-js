/**
 * @file purpose: 控制器模块入口测试
 *
 * 测试控制器模块的导出和基本功能
 */

import { describe, it, expect } from 'vitest';
import {
  ActionRegistry,
  actionRegistry,
  action,
  controller,
  registerActions,
  createValidator,
  CONTROLLER_MODULE_VERSION,
} from './index';

describe('控制器模块', () => {
  describe('模块导出', () => {
    it('应该导出所有必要的类和函数', () => {
      expect(ActionRegistry).toBeDefined();
      expect(actionRegistry).toBeDefined();
      expect(action).toBeDefined();
      expect(controller).toBeDefined();
      expect(registerActions).toBeDefined();
      expect(createValidator).toBeDefined();
    });

    it('应该导出正确的版本信息', () => {
      expect(CONTROLLER_MODULE_VERSION).toBe('0.1.0');
      expect(typeof CONTROLLER_MODULE_VERSION).toBe('string');
    });
  });

  describe('ActionRegistry 类', () => {
    it('应该能够创建 ActionRegistry 实例', () => {
      const registry = new ActionRegistry();
      expect(registry).toBeInstanceOf(ActionRegistry);
    });
  });

  describe('全局实例', () => {
    it('actionRegistry 应该是 ActionRegistry 的实例', () => {
      expect(actionRegistry).toBeInstanceOf(ActionRegistry);
    });

    it('controller 应该是装饰器函数', () => {
      expect(controller).toBeDefined();
      expect(typeof controller).toBe('function');
    });
  });

  describe('装饰器函数', () => {
    it('action 装饰器应该是函数', () => {
      expect(typeof action).toBe('function');
    });

    it('应该能够使用 action 装饰器', () => {
      const testAction = action('测试动作');
      expect(typeof testAction).toBe('function');
    });
  });

  describe('工具函数', () => {
    it('registerActions 应该是函数', () => {
      expect(typeof registerActions).toBe('function');
    });

    it('createValidator 应该是函数', () => {
      expect(typeof createValidator).toBe('function');
    });

    it('createValidator 应该能够创建验证器', () => {
      const validator = createValidator({
        name: 'string',
        age: 'number',
      });

      expect(typeof validator).toBe('function');
    });
  });

  describe('模块集成', () => {
    it('应该能够注册和执行简单动作', async () => {
      const testRegistry = new ActionRegistry();

      // 注册测试动作
      testRegistry.register('test-action', async () => {
        return {
          success: true,
          extractedContent: { message: 'Test successful' },
          includeInMemory: true,
        };
      });

      // 执行动作
      const result = await testRegistry.execute('test-action', {} as any);

      expect(result.success).toBe(true);
      expect(result.extractedContent).toEqual({ message: 'Test successful' });
    });

    it('应该能够获取动作列表', () => {
      const testRegistry = new ActionRegistry();

      testRegistry.register('action1', async () => ({ success: true }));
      testRegistry.register('action2', async () => ({ success: true }));

      const actions = testRegistry.getActions();

      expect(typeof actions).toBe('object');
      expect(actions).not.toBeNull();
      expect(Object.keys(actions).length).toBeGreaterThanOrEqual(2);
    });
  });
});
