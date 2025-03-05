import { LogEntry, LogModule } from '../types/LogTypes';

export const parseLogFile = (content: string): LogEntry[] => {
  const lines = content.split('\n');
  return lines
    .filter(line => line.trim())
    .map(line => {
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
        // 如果不是 JSON 格式，尝试正则解析
        const regex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\s+\[(\w+)\]\s+(\w+)\s+-\s+(.*)/;
        const match = line.match(regex);
        if (match) {
          return {
            timestamp: match[1],
            level: match[2].toLowerCase() as LogEntry['level'],
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
    });
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