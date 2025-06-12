/**
 * @file purpose: 测试状态管理 Store (使用 Zustand)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface TestState {
  isInitialized: boolean;
  performanceMonitoring: boolean;
  logs: LogEntry[];
}

export interface TestActions {
  addLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
  setInitialized: (isInitialized: boolean) => void;
  setPerformanceMonitoring: (performanceMonitoring: boolean) => void;
}

export type TestStore = TestState & TestActions;

export const useTestState = create<TestStore>()(
  devtools(
    set => ({
      // 初始状态
      isInitialized: false,
      performanceMonitoring: false,
      logs: [],

      // Actions
      addLog: (message: string, type: LogEntry['type'] = 'info') => {
        const logEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          message,
          type,
        };

        set(
          (state: TestState) => ({
            logs: [...state.logs, logEntry],
          }),
          false,
          'addLog'
        );
      },

      clearLogs: () => {
        set({ logs: [] }, false, 'clearLogs');
      },

      setInitialized: (isInitialized: boolean) => {
        set({ isInitialized }, false, 'setInitialized');
      },

      setPerformanceMonitoring: (performanceMonitoring: boolean) => {
        set({ performanceMonitoring }, false, 'setPerformanceMonitoring');
      },
    }),
    {
      name: 'test-state', // 用于 Redux DevTools
    }
  )
);
