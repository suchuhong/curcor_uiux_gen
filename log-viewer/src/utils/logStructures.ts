import { LogParseStructure, LogEntry } from '../types/LogTypes';

// 标准日志级别映射
const standardLevelMapping: Record<string, LogEntry['level']> = {
  INFO: 'info',
  WARN: 'warn',
  WARNING: 'warn',
  ERROR: 'error',
  ERR: 'error',
  DEBUG: 'debug',
  TRACE: 'debug',
  FATAL: 'error',
  CRITICAL: 'error',
  NOTICE: 'info'
};

// 预定义的日志解析结构
export const predefinedStructures: LogParseStructure[] = [
  // 标准JSON格式
  {
    id: 'standard-json',
    name: '标准JSON格式',
    description: '每行一个JSON对象，包含timestamp、level、module、message和可选的details字段',
    type: 'json',
    jsonFieldMappings: {
      timestamp: 'timestamp',
      level: 'level',
      module: 'module',
      message: 'message',
      details: 'details'
    },
    levelMapping: standardLevelMapping,
    matchTest: (line) => {
      try {
        const obj = JSON.parse(line);
        return typeof obj === 'object' && obj !== null &&
          'timestamp' in obj && 'level' in obj && 'message' in obj;
      } catch {
        return false;
      }
    }
  },

  // 标准日志格式 (ISO时间戳 [级别] 模块 - 消息)
  {
    id: 'standard-log',
    name: '标准日志格式',
    description: 'ISO时间戳 [级别] 模块 - 消息',
    type: 'regex',
    regexPattern: '(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?Z?)\\s+\\[(\\w+)\\]\\s+(\\w+)\\s+-\\s+(.*)',
    fieldMappings: {
      timestamp: 1,
      level: 2,
      module: 3,
      message: 4
    },
    levelMapping: standardLevelMapping,
    matchTest: (line) => {
      return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?\s+\[\w+\]\s+\w+\s+-\s+/.test(line);
    }
  },

  // 简单日期格式 (年-月-日 时:分:秒 [级别] 消息)
  {
    id: 'simple-date-log',
    name: '简单日期格式',
    description: '年-月-日 时:分:秒 [级别] 消息',
    type: 'regex',
    regexPattern: '(\\d{4}[-/]\\d{2}[-/]\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+\\[(\\w+)\\]\\s+(.*)',
    fieldMappings: {
      timestamp: 1,
      level: 2,
      message: 3
    },
    levelMapping: standardLevelMapping,
    matchTest: (line) => {
      return /\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2}\s+\[\w+\]\s+/.test(line);
    }
  },

  // 带模块的简单日期格式 (年-月-日 时:分:秒 [级别] [模块] 消息)
  {
    id: 'module-date-log',
    name: '带模块的简单日期格式',
    description: '年-月-日 时:分:秒 [级别] [模块] 消息',
    type: 'regex',
    regexPattern: '(\\d{4}[-/]\\d{2}[-/]\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s+\\[(\\w+)\\]\\s+\\[(\\w+)\\]\\s+(.*)',
    fieldMappings: {
      timestamp: 1,
      level: 2,
      module: 3,
      message: 4
    },
    levelMapping: standardLevelMapping,
    matchTest: (line) => {
      return /\d{4}[-/]\d{2}[-/]\d{2}\s+\d{2}:\d{2}:\d{2}\s+\[\w+\]\s+\[\w+\]\s+/.test(line);
    }
  },

  // Apache/Nginx访问日志格式
  {
    id: 'apache-access-log',
    name: 'Apache/Nginx访问日志',
    description: 'IP - - [日期] "请求" 状态码 大小 "引用" "UA"',
    type: 'regex',
    regexPattern: '(\\S+) \\S+ \\S+ \\[(.*?)\\] "(.*?)" (\\d+) (\\d+) "(.*?)" "(.*?)"',
    fieldMappings: {
      timestamp: 2,
      message: 3
    },
    customParser: (line) => {
      const match = line.match(/(\\S+) \\S+ \\S+ \\[(.*?)\\] "(.*?)" (\\d+) (\\d+) "(.*?)" "(.*?)"/);
      if (!match) return null;
      
      const statusCode = parseInt(match[4], 10);
      let level: LogEntry['level'] = 'info';
      
      if (statusCode >= 400 && statusCode < 500) {
        level = 'warn';
      } else if (statusCode >= 500) {
        level = 'error';
      }
      
      return {
        timestamp: match[2],
        level,
        module: 'HttpServer',
        message: match[3],
        details: {
          ip: match[1],
          statusCode,
          size: parseInt(match[5], 10),
          referer: match[6],
          userAgent: match[7]
        }
      };
    },
    matchTest: (line) => {
      return /\S+ \S+ \S+ \[.*?\] ".*?" \d+ \d+ ".*?" ".*?"/.test(line);
    }
  },

  // 简单键值对格式
  {
    id: 'key-value-log',
    name: '键值对格式',
    description: '时间戳=xxx 级别=xxx 模块=xxx 消息=xxx',
    type: 'custom',
    customParser: (line) => {
      const keyValuePairs = line.match(/(\w+)=("[^"]*"|\S+)/g);
      if (!keyValuePairs) return null;
      
      const entry: Partial<LogEntry> = {
        module: 'unknown'
      };
      
      keyValuePairs.forEach(pair => {
        const [key, value] = pair.split('=');
        const cleanValue = value.startsWith('"') ? value.slice(1, -1) : value;
        
        switch (key.toLowerCase()) {
          case 'time':
          case 'timestamp':
          case 'date':
            entry.timestamp = cleanValue;
            break;
          case 'level':
          case 'severity':
          case 'loglevel':
            const mappedLevel = standardLevelMapping[cleanValue.toUpperCase()] || 'info';
            entry.level = mappedLevel;
            break;
          case 'module':
          case 'component':
          case 'service':
            entry.module = cleanValue;
            break;
          case 'message':
          case 'msg':
          case 'text':
            entry.message = cleanValue;
            break;
        }
      });
      
      if (!entry.message) {
        // 如果没有找到消息字段，尝试拼接其他字段为消息
        const remainingPairs = keyValuePairs
          .filter(pair => !pair.match(/^(time|timestamp|date|level|severity|loglevel|module|component|service|message|msg|text)=/i))
          .map(pair => pair.replace(/=/, ': '));
        
        if (remainingPairs.length > 0) {
          entry.message = remainingPairs.join(', ');
        } else {
          entry.message = line;
        }
      }
      
      return entry;
    },
    matchTest: (line) => {
      // 至少有两个键值对，其中一个是时间戳或日志级别
      const matches = line.match(/(\w+)=("[^"]*"|\S+)/g);
      if (!matches || matches.length < 2) return false;
      
      return matches.some(match => {
        const key = match.split('=')[0].toLowerCase();
        return ['time', 'timestamp', 'date', 'level', 'severity', 'loglevel'].includes(key);
      });
    }
  },
  
  // 通用日志格式 (作为后备)
  {
    id: 'fallback',
    name: '通用日志格式',
    description: '尝试从任何文本中提取日志信息',
    type: 'custom',
    customParser: (line) => {
      // 尝试提取时间戳
      let timestamp = new Date().toISOString();
      const timeMatch = line.match(/\d{4}[-/]\d{2}[-/]\d{2}[\sT]\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?/);
      if (timeMatch) {
        timestamp = timeMatch[0];
      }
      
      // 尝试提取日志级别
      let level: LogEntry['level'] = 'info';
      const levelWords = ['INFO', 'WARN', 'WARNING', 'ERROR', 'ERR', 'DEBUG', 'TRACE', 'FATAL', 'CRITICAL'];
      for (const word of levelWords) {
        if (line.includes(word) || line.includes(word.toLowerCase())) {
          level = standardLevelMapping[word] || 'info';
          break;
        }
      }
      
      // 尝试提取模块
      let module = 'unknown';
      const bracketModuleMatch = line.match(/\[([a-zA-Z0-9_.:]+)\]/);
      if (bracketModuleMatch) {
        module = bracketModuleMatch[1];
      }
      
      return {
        timestamp,
        level,
        module,
        message: line
      };
    },
    // 总是匹配作为后备
    matchTest: () => true
  }
];

// 优化结构检测性能 - 使用缓存，避免重复检测
const structureDetectionCache = new Map<string, LogParseStructure | null>();

export const detectStructure = (line: string): LogParseStructure | null => {
  // 对于相同的行，直接返回缓存结果
  const cacheKey = line.slice(0, 200); // 只使用前200个字符作为缓存键
  
  if (structureDetectionCache.has(cacheKey)) {
    return structureDetectionCache.get(cacheKey);
  }
  
  let detectedStructure: LogParseStructure | null = null;
  
  // 首先尝试找到匹配的预定义结构
  for (const structure of predefinedStructures) {
    if (structure.matchTest && structure.matchTest(line)) {
      detectedStructure = structure;
      break;
    }
  }
  
  // 如果没有匹配的预定义结构，尝试检查用户定义的结构
  if (!detectedStructure && userDefinedStructures.length > 0) {
    for (const structure of userDefinedStructures) {
      if (structure.matchTest && structure.matchTest(line)) {
        detectedStructure = structure;
        break;
      }
    }
  }
  
  // 缓存结果
  structureDetectionCache.set(cacheKey, detectedStructure);
  
  return detectedStructure;
};

// 添加清除检测缓存的方法
export const clearStructureDetectionCache = () => {
  structureDetectionCache.clear();
};

// 添加用户自定义结构
let userDefinedStructures: LogParseStructure[] = [];

export const addUserStructure = (structure: LogParseStructure) => {
  // 检查结构是否有效
  if (!structure.id || !structure.name) {
    console.error('Invalid structure: missing id or name');
    return;
  }
  
  // 先移除同ID的旧结构（如果存在）
  const existingIndex = userDefinedStructures.findIndex(s => s.id === structure.id);
  if (existingIndex >= 0) {
    userDefinedStructures.splice(existingIndex, 1);
  }
  
  // 添加新结构
  userDefinedStructures.push(structure);
  
  // 保存到localStorage
  try {
    localStorage.setItem('userDefinedStructures', JSON.stringify(userDefinedStructures));
  } catch (e) {
    console.error('Failed to save user structures to localStorage', e);
  }
  
  // 清除缓存，因为结构已更改
  clearStructureDetectionCache();
};

export const removeUserStructure = (id: string) => {
  const index = userDefinedStructures.findIndex(s => s.id === id);
  if (index >= 0) {
    userDefinedStructures.splice(index, 1);
    
    // 保存到localStorage
    try {
      localStorage.setItem('userDefinedStructures', JSON.stringify(userDefinedStructures));
    } catch (e) {
      console.error('Failed to save user structures to localStorage', e);
    }
    
    // 清除缓存，因为结构已更改
    clearStructureDetectionCache();
  }
};

// 优化，按重要性对所有结构进行排序
export const getAllStructures = (): LogParseStructure[] => {
  // 按常用程度和匹配能力排序的结构
  return [
    // 标准结构放前面
    ...predefinedStructures.filter(s => 
      s.id === 'standard-json' || 
      s.id === 'standard-log' || 
      s.id === 'apache-access-log'),
    // 用户定义的结构
    ...userDefinedStructures,
    // 其余预定义结构
    ...predefinedStructures.filter(s => 
      s.id !== 'standard-json' && 
      s.id !== 'standard-log' && 
      s.id !== 'apache-access-log' &&
      s.id !== 'fallback'),
    // 回退结构放最后
    ...predefinedStructures.filter(s => s.id === 'fallback')
  ];
};

export const getStructureById = (id: string): LogParseStructure | undefined => {
  return getAllStructures().find(s => s.id === id);
}; 