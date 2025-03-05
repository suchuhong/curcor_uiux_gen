import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Box,
  IconButton,
  Collapse,
  Typography,
  Chip
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { LogEntry } from '../types/LogTypes';

interface LogViewerProps {
  logs: LogEntry[];
}

const LogRow: React.FC<{ log: LogEntry }> = ({ log }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        sx={{
          '&:hover': { bgcolor: 'action.hover' },
          bgcolor: log.level === 'error' ? 'error.lighter' : undefined
        }}
      >
        <TableCell>
          {log.details && Object.keys(log.details).length > 0 && (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
        <TableCell>
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
          />
        </TableCell>
        <TableCell>{log.message}</TableCell>
      </TableRow>
      {log.details && Object.keys(log.details).length > 0 && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  详细信息
                </Typography>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.level.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="搜索日志..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={48} />
              <TableCell>时间</TableCell>
              <TableCell>级别</TableCell>
              <TableCell>消息</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.map((log, index) => (
              <LogRow key={index} log={log} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LogViewer; 