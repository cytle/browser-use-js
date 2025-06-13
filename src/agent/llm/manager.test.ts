/**
 * @file purpose: LLM 集成接口测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMManager } from './index';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

// Mock AI SDK
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => ({ modelId: 'gpt-4o' })),
  createOpenAI: vi.fn(() => vi.fn()),
}));

vi.mock('ai', () => ({
  generateText: vi.fn(),
  streamText: vi.fn(),
}));

describe('LLM 集成接口', () => {
  describe('LLMManager', () => {
    let manager: LLMManager;

    beforeEach(() => {
      manager = new LLMManager();
    });

    it('应该能够注册和获取客户端', () => {
      const client = openai('gpt-4o');
      manager.registerClient('test-client', client);

      const retrievedClient = manager.getClient('test-client');
      expect(retrievedClient).toBe(client);
    });

    it('应该能够移除客户端', () => {
      const client = openai('gpt-4o');
      manager.registerClient('test-client', client);

      const removed = manager.unregisterClient('test-client');
      expect(removed).toBe(true);

      const retrievedClient = manager.getClient('test-client');
      expect(retrievedClient).toBeNull();
    });

    it('应该返回所有客户端名称', () => {
      const client1 = openai('gpt-4o');
      const client2 = openai('gpt-4o');

      manager.registerClient('client1', client1);
      manager.registerClient('client2', client2);

      const names = manager.getClientNames();
      expect(names).toEqual(['client1', 'client2']);
    });
  });

  describe('AI SDK 集成', () => {
    it('应该能够使用 generateText', async () => {
      // 使用 any 类型避免复杂的类型匹配
      vi.mocked(generateText).mockResolvedValue({
        text: 'Hello, world!',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      } as any);

      const model = openai('gpt-4o');
      const result = await generateText({
        model,
        prompt: 'Hello',
      });

      expect(result.text).toBe('Hello, world!');
      expect(result.usage?.totalTokens).toBe(15);
    });
  });
});
