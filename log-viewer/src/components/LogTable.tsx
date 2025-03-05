import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Collapse,
  IconButton,
  Chip,
  useTheme,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { LogEntry } from '../types/LogTypes';

interface LogTableProps {
  entries: LogEntry[];
}

const LogTable: React.FC<LogTableProps> = ({ entries }) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const getLevelColor = (level: string | undefined) => {
    if (!level) return 'default';
    
    const lowerLevel = level.toLowerCase();
    
    if (lowerLevel.includes('error') || lowerLevel.includes('severe') || lowerLevel.includes('critical')) {
      return 'error';
    } else if (lowerLevel.includes('warn')) {
      return 'warning';
    } else if (lowerLevel.includes('info')) {
      return 'info';
    } else if (lowerLevel.includes('debug')) {
      return 'default';
    } else if (lowerLevel.includes('trace')) {
      return 'secondary';
    }
    
    return 'default';
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        console.log('内容已复制到剪贴板');
      },
      (err) => {
        console.error('无法复制内容: ', err);
      }
    );
  };
  
  // 格式化JSON字符串
  const formatJSON = (jsonString: string) => {
    try {
      const json = JSON.parse(jsonString);
      return JSON.stringify(json, null, 2);
    } catch {
      return jsonString;
    }
  };
  
  // 当前页的日志条目
  const currentPageEntries = entries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // 虚拟化表格渲染函数
  const renderRow = (entry: LogEntry, index: number) => {
    const isExpanded = expandedRows[index] || false;
    
    return (
      <React.Fragment key={index}>
        <TableRow 
          hover 
          onClick={() => toggleRow(index)}
          sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
        >
          <TableCell padding="checkbox">
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleRow(index);
              }}
            >
              {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          
          <TableCell sx={{ whiteSpace: 'nowrap' }}>
            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
          </TableCell>
          
          <TableCell>
            {entry.level && (
              <Chip 
                label={entry.level} 
                size="small" 
                color={getLevelColor(entry.level)} 
                variant="outlined"
              />
            )}
          </TableCell>
          
          <TableCell>{entry.module}</TableCell>
          
          <TableCell 
            sx={{ 
              maxWidth: '50vw', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}
          >
            {entry.message}
          </TableCell>
        </TableRow>
        
        <TableRow>
          <TableCell sx={{ py: 0 }} colSpan={6}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    详细信息
                  </Typography>
                  <Tooltip title="复制详细信息">
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const content = JSON.stringify({
                          timestamp: entry.timestamp,
                          level: entry.level,
                          module: entry.module,
                          message: entry.message,
                          details: entry.details
                        }, null, 2);
                        copyToClipboard(content);
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>时间：</strong>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>级别：</strong>{entry.level || 'N/A'}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>模块：</strong>{entry.module || 'N/A'}
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>消息：</strong>{entry.message || 'N/A'}
                </Typography>
                
                {entry.details && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>详细信息：</strong>
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1,
                        maxHeight: '200px',
                        overflow: 'auto',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {formatJSON(entry.details)}
                    </Paper>
                  </Box>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>时间</TableCell>
              <TableCell>级别</TableCell>
              <TableCell>模块</TableCell>
              <TableCell>消息</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageEntries.map(renderRow)}
            
            {currentPageEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" sx={{ py: 2 }}>
                    没有找到符合条件的日志记录
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={entries.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="每页行数:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />
    </Paper>
  );
};

export default LogTable; 