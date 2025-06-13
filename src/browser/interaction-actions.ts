/**
 * @file purpose: 交互控制器动作注册
 *
 * 这个模块将交互控制器的功能注册为可执行的动作，
 * 让 AI 代理能够通过动作系统调用交互功能。
 */

import type {
  IActionRegistry,
  ActionResult,
  ClickActionParams,
  TypeActionParams,
  ScrollActionParams,
  ElementSelector,
} from '../types';
import { ActionType } from '../types';
import { InteractionController } from './interaction-controller';
import { MessageBridge } from '../iframe/bridge';

/**
 * 注册交互控制器相关的动作
 * @param registry - 动作注册表
 * @param messageBridge - 消息桥接器（可选，用于 Iframe 操作）
 */
export function registerInteractionActions(
  registry: IActionRegistry,
  messageBridge?: MessageBridge
): void {
  const interactionController = new InteractionController({}, messageBridge);

  // 注册点击动作
  registry.register<ClickActionParams>(
    'click_element',
    async (params: ClickActionParams): Promise<ActionResult> => {
      try {
        const result = await interactionController.click(
          params.selector,
          params.options
        );

        return {
          success: result.success,
          error: result.error,
          extractedContent: result.extractedContent,
          includeInMemory: result.includeInMemory || true,
          duration: result.duration,
          metadata: {
            action: 'click',
            selector: params.selector,
            options: params.options,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true,
          metadata: {
            action: 'click',
            selector: params.selector,
          },
        };
      }
    },
    '点击页面元素，支持各种点击选项和修饰键'
  );

  // 注册文本输入动作
  registry.register<TypeActionParams>(
    'type_text',
    async (params: TypeActionParams): Promise<ActionResult> => {
      try {
        const result = await interactionController.type(
          params.selector,
          params.text,
          params.options
        );

        return {
          success: result.success,
          error: result.error,
          extractedContent: result.extractedContent,
          includeInMemory: result.includeInMemory || true,
          duration: result.duration,
          metadata: {
            action: 'type',
            selector: params.selector,
            text: params.text,
            options: params.options,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true,
          metadata: {
            action: 'type',
            selector: params.selector,
            text: params.text,
          },
        };
      }
    },
    '在输入元素中输入文本，支持逐字符输入和各种输入选项'
  );

  // 注册滚动动作
  registry.register<ScrollActionParams>(
    'scroll_page',
    async (params: ScrollActionParams): Promise<ActionResult> => {
      try {
        const result = await interactionController.scroll(
          params.target,
          params.selector,
          params.options
        );

        return {
          success: result.success,
          error: result.error,
          extractedContent: result.extractedContent,
          includeInMemory: result.includeInMemory || true,
          duration: result.duration,
          metadata: {
            action: 'scroll',
            target: params.target,
            selector: params.selector,
            options: params.options,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true,
          metadata: {
            action: 'scroll',
            target: params.target,
            selector: params.selector,
          },
        };
      }
    },
    '滚动页面或指定元素，支持平滑滚动和精确定位'
  );

  // 注册聚焦动作
  registry.register(
    'focus_element',
    async (params: any): Promise<ActionResult> => {
      try {
        const result = await interactionController.focus(params.selector);

        return {
          success: result.success,
          error: result.error,
          includeInMemory: true,
          duration: result.duration,
          metadata: {
            action: 'focus',
            selector: params.selector,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true,
          metadata: {
            action: 'focus',
            selector: params.selector,
          },
        };
      }
    },
    '聚焦指定元素，使其获得键盘焦点'
  );

  // 注册失焦动作
  registry.register(
    'blur_element',
    async (params: any): Promise<ActionResult> => {
      try {
        const result = await interactionController.blur(params.selector);

        return {
          success: result.success,
          error: result.error,
          includeInMemory: true,
          duration: result.duration,
          metadata: {
            action: 'blur',
            selector: params.selector,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true,
          metadata: {
            action: 'blur',
            selector: params.selector,
          },
        };
      }
    },
    '使指定元素失去焦点'
  );

  // 注册等待动作
  registry.register(
    'wait_delay',
    async (params: any): Promise<ActionResult> => {
      try {
        await interactionController.delay(params.delay);

        return {
          success: true,
          includeInMemory: false,
          duration: params.delay,
          metadata: {
            action: 'wait',
            delay: params.delay,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: false,
          metadata: {
            action: 'wait',
            delay: params.delay,
          },
        };
      }
    },
    '等待指定的时间（毫秒）'
  );

  // 注册设置活动 Iframe 动作
  registry.register(
    'set_active_iframe',
    async (params: any): Promise<ActionResult> => {
      try {
        interactionController.setActiveIframe(params.iframeId);

        return {
          success: true,
          includeInMemory: true,
          metadata: {
            action: 'set_active_iframe',
            iframeId: params.iframeId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: true,
          metadata: {
            action: 'set_active_iframe',
            iframeId: params.iframeId,
          },
        };
      }
    },
    '设置活动的 Iframe，后续操作将在指定的 Iframe 中执行'
  );

  // 注册获取活动 Iframe 动作
  registry.register(
    'get_active_iframe',
    async (): Promise<ActionResult> => {
      try {
        const activeIframeId = interactionController.getActiveIframe();

        return {
          success: true,
          extractedContent: activeIframeId,
          includeInMemory: false,
          metadata: {
            action: 'get_active_iframe',
            activeIframeId,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          includeInMemory: false,
          metadata: {
            action: 'get_active_iframe',
          },
        };
      }
    },
    '获取当前活动的 Iframe ID'
  );
}

/**
 * 创建带有交互动作的动作注册表
 * @param registry - 动作注册表
 * @param messageBridge - 消息桥接器（可选）
 * @returns 配置好的动作注册表
 */
export function createInteractionRegistry(
  registry: IActionRegistry,
  messageBridge?: MessageBridge
): IActionRegistry {
  registerInteractionActions(registry, messageBridge);
  return registry;
}

/**
 * 默认导出
 */
export default registerInteractionActions;
