import { LogEntry, LogModule, LogParseStructure, ParseResult } from '../types/LogTypes';
import { detectStructure, getAllStructures, getStructureById, clearStructureDetectionCache } from './logStructures';

// 添加解析缓存
const parseCache = new Map<string, ParseResult>();

// 用于分批处理大文件的工具函数
export const parseLogFileInChunks = async (
  content: string,
  structureId?: string,
  chunkSize = 5000, // 增大默认块大小
  onProgress?: (progress: number) => void
): Promise<ParseResult> => {
  // 生成缓存键 (使用内容hash和结构ID)
  const cacheKey = `${hashString(content)}_${structureId || 'auto'}`;
  
  // 如果有缓存，直接返回
  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey)!;
  }
  
  // 重置结果
  const lines = content.split('\n');
  let structure: LogParseStructure | null = null;
  
  if (structureId) {
    structure = getStructureById(structureId);
  } else {
    // 仅检测前20行以快速确定结构
    const sampleLines = lines.slice(0, 20);
    for (const line of sampleLines) {
      if (line.trim()) {
        structure = detectStructure(line);
        if (structure) break;
      }
    }
  }
  
  const result: ParseResult = {
    success: true,
    entries: [],
    failedLines: 0,
    totalLines: lines.length,
    usedStructure: structure || undefined
  };
  
  let processedLines = 0;
  let currentChunk = 0;
  const totalChunks = Math.ceil(lines.length / chunkSize);
  
  // 使用记忆化优化
  const parsedLines = new Map<string, LogEntry | null>();
  
  const processChunk = () => {
    const startIndex = currentChunk * chunkSize;
    const endIndex = Math.min(startIndex + chunkSize, lines.length);
    
    for (let i = startIndex; i < endIndex; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 检查是否已解析过该行
      if (parsedLines.has(line)) {
        const entry = parsedLines.get(line);
        if (entry) {
          result.entries.push(entry);
        } else {
          result.failedLines++;
        }
        continue;
      }
      
      try {
        const entry = parseSingleLogLine(line, structure);
        parsedLines.set(line, entry);
        
        if (entry) {
          result.entries.push(entry);
        } else {
          result.failedLines++;
        }
      } catch (error) {
        console.warn('解析日志行失败:', line, error);
        result.failedLines++;
      }
    }
    
    processedLines = endIndex;
    currentChunk++;
    
    if (onProgress) {
      onProgress(Math.floor((processedLines / lines.length) * 100));
    }
    
    if (currentChunk < totalChunks) {
      // 使用更合适的延迟机制，不阻塞UI
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // 检查性能，动态调整块大小
          const startTime = performance.now();
          processChunk().then(() => {
            const endTime = performance.now();
            const timePerLine = (endTime - startTime) / chunkSize;
            
            // 如果处理很快，增加块大小
            if (timePerLine < 0.02 && chunkSize < 10000) {
              chunkSize = Math.min(10000, chunkSize * 1.5);
            }
            resolve();
          });
        }, 0);
      });
    }
    
    return Promise.resolve();
  };
  
  await processChunk();
  
  // 存入缓存
  parseCache.set(cacheKey, result);
  
  return result;
};

// 解析单行日志的函数，基于指定的结构
export const parseSingleLogLine = (line: string, structure?: LogParseStructure | null): LogEntry | null => {
  // 如果没有指定结构，尝试检测
  if (!structure) {
    structure = detectStructure(line);
    
    // 如果无法检测到结构，返回null
    if (!structure) {
      return null;
    }
  }
  
  try {
    // 根据结构类型使用不同的解析方法
    if (structure.type === 'json') {
      return parseJsonLog(line, structure);
    } else if (structure.type === 'regex') {
      return parseRegexLog(line, structure);
    } else if (structure.type === 'custom' && structure.customParser) {
      const result = structure.customParser(line);
      return result as LogEntry || null;
    }
  } catch (e) {
    console.warn('解析失败', e);
    return null;
  }
  
  return null;
};

// 解析JSON格式日志
const parseJsonLog = (line: string, structure: LogParseStructure): LogEntry => {
  let json;
  
  try {
    json = JSON.parse(line);
  } catch (e) {
    // 尝试修复常见的JSON错误
    try {
      // 有些日志JSON可能缺少引号，尝试修复
      const fixedLine = line.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      json = JSON.parse(fixedLine);
    } catch {
      throw new Error('无效的JSON格式');
    }
  }
  
  const { jsonFieldMappings, levelMapping } = structure;
  
  if (!jsonFieldMappings) {
    throw new Error('JSON字段映射未定义');
  }
  
  // 基础字段提取
  const logEntry: LogEntry = {
    timestamp: '',
    level: 'info',
    module: '',
    message: '',
  };
  
  // 使用字段映射提取数据
  if (jsonFieldMappings.timestamp && json[jsonFieldMappings.timestamp]) {
    logEntry.timestamp = json[jsonFieldMappings.timestamp];
  }
  
  if (jsonFieldMappings.level && json[jsonFieldMappings.level]) {
    const rawLevel = json[jsonFieldMappings.level];
    // 使用级别映射或默认值
    logEntry.level = (levelMapping && levelMapping[rawLevel]) || 
                     standardizeLevelValue(rawLevel) || 
                     'info';
  }
  
  if (jsonFieldMappings.module && json[jsonFieldMappings.module]) {
    logEntry.module = json[jsonFieldMappings.module];
  }
  
  if (jsonFieldMappings.message && json[jsonFieldMappings.message]) {
    logEntry.message = json[jsonFieldMappings.message];
  }
  
  if (jsonFieldMappings.details && json[jsonFieldMappings.details]) {
    try {
      logEntry.details = json[jsonFieldMappings.details];
    } catch (e) {
      logEntry.details = { raw: json[jsonFieldMappings.details] };
    }
  } else {
    // 如果没有指定详情字段，将整个JSON作为详情
    const { timestamp, level, module, message, ...rest } = json;
    if (Object.keys(rest).length > 0) {
      logEntry.details = rest;
    }
  }
  
  return logEntry;
};

// 优化正则解析，使用编译过的正则表达式
const regexCache = new Map<string, RegExp>();

const parseRegexLog = (line: string, structure: LogParseStructure): LogEntry => {
  const { regexPattern, fieldMappings, levelMapping } = structure;
  
  if (!regexPattern || !fieldMappings) {
    throw new Error('正则模式或字段映射未定义');
  }
  
  // 从缓存获取已编译的正则表达式
  let regex: RegExp;
  if (regexCache.has(regexPattern)) {
    regex = regexCache.get(regexPattern)!;
  } else {
    regex = new RegExp(regexPattern);
    regexCache.set(regexPattern, regex);
  }
  
  const match = line.match(regex);
  
  if (!match) {
    throw new Error('正则不匹配');
  }
  
  // 基础字段初始化
  const logEntry: LogEntry = {
    timestamp: '',
    level: 'info',
    module: '',
    message: '',
  };
  
  // 使用字段映射提取数据
  if (fieldMappings.timestamp !== undefined && match[fieldMappings.timestamp]) {
    logEntry.timestamp = match[fieldMappings.timestamp];
  }
  
  if (fieldMappings.level !== undefined && match[fieldMappings.level]) {
    const rawLevel = match[fieldMappings.level];
    // 使用级别映射或默认值
    logEntry.level = (levelMapping && levelMapping[rawLevel]) || 
                     standardizeLevelValue(rawLevel) || 
                     'info';
  }
  
  if (fieldMappings.module !== undefined && match[fieldMappings.module]) {
    logEntry.module = match[fieldMappings.module];
  }
  
  if (fieldMappings.message !== undefined && match[fieldMappings.message]) {
    logEntry.message = match[fieldMappings.message];
  }
  
  if (fieldMappings.details !== undefined && match[fieldMappings.details]) {
    try {
      // 尝试将详情解析为JSON
      logEntry.details = JSON.parse(match[fieldMappings.details]);
    } catch (e) {
      // 如果不是有效的JSON，则作为原始字符串
      logEntry.details = { raw: match[fieldMappings.details] };
    }
  }
  
  return logEntry;
};

// 标准化日志级别
const standardizeLevelValue = (level: string): LogEntry['level'] | undefined => {
  const lowerLevel = level.toLowerCase();
  
  if (lowerLevel.includes('error') || lowerLevel.includes('critical') || lowerLevel.includes('fatal')) {
    return 'error';
  } else if (lowerLevel.includes('warn')) {
    return 'warn';
  } else if (lowerLevel.includes('info')) {
    return 'info';
  } else if (lowerLevel.includes('debug') || lowerLevel.includes('trace')) {
    return 'debug';
  }
  
  return undefined;
};

// 简单的字符串哈希函数，用于缓存键
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < Math.min(str.length, 1000); i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

// 公开清除缓存的方法
export const clearParseCache = () => {
  parseCache.clear();
  regexCache.clear();
  clearStructureDetectionCache();
  console.log('所有解析缓存已清除');
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

// 保留原始函数以向后兼容，但使用新的优化解析逻辑
export const parseLogFile = (content: string, structureId?: string): ParseResult => {
  // 创建一个同步版本，简单封装异步函数
  console.warn('parseLogFile 已弃用，请使用 parseLogFileInChunks 以获得更好的性能');
  
  // 分割内容并过滤空行
  const lines = content.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  let structure: LogParseStructure | null = null;
  
  if (structureId) {
    structure = getStructureById(structureId);
  } else if (nonEmptyLines.length > 0) {
    structure = detectStructure(nonEmptyLines[0]);
  }
  
  const result: ParseResult = {
    success: true,
    entries: [],
    failedLines: 0,
    totalLines: lines.length,
    usedStructure: structure || undefined
  };
  
  // 处理每一行日志
  for (const line of nonEmptyLines) {
    try {
      const entry = parseSingleLogLine(line, structure);
      if (entry) {
        result.entries.push(entry);
      } else {
        result.failedLines++;
      }
    } catch (error) {
      console.warn('解析日志行失败:', line, error);
      result.failedLines++;
    }
  }
  
  return result;
}; 