/**
 * @file purpose: 交互控制器单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionController } from './interaction-controller';
import { MouseButton } from '../types';

// Mock DOM APIs
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    cursor: 'pointer',
    display: 'block',
    visibility: 'visible',
    opacity: '1',
  }),
});

// Mock element methods
const mockElement = {
  tagName: 'BUTTON',
  id: 'test-button',
  className: 'btn primary',
  textContent: 'Click me',
  attributes: [],
  getBoundingClientRect: () => ({
    left: 100,
    top: 100,
    width: 80,
    height: 30,
    right: 180,
    bottom: 130,
  }),
  scrollIntoView: vi.fn(),
  dispatchEvent: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  hasAttribute: vi.fn(() => false),
  getAttribute: vi.fn(() => null),
  select: vi.fn(),
  value: '',
} as any;

// Mock document.querySelector
Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => mockElement),
});

describe('InteractionController', () => {
  let controller: InteractionController;

  beforeEach(() => {
    controller = new InteractionController({
      debug: true,
      defaultClickDelay: 0,
      defaultTypeDelay: 0,
    });
    vi.clearAllMocks();
  });

  describe('click', () => {
    it('should click element by selector', async () => {
      const result = await controller.click('#test-button');

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
      expect(mockElement.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
        })
      );
    });

    it('should handle element not found', async () => {
      (document.querySelector as any).mockReturnValueOnce(null);

      const result = await controller.click('#non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Element not found');
    });
  });

  describe('focus and blur', () => {
    it('should focus element', async () => {
      const result = await controller.focus('#test-element');

      expect(result.success).toBe(true);
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should blur element', async () => {
      const result = await controller.blur('#test-element');

      expect(result.success).toBe(true);
      expect(mockElement.blur).toHaveBeenCalled();
    });
  });

  describe('iframe operations', () => {
    it('should set active iframe', () => {
      controller.setActiveIframe('iframe-1');
      expect(controller.getActiveIframe()).toBe('iframe-1');
    });

    it('should clear active iframe', () => {
      controller.setActiveIframe('iframe-1');
      controller.setActiveIframe(null);
      expect(controller.getActiveIframe()).toBeUndefined();
    });
  });

  describe('utility methods', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await controller.delay(50);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(45);
    });
  });

  describe('cleanup', () => {
    it('should destroy controller properly', () => {
      expect(() => controller.destroy()).not.toThrow();
    });
  });
});
