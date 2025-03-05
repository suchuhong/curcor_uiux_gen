import { LogEntry, LogModule } from '../types/LogTypes';

// 用于分批处理大文件的工具函数
export const parseLogFileInChunks = async (
  content: string,
  chunkSize = 1000,
  onProgress?: (progress: number) => void
): Promise<LogEntry[]> => {
  return new Promise((resolve) => {
    const lines = content.split('\n').filter(line => line.trim());
    const totalLines = lines.length;
    const result: LogEntry[] = [];
    let processedLines = 0;

    // 使用setTimeout进行分批处理，避免阻塞UI
    const processChunk = () => {
      const chunk = lines.slice(processedLines, processedLines + chunkSize);
      const parsedChunk = chunk.map(line => parseSingleLogLine(line));
      result.push(...parsedChunk);
      
      processedLines += chunk.length;
      const progress = Math.floor((processedLines / totalLines) * 100);
      
      if (onProgress) {
        onProgress(progress);
      }

      if (processedLines < totalLines) {
        setTimeout(processChunk, 0);
      } else {
        resolve(result);
      }
    };

    processChunk();
  });
};

// 解析单行日志的函数，从原始函数提取出来便于重用
export const parseSingleLogLine = (line: string): LogEntry => {
  try {
    // 假设日志格式为 JSON
    const entry = JSON.parse(line);
    return {
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level || 'info',
      module: entry.module || 'unknown',
      message: entry.message || line,
      details: entry.details || {}
    };
  } catch {
    // 扩展正则表达式以匹配更多格式
    const standardRegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\s+\[(\w+)\]\s+(\w+)\s+-\s+(.*)/;
    const alternativeRegex = /(\d{4}[-\/]\d{2}[-\/]\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?)\s+\[?(\w+)\]?\s+\[?(\w+)[:-]?\s*(.*)/;
    
    let match = line.match(standardRegex);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2].toLowerCase() as LogEntry['level'],
        module: match[3],
        message: match[4],
        details: {}
      };
    }
    
    match = line.match(alternativeRegex);
    if (match) {
      return {
        timestamp: match[1],
        level: (match[2].toLowerCase() || 'info') as LogEntry['level'],
        module: match[3],
        message: match[4],
        details: {}
      };
    }
    
    // 如果都无法解析，返回基本格式
    return {
      timestamp: new Date().toISOString(),
      level: 'info',
      module: 'unknown',
      message: line,
      details: {}
    };
  }
};

// 保留原始函数以向后兼容
export const parseLogFile = (content: string): LogEntry[] => {
  const lines = content.split('\n');
  return lines
    .filter(line => line.trim())
    .map(line => parseSingleLogLine(line));
};

export const groupLogsByModule = (logs: LogEntry[]): LogModule[] => {
  const moduleMap = new Map<string, LogModule>();

  logs.forEach(log => {
    if (!moduleMap.has(log.module)) {
      moduleMap.set(log.module, {
        name: log.module,
        entries: [],
        stats: { info: 0, warn: 0, error: 0, debug: 0 }
      });
    }

    const module = moduleMap.get(log.module)!;
    module.entries.push(log);
    module.stats[log.level]++;
  });

  return Array.from(moduleMap.values());
};

// 添加按时间范围过滤日志的函数
export const filterLogsByTimeRange = (logs: LogEntry[], startTime?: Date, endTime?: Date): LogEntry[] => {
  if (!startTime && !endTime) return logs;
  
  return logs.filter(log => {
    const logTime = new Date(log.timestamp);
    if (startTime && logTime < startTime) return false;
    if (endTime && logTime > endTime) return false;
    return true;
  });
};

// 添加高级搜索函数
export const searchLogs = (
  logs: LogEntry[], 
  options: {
    text?: string;
    level?: LogEntry['level'][];
    modules?: string[];
    startTime?: Date;
    endTime?: Date;
  }
): LogEntry[] => {
  return logs.filter(log => {
    // 文本搜索
    if (options.text && !log.message.toLowerCase().includes(options.text.toLowerCase())) {
      return false;
    }
    
    // 日志级别过滤
    if (options.level && options.level.length > 0 && !options.level.includes(log.level)) {
      return false;
    }
    
    // 模块过滤
    if (options.modules && options.modules.length > 0 && !options.modules.includes(log.module)) {
      return false;
    }
    
    // 时间范围过滤
    if (options.startTime || options.endTime) {
      const logTime = new Date(log.timestamp);
      if (options.startTime && logTime < options.startTime) return false;
      if (options.endTime && logTime > options.endTime) return false;
    }
    
    return true;
  });
}; 