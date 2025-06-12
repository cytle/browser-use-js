/**
 * @file purpose: 动作注册系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ActionRegistry } from './action-registry';
import type { ActionParams, ActionResult } from '../../types';

describe('ActionRegistry', () => {
  let registry: ActionRegistry;

  beforeEach(() => {
    registry = new ActionRegistry();
  });

  describe('基础功能', () => {
    it('应该能够注册动作', () => {
      const handler = async (): Promise<ActionResult> => ({ success: true });

      registry.register('test-action', handler, 'Test action');

      expect(registry.hasAction('test-action')).toBe(true);
      expect(registry.size()).toBe(1);
    });

    it('应该能够执行已注册的动作', async () => {
      const handler = async (): Promise<ActionResult> => ({
        success: true,
        extractedContent: 'test result',
      });

      registry.register('test-action', handler);

      const result = await registry.execute('test-action', {} as ActionParams);

      expect(result.success).toBe(true);
      expect(result.extractedContent).toBe('test result');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('应该在执行不存在的动作时返回错误', async () => {
      const result = await registry.execute('non-existent', {} as ActionParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not registered');
    });

    it('应该能够注销动作', () => {
      const handler = async (): Promise<ActionResult> => ({ success: true });

      registry.register('test-action', handler);
      expect(registry.hasAction('test-action')).toBe(true);

      const removed = registry.unregister('test-action');
      expect(removed).toBe(true);
      expect(registry.hasAction('test-action')).toBe(false);
    });
  });

  describe('统计功能', () => {
    it('应该正确记录执行统计', async () => {
      const handler = async (): Promise<ActionResult> => ({ success: true });

      registry.register('test-action', handler);

      await registry.execute('test-action', {} as ActionParams);
      await registry.execute('test-action', {} as ActionParams);

      const stats = registry.getActionStats('test-action');
      expect(stats?.totalExecutions).toBe(2);
      expect(stats?.successCount).toBe(2);
      expect(stats?.failureCount).toBe(0);
    });

    it('应该正确记录失败统计', async () => {
      const handler = async (): Promise<ActionResult> => {
        throw new Error('Test error');
      };

      registry.register('test-action', handler);

      const result = await registry.execute('test-action', {} as ActionParams);

      expect(result.success).toBe(false);

      const stats = registry.getActionStats('test-action');
      expect(stats?.totalExecutions).toBe(1);
      expect(stats?.successCount).toBe(0);
      expect(stats?.failureCount).toBe(1);
    });
  });

  describe('验证功能', () => {
    it('应该能够设置和使用参数验证器', async () => {
      const handler = async (): Promise<ActionResult> => ({ success: true });
      const validator = (params: ActionParams): boolean => {
        return 'required' in params;
      };

      registry.register('test-action', handler);
      registry.setValidator('test-action', validator);

      // 有效参数
      const validResult = await registry.execute('test-action', {
        required: 'value',
      } as unknown as ActionParams);
      expect(validResult.success).toBe(true);

      // 无效参数
      const invalidResult = await registry.execute(
        'test-action',
        {} as ActionParams
      );
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('Invalid parameters');
    });
  });

  describe('工具方法', () => {
    it('应该能够列出所有动作', () => {
      const handler = async (): Promise<ActionResult> => ({ success: true });

      registry.register('action1', handler);
      registry.register('action2', handler);

      const actions = registry.listActions();
      expect(actions).toContain('action1');
      expect(actions).toContain('action2');
      expect(actions.length).toBe(2);
    });

    it('应该能够清空所有动作', () => {
      const handler = async (): Promise<ActionResult> => ({ success: true });

      registry.register('action1', handler);
      registry.register('action2', handler);

      expect(registry.size()).toBe(2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.listActions().length).toBe(0);
    });
  });
});
