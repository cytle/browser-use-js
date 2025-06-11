/**
 * @file purpose: 类型定义系统测试
 *
 * 测试所有核心类型定义的正确性和完整性
 */

import { describe, it, expect } from 'vitest';
import type {
  Result,
  BaseConfig,
  Point,
  Rectangle,
  ActionResult,
} from '../types';
import { AgentStatus, ActionType, LLMModelType } from '../types';

describe('类型定义系统测试', () => {
  describe('基础类型', () => {
    it('Result 类型应该正确工作', () => {
      const successResult: Result<string> = {
        success: true,
        data: 'test data',
      };

      const errorResult: Result<string> = {
        success: false,
        error: new Error('test error'),
      };

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBe('test data');
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBeInstanceOf(Error);
    });

    it('Point 和 Rectangle 类型应该正确工作', () => {
      const point: Point = { x: 10, y: 20 };
      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 200 };

      expect(point.x).toBe(10);
      expect(point.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(200);
    });

    it('BaseConfig 类型应该正确工作', () => {
      const config: BaseConfig = {
        debug: true,
        timeout: 5000,
      };

      expect(config.debug).toBe(true);
      expect(config.timeout).toBe(5000);
    });
  });

  describe('动作系统类型', () => {
    it('ActionResult 类型应该正确工作', () => {
      const result: ActionResult = {
        success: true,
        extractedContent: { text: 'extracted text' },
        includeInMemory: true,
        duration: 150,
        metadata: { timestamp: Date.now() },
      };

      expect(result.success).toBe(true);
      expect(result.includeInMemory).toBe(true);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('枚举类型', () => {
    it('所有枚举应该有正确的值', () => {
      expect(AgentStatus.IDLE).toBe('idle');
      expect(AgentStatus.THINKING).toBe('thinking');
      expect(AgentStatus.ACTING).toBe('acting');
      expect(AgentStatus.COMPLETED).toBe('completed');
      expect(AgentStatus.ERROR).toBe('error');

      expect(ActionType.CLICK).toBe('click');
      expect(ActionType.TYPE).toBe('type');
      expect(ActionType.SCROLL).toBe('scroll');
      expect(ActionType.NAVIGATE).toBe('navigate');

      expect(LLMModelType.GPT_4O).toBe('gpt-4o');
      expect(LLMModelType.CLAUDE_3_5_SONNET).toBe('claude-3-5-sonnet-20241022');
    });
  });
});
