/**
 * Utils 模块单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  SignalHandler,
  singleton,
  checkEnvVariables,
  isUnsafePattern,
  matchUrlWithDomainPattern,
  mergeDicts,
  LLMException,
  getBrowserUseVersion,
  logPrettyPath,
  logPrettyUrl,
  BROWSER_USE_CONFIG_DIR,
} from './utils';

describe('Utils Module', () => {
  describe('SignalHandler', () => {
    it('should create SignalHandler instance', () => {
      const handler = new SignalHandler();
      expect(handler).toBeInstanceOf(SignalHandler);
    });

    it('should register and unregister handlers', () => {
      const handler = new SignalHandler();
      expect(() => handler.register()).not.toThrow();
      expect(() => handler.unregister()).not.toThrow();
    });
  });

  describe('singleton decorator', () => {
    it('should return same instance for multiple calls', () => {
      @singleton
      class TestClass {
        public value: number = Math.random();
      }

      const instance1 = new TestClass();
      const instance2 = new TestClass();

      expect(instance1.value).toBe(instance2.value);
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkEnvVariables', () => {
    it('should check environment variables existence', () => {
      // 设置测试环境变量
      process.env.TEST_VAR_1 = 'value1';
      process.env.TEST_VAR_2 = 'value2';

      expect(checkEnvVariables(['TEST_VAR_1', 'TEST_VAR_2'], 'all')).toBe(true);
      expect(checkEnvVariables(['TEST_VAR_1', 'NONEXISTENT'], 'all')).toBe(
        false
      );
      expect(checkEnvVariables(['TEST_VAR_1', 'NONEXISTENT'], 'any')).toBe(
        true
      );

      // 清理
      delete process.env.TEST_VAR_1;
      delete process.env.TEST_VAR_2;
    });
  });

  describe('isUnsafePattern', () => {
    it('should detect unsafe domain patterns', () => {
      expect(isUnsafePattern('*.google.com')).toBe(false);
      expect(isUnsafePattern('google.com')).toBe(false);
      expect(isUnsafePattern('*google*')).toBe(true);
      expect(isUnsafePattern('test*.example.*')).toBe(false);
      expect(isUnsafePattern('test*example')).toBe(true);
    });
  });

  describe('matchUrlWithDomainPattern', () => {
    it('should match URLs with domain patterns correctly', () => {
      // 精确匹配
      expect(
        matchUrlWithDomainPattern('https://google.com', 'google.com')
      ).toBe(true);
      expect(matchUrlWithDomainPattern('http://google.com', 'google.com')).toBe(
        false
      ); // 默认只匹配 https

      // 通配符匹配
      expect(
        matchUrlWithDomainPattern('https://sub.google.com', '*.google.com')
      ).toBe(true);
      expect(
        matchUrlWithDomainPattern('https://google.com', '*.google.com')
      ).toBe(true);

      // 不匹配情况
      expect(
        matchUrlWithDomainPattern('https://example.com', 'google.com')
      ).toBe(false);
      expect(matchUrlWithDomainPattern('about:blank', 'google.com')).toBe(
        false
      );
    });

    it('should handle protocol matching', () => {
      expect(
        matchUrlWithDomainPattern('http://google.com', 'http://google.com')
      ).toBe(true);
      expect(
        matchUrlWithDomainPattern('https://google.com', 'http*://google.com')
      ).toBe(true);
      expect(
        matchUrlWithDomainPattern(
          'chrome-extension://test',
          'chrome-extension://*'
        )
      ).toBe(true);
    });
  });

  describe('mergeDicts', () => {
    it('should merge dictionaries correctly', () => {
      const a = { x: 1, y: { a: 1 } };
      const b = { y: { b: 2 }, z: 3 };
      const result = mergeDicts(a, b);

      expect(result).toEqual({
        x: 1,
        y: { a: 1, b: 2 },
        z: 3,
      });
    });

    it('should merge arrays', () => {
      const a = { items: [1, 2] };
      const b = { items: [3, 4] };
      const result = mergeDicts(a, b);

      expect(result.items).toEqual([1, 2, 3, 4]);
    });

    it('should throw on conflicts', () => {
      const a = { x: 1 };
      const b = { x: 2 };

      expect(() => mergeDicts(a, b)).toThrow('Conflict at x');
    });
  });

  describe('LLMException', () => {
    it('should create LLM exception with code and message', () => {
      const exception = new LLMException(401, 'Test error');

      expect(exception.code).toBe(401);
      expect(exception.message).toBe('Test error');
      expect(exception.name).toBe('LLMException');
      expect(exception).toBeInstanceOf(Error);
    });
  });

  describe('getBrowserUseVersion', () => {
    it('should return a version string', () => {
      const version = getBrowserUseVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });
  });

  describe('logPrettyPath', () => {
    it('should format paths nicely', () => {
      expect(logPrettyPath('')).toBe('');
      expect(logPrettyPath(null)).toBe('');
      expect(logPrettyPath(undefined)).toBe('');

      // 测试 home 目录替换 - 先检查 home 目录，如果当前目录在 home 目录下会优先匹配 home
      const homePath = process.env.HOME || process.env.USERPROFILE || '';
      if (homePath && process.cwd().startsWith(homePath)) {
        // 当前目录在 home 目录下，会匹配 home 目录
        expect(logPrettyPath(`${process.cwd()}/test`)).toContain('~/');
      } else {
        // 测试当前目录替换
        expect(logPrettyPath(`${process.cwd()}/test`)).toBe('./test');
      }

      // 测试空格引号包围
      expect(logPrettyPath('/path with spaces')).toBe('"/path with spaces"');
    });
  });

  describe('logPrettyUrl', () => {
    it('should format URLs nicely', () => {
      expect(logPrettyUrl('https://www.google.com')).toBe('google.com');
      expect(logPrettyUrl('http://example.com')).toBe('example.com');

      // 测试长 URL 截断 - 使用准确的字符数计算
      const longUrl = 'https://very-long-domain-name.example.com';
      const expectedLength = 22;
      const processed = longUrl
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');
      const expected =
        processed.length > expectedLength
          ? processed.slice(0, expectedLength) + '…'
          : processed;
      expect(logPrettyUrl(longUrl)).toBe(expected);
    });
  });

  describe('BROWSER_USE_CONFIG_DIR', () => {
    it('should be a valid path string', () => {
      expect(typeof BROWSER_USE_CONFIG_DIR).toBe('string');
      expect(BROWSER_USE_CONFIG_DIR).toContain('.config');
      expect(BROWSER_USE_CONFIG_DIR).toContain('browseruse');
    });
  });
});
