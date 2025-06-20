/**
 * Browser-Use JS 代理记忆管理服务
 *
 * 源文件: browser_use/agent/memory/service.py
 * 功能描述: 代理记忆存储、检索和管理服务
 */

import { logger } from '../../logging.js';
import { MessageManager } from '../message-manager/service.js';

/**
 * 记忆项接口
 */
export interface MemoryItem {
  id: string;
  content: string;
  timestamp: number;
  type: 'observation' | 'action' | 'thought' | 'result';
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * 记忆检索选项
 */
export interface MemoryRetrievalOptions {
  limit?: number;
  type?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  similarity?: {
    query: string;
    threshold?: number;
  };
}

/**
 * 记忆管理服务
 */
export class Memory {
  private memories: Map<string, MemoryItem> = new Map();
  private maxMemories: number;
  private compressionThreshold: number;
  private messageManager: MessageManager;
  private llm: any;

  constructor(
    messageManager: MessageManager,
    llm: any,
    maxMemories: number = 1000,
    compressionThreshold: number = 800
  ) {
    this.messageManager = messageManager;
    this.llm = llm;
    this.maxMemories = maxMemories;
    this.compressionThreshold = compressionThreshold;
  }

  /**
   * 添加记忆
   */
  async addMemory(
    memory: Omit<MemoryItem, 'id' | 'timestamp'>
  ): Promise<string> {
    const id = this.generateMemoryId();
    const memoryItem: MemoryItem = {
      ...memory,
      id,
      timestamp: Date.now(),
    };

    this.memories.set(id, memoryItem);

    logger.debug(`Added memory: ${id} (${memory.type})`);

    // 检查是否需要压缩
    if (this.memories.size > this.compressionThreshold) {
      await this.compressMemories();
    }

    return id;
  }

  /**
   * 获取记忆
   */
  getMemory(id: string): MemoryItem | null {
    return this.memories.get(id) || null;
  }

  /**
   * 检索记忆
   */
  async retrieveMemories(
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryItem[]> {
    let results = Array.from(this.memories.values());

    // 按类型过滤
    if (options.type) {
      results = results.filter(memory => memory.type === options.type);
    }

    // 按时间范围过滤
    if (options.timeRange) {
      results = results.filter(
        memory =>
          memory.timestamp >= options.timeRange!.start &&
          memory.timestamp <= options.timeRange!.end
      );
    }

    // 相似性搜索
    if (options.similarity) {
      results = await this.searchBySimilarity(
        results,
        options.similarity.query,
        options.similarity.threshold
      );
    }

    // 按时间戳降序排序
    results.sort((a, b) => b.timestamp - a.timestamp);

    // 限制结果数量
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    logger.debug(`Retrieved ${results.length} memories`);
    return results;
  }

  /**
   * 删除记忆
   */
  deleteMemory(id: string): boolean {
    const deleted = this.memories.delete(id);
    if (deleted) {
      logger.debug(`Deleted memory: ${id}`);
    }
    return deleted;
  }

  /**
   * 清空所有记忆
   */
  clearMemories(): void {
    this.memories.clear();
    logger.info('Cleared all memories');
  }

  /**
   * 获取记忆统计信息
   */
  getMemoryStats(): {
    total: number;
    byType: Record<string, number>;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    const memories = Array.from(this.memories.values());
    const byType: Record<string, number> = {};

    memories.forEach(memory => {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    });

    const timestamps = memories.map(m => m.timestamp);

    return {
      total: memories.length,
      byType,
      oldestTimestamp: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestTimestamp: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }

  /**
   * 获取上下文记忆
   */
  async getContextMemories(maxTokens: number = 4000): Promise<MemoryItem[]> {
    const recentMemories = await this.retrieveMemories({
      limit: 50,
    });

    // 简单的令牌计算（每个字符约0.75个令牌）
    let tokenCount = 0;
    const contextMemories: MemoryItem[] = [];

    for (const memory of recentMemories) {
      const memoryTokens = Math.ceil(memory.content.length * 0.75);
      if (tokenCount + memoryTokens > maxTokens) {
        break;
      }
      contextMemories.push(memory);
      tokenCount += memoryTokens;
    }

    logger.debug(
      `Selected ${contextMemories.length} memories for context (${tokenCount} tokens)`
    );
    return contextMemories;
  }

  /**
   * 压缩记忆
   */
  private async compressMemories(): Promise<void> {
    if (this.memories.size <= this.maxMemories) {
      return;
    }

    logger.info(
      `Compressing memories from ${this.memories.size} to ${this.maxMemories}`
    );

    // 获取所有记忆并按时间排序
    const allMemories = Array.from(this.memories.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // 保留最新的记忆
    const keepMemories = allMemories.slice(0, this.maxMemories);
    const removeMemories = allMemories.slice(this.maxMemories);

    // 重建记忆映射
    this.memories.clear();
    keepMemories.forEach(memory => {
      this.memories.set(memory.id, memory);
    });

    logger.info(
      `Removed ${removeMemories.length} old memories during compression`
    );
  }

  /**
   * 相似性搜索
   */
  private async searchBySimilarity(
    memories: MemoryItem[],
    query: string,
    threshold: number = 0.7
  ): Promise<MemoryItem[]> {
    // 简单的文本相似性搜索实现
    // 在实际应用中，可以使用向量嵌入和语义搜索

    const queryLower = query.toLowerCase();
    const results: Array<{ memory: MemoryItem; score: number }> = [];

    memories.forEach(memory => {
      const contentLower = memory.content.toLowerCase();

      // 简单的关键词匹配评分
      let score = 0;
      const queryWords = queryLower.split(/\s+/);
      const contentWords = contentLower.split(/\s+/);

      queryWords.forEach(queryWord => {
        contentWords.forEach(contentWord => {
          if (
            contentWord.includes(queryWord) ||
            queryWord.includes(contentWord)
          ) {
            score += 0.1;
          }
          if (contentWord === queryWord) {
            score += 0.5;
          }
        });
      });

      // 标准化评分
      score = Math.min(score / queryWords.length, 1.0);

      if (score >= threshold) {
        results.push({ memory, score });
      }
    });

    // 按评分降序排序
    results.sort((a, b) => b.score - a.score);

    return results.map(result => result.memory);
  }

  /**
   * 生成记忆ID
   */
  private generateMemoryId(): string {
    return `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出记忆
   */
  exportMemories(): MemoryItem[] {
    return Array.from(this.memories.values());
  }

  /**
   * 导入记忆
   */
  importMemories(memories: MemoryItem[]): void {
    this.memories.clear();
    memories.forEach(memory => {
      this.memories.set(memory.id, memory);
    });
    logger.info(`Imported ${memories.length} memories`);
  }

  /**
   * 获取相关记忆
   */
  async getRelevantMemories(
    context: string,
    maxMemories: number = 10
  ): Promise<MemoryItem[]> {
    return await this.retrieveMemories({
      limit: maxMemories,
      similarity: {
        query: context,
        threshold: 0.5,
      },
    });
  }

  /**
   * 添加观察记忆
   */
  async addObservation(
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.addMemory({
      content,
      type: 'observation',
      metadata,
    });
  }

  /**
   * 添加动作记忆
   */
  async addAction(
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.addMemory({
      content,
      type: 'action',
      metadata,
    });
  }

  /**
   * 添加思考记忆
   */
  async addThought(
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.addMemory({
      content,
      type: 'thought',
      metadata,
    });
  }

  /**
   * 添加结果记忆
   */
  async addResult(
    content: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return await this.addMemory({
      content,
      type: 'result',
      metadata,
    });
  }
}
