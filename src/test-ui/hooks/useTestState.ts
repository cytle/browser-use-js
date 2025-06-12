/**
 * @file purpose: 测试状态管理 Hook
 */

import { useState, useCallback } from 'react';

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

export function useTestState() {
  const [state, setState] = useState<TestState>({
    isInitialized: false,
    performanceMonitoring: false,
    logs: [],
  });

  const addLog = useCallback(
    (message: string, type: LogEntry['type'] = 'info') => {
      const logEntry: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      };

      setState(prev => ({
        ...prev,
        logs: [...prev.logs, logEntry],
      }));
    },
    []
  );

  const clearLogs = useCallback(() => {
    setState(prev => ({
      ...prev,
      logs: [],
    }));
  }, []);

  const setInitialized = useCallback((isInitialized: boolean) => {
    setState(prev => ({
      ...prev,
      isInitialized,
    }));
  }, []);

  const setPerformanceMonitoring = useCallback(
    (performanceMonitoring: boolean) => {
      setState(prev => ({
        ...prev,
        performanceMonitoring,
      }));
    },
    []
  );

  return {
    ...state,
    addLog,
    clearLogs,
    setInitialized,
    setPerformanceMonitoring,
  };
}
