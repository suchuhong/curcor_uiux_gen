export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  details?: Record<string, any>;
  _detailsOpen?: boolean; // 用于UI状态，不是实际数据
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

// 日志解析结构接口
export interface LogParseStructure {
  id: string;
  name: string;
  description: string;
  type: 'regex' | 'json' | 'custom';
  // 用于正则匹配的结构
  regexPattern?: string;
  // 正则匹配分组映射到日志字段
  fieldMappings?: {
    timestamp?: number; // 正则匹配分组索引
    level?: number;
    module?: number;
    message?: number;
    details?: number;
  };
  // JSON格式日志特定的映射
  jsonFieldMappings?: {
    timestamp?: string; // JSON对象中的字段名
    level?: string;
    module?: string;
    message?: string;
    details?: string;
  };
  // 用于转换不同日志级别到标准级别
  levelMapping?: Record<string, LogEntry['level']>;
  // 用于解析其他特殊格式的自定义函数
  customParser?: (line: string) => Partial<LogEntry> | null;
  // 确定一行是否匹配此结构的函数
  matchTest?: (line: string) => boolean;
}

export interface ParseResult {
  success: boolean;
  entries: LogEntry[];
  failedLines: number;
  totalLines: number;
  usedStructure?: LogParseStructure;
} 