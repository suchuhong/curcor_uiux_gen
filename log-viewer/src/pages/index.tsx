import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  LinearProgress,
  Alert,
  ThemeProvider,
  createTheme,
  IconButton,
  CssBaseline,
  Chip,
  Tooltip
} from '@mui/material';
import { CloudUpload as CloudUploadIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon, Cached as CachedIcon } from '@mui/icons-material';
import { parseLogFileInChunks, clearParseCache } from '../utils/logParser';
import { LogEntry, ParseResult } from '../types/LogTypes';
import FilterControls from '../components/FilterControls';
import LogTable from '../components/LogTable';
import LogStructureSelector from '../components/LogStructureSelector';

export default function Home() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredEntries, setFilteredEntries] = useState<LogEntry[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | undefined>(undefined);
  const [selectedStructureId, setSelectedStructureId] = useState<string | undefined>(undefined);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [parseTime, setParseTime] = useState<number>(0);
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#f48fb1',
      },
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    setParseError(null);
    setIsCached(false);
    
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCurrentFile(file.name);
    
    try {
      const content = await file.text();
      
      const startTime = performance.now();
      
      const result = await parseLogFileInChunks(
        content, 
        selectedStructureId, 
        5000, 
        (progress) => {
          console.log(`解析进度: ${progress}%`);
        }
      );
      
      const endTime = performance.now();
      const timeSpent = endTime - startTime;
      setParseTime(timeSpent);
      
      setIsCached(timeSpent < 100 && result.entries.length > 1000);
      
      setLogEntries(result.entries);
      setFilteredEntries(result.entries);
      setParseResult(result);
      
      if (result.failedLines > 0) {
        console.warn(`无法解析 ${result.failedLines} 行日志`);
      }
    } catch (error) {
      console.error('解析日志文件时出错:', error);
      setParseError(error instanceof Error ? error.message : '未知错误');
      setLogEntries([]);
      setFilteredEntries([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStructureSelect = (structureId: string | undefined) => {
    setSelectedStructureId(structureId);
    
    if (currentFile && logEntries.length > 0) {
      reprocessLogWithNewStructure();
    }
  };
  
  const reprocessLogWithNewStructure = async () => {
    const fileInput = document.getElementById('log-file-input') as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      const event = { target: { files: fileInput.files } } as React.ChangeEvent<HTMLInputElement>;
      await handleFileChange(event);
    }
  };
  
  const handleClearCache = () => {
    clearParseCache();
    if (currentFile) {
      reprocessLogWithNewStructure();
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              高性能日志查看器
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {parseTime > 0 && (
                <Typography variant="body2" sx={{ mr: 2 }}>
                  解析耗时: {parseTime.toFixed(0)}ms
                  {isCached && <Chip size="small" label="从缓存读取" color="success" sx={{ ml: 1 }} />}
                </Typography>
              )}
              <Tooltip title="清除解析缓存">
                <IconButton 
                  onClick={handleClearCache} 
                  color="primary"
                  disabled={!currentFile}
                >
                  <CachedIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={toggleDarkMode} color="inherit">
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              disabled={loading}
            >
              上传日志文件
              <input
                id="log-file-input"
                type="file"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {currentFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                当前文件: {currentFile}
              </Typography>
            )}
            {loading && <LinearProgress sx={{ mt: 2 }} />}
            {parseError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                解析错误: {parseError}
              </Alert>
            )}
          </Box>
          
          <LogStructureSelector
            initialStructureId={selectedStructureId}
            onStructureSelect={handleStructureSelect}
            parseResult={parseResult}
          />
          
          {logEntries.length > 0 && (
            <Box>
              <FilterControls 
                logEntries={logEntries} 
                setFilteredEntries={setFilteredEntries} 
              />
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                显示 {filteredEntries.length} / {logEntries.length} 条日志
              </Typography>
              
              <LogTable entries={filteredEntries} />
            </Box>
          )}
        </Container>
      </ThemeProvider>
    </Box>
  );
} 