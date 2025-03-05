import React, { useState, useCallback } from 'react';
import { Box, Container, Typography, Paper, CircularProgress, useTheme, useMediaQuery, Button } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogUploader from './components/LogUploader';
import ModuleList from './components/ModuleList';
import LogViewer from './components/LogViewer';
import LogStats from './components/LogStats';
import ProgressBar from './components/ProgressBar';
import AdvancedFilter from './components/AdvancedFilter';
import { FilterOptions } from './components/AdvancedFilter';
import { LogEntry, LogModule } from './types/LogTypes';
import { parseLogFileInChunks, parseLogFile, groupLogsByModule, searchLogs } from './utils/logParser';

const App: React.FC = () => {
  const [modules, setModules] = useState<LogModule[]>([]);
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleFileUpload = useCallback(async (content: string) => {
    setIsLoading(true);
    setProgress(0);
    setModules([]);
    setSelectedModule(null);
    setFilteredLogs([]);

    try {
      // 对于大文件使用分块处理
      const fileSize = new Blob([content]).size;
      let logs: LogEntry[];
      
      if (fileSize > 5 * 1024 * 1024) { // 5MB
        logs = await parseLogFileInChunks(content, 2000, setProgress);
      } else {
        logs = parseLogFile(content);
        setProgress(100);
      }
      
      setAllLogs(logs);
      const groupedLogs = groupLogsByModule(logs);
      setModules(groupedLogs);
      
      if (groupedLogs.length > 0) {
        setSelectedModule(groupedLogs[0].name);
        setFilteredLogs(groupedLogs[0].entries);
      }
    } catch (error) {
      console.error('Error parsing log file:', error);
      // 可以添加错误处理UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleModuleSelect = useCallback((moduleName: string) => {
    setSelectedModule(moduleName);
    const selectedModuleLogs = modules.find(m => m.name === moduleName)?.entries || [];
    setFilteredLogs(selectedModuleLogs);
  }, [modules]);

  const handleFilter = useCallback((options: FilterOptions) => {
    if (!selectedModule) return;
    
    const selectedModuleLogs = modules.find(m => m.name === selectedModule)?.entries || [];
    const filtered = searchLogs(selectedModuleLogs, options);
    setFilteredLogs(filtered);
  }, [modules, selectedModule]);

  const handleResetFilter = useCallback(() => {
    if (!selectedModule) return;
    
    const selectedModuleLogs = modules.find(m => m.name === selectedModule)?.entries || [];
    setFilteredLogs(selectedModuleLogs);
  }, [modules, selectedModule]);

  const toggleColorMode = () => {
    setColorMode(prev => prev === 'light' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', colorMode === 'light' ? 'dark' : 'light');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Log Viewer
        </Typography>
        <Button
          variant="outlined"
          startIcon={colorMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          onClick={toggleColorMode}
        >
          {colorMode === 'light' ? '暗色模式' : '亮色模式'}
        </Button>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <LogUploader onUpload={handleFileUpload} />
      </Box>
      
      {isLoading && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <ProgressBar progress={progress} message="正在解析日志文件..." />
          {progress < 100 && <CircularProgress size={24} sx={{ mt: 2 }} />}
        </Box>
      )}
      
      {modules.length > 0 && !isLoading && (
        <>
          {/* 添加统计图表区 */}
          <LogStats modules={modules} />
          
          {/* 添加高级筛选区 */}
          <AdvancedFilter 
            modules={modules} 
            onFilter={handleFilter} 
            onReset={handleResetFilter} 
          />
          
          {/* 主界面区域 */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              flexDirection: isMobile ? 'column' : 'row'
            }}
          >
            <Paper sx={{ width: isMobile ? '100%' : 250, p: 2 }}>
              <ModuleList
                modules={modules}
                selectedModule={selectedModule}
                onModuleSelect={handleModuleSelect}
              />
            </Paper>
            <Paper sx={{ flex: 1, p: 2 }}>
              <LogViewer logs={filteredLogs} />
            </Paper>
          </Box>
        </>
      )}
    </Container>
  );
};

export default App; 