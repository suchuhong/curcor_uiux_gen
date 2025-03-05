import React, { useState, useCallback, memo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Collapse,
  Typography,
  Chip,
  Paper,
  Tooltip,
  Button
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  FileDownload
} from '@mui/icons-material';
import { LogEntry } from '../types/LogTypes';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

interface LogViewerProps {
  logs: LogEntry[];
  exportEnabled?: boolean;
}

// 使用memo优化单行日志组件，减少不必要的重渲染
const LogRow = memo(({ log, onToggleDetails }: { log: LogEntry; onToggleDetails: (index: number) => void; index: number }) => {
  const hasDetails = log.details && Object.keys(log.details).length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        p: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        alignItems: 'flex-start',
        '&:hover': { bgcolor: 'action.hover' },
        bgcolor: log.level === 'error' ? 'error.lighter' : undefined,
        borderLeft: '4px solid',
        borderLeftColor: 
          log.level === 'error' ? 'error.main' : 
          log.level === 'warn' ? 'warning.main' : 
          log.level === 'info' ? 'info.main' : 
          'text.disabled'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            {new Date(log.timestamp).toLocaleString()}
          </Typography>
          <Chip
            label={log.level}
            size="small"
            color={
              log.level === 'error'
                ? 'error'
                : log.level === 'warn'
                ? 'warning'
                : log.level === 'info'
                ? 'info'
                : 'default'
            }
            sx={{ mr: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            {log.module}
          </Typography>
        </Box>
        <Box sx={{ wordBreak: 'break-word' }}>
          <Typography variant="body2">{log.message}</Typography>
        </Box>
      </Box>
      {hasDetails && (
        <IconButton size="small" onClick={() => onToggleDetails(log)}>
          {log._detailsOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      )}
    </Box>
  );
});

LogRow.displayName = 'LogRow';

// 详情组件
const LogDetails = memo(({ details }: { details: Record<string, any> }) => {
  return (
    <Box sx={{ p: 1, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle2" gutterBottom>
        详细信息
      </Typography>
      <pre
        style={{
          margin: 0,
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.03)',
          borderRadius: '4px',
          maxHeight: '300px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {JSON.stringify(details, null, 2)}
      </pre>
    </Box>
  );
});

LogDetails.displayName = 'LogDetails';

const LogViewer: React.FC<LogViewerProps> = ({ logs, exportEnabled = true }) => {
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('');

  // 优化：使用记忆化过滤器
  const filteredLogs = React.useMemo(() => {
    if (!filter) return logs;
    
    const lowerFilter = filter.toLowerCase();
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerFilter) ||
        log.level.toLowerCase().includes(lowerFilter) ||
        log.module.toLowerCase().includes(lowerFilter)
    );
  }, [logs, filter]);

  const handleToggleDetails = useCallback((log: LogEntry) => {
    const logId = `${log.timestamp}-${log.module}-${log.message.substring(0, 20)}`;
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
    
    // 添加一个临时属性用于显示
    log._detailsOpen = !log._detailsOpen;
  }, []);

  const getLogKey = useCallback((log: LogEntry) => {
    return `${log.timestamp}-${log.module}-${log.message.substring(0, 20)}`;
  }, []);

  const isLogExpanded = useCallback((log: LogEntry) => {
    const logId = getLogKey(log);
    return expandedLogs[logId] || false;
  }, [expandedLogs, getLogKey]);

  const renderLogRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = filteredLogs[index];
    const logId = getLogKey(log);
    const isExpanded = expandedLogs[logId];
    
    // 添加一个临时属性用于显示
    log._detailsOpen = isExpanded;
    
    return (
      <div style={style}>
        <LogRow log={log} onToggleDetails={handleToggleDetails} index={index} />
        {isExpanded && log.details && Object.keys(log.details).length > 0 && (
          <LogDetails details={log.details} />
        )}
      </div>
    );
  }, [filteredLogs, expandedLogs, getLogKey, handleToggleDetails]);

  const handleExportLogs = () => {
    const logsToExport = filteredLogs.length > 0 ? filteredLogs : logs;
    const exportData = JSON.stringify(logsToExport, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="搜索日志..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {exportEnabled && (
          <Tooltip title="导出日志">
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={handleExportLogs}
            >
              导出
            </Button>
          </Tooltip>
        )}
      </Box>
      
      <Paper sx={{ height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
        {filteredLogs.length > 0 ? (
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                width={width}
                itemCount={filteredLogs.length}
                itemSize={80} // 根据您的行高调整
              >
                {renderLogRow}
              </List>
            )}
          </AutoSizer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              没有匹配的日志条目
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LogViewer; 