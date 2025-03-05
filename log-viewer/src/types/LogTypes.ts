export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  details?: Record<string, any>;
}

export interface LogModule {
  name: string;
  entries: LogEntry[];
  stats: {
    info: number;
    warn: number;
    error: number;
    debug: number;
  };
} 