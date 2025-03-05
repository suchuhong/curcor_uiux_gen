import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Grid,
  Chip,
  Slider,
  Button,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { LogEntry } from '../types/LogTypes';

interface FilterControlsProps {
  logEntries: LogEntry[];
  setFilteredEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

const FilterControls: React.FC<FilterControlsProps> = ({ logEntries, setFilteredEntries }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 100]);
  const [advancedFilters, setAdvancedFilters] = useState<Array<{field: string; value: string}>>([]);
  
  // 提取唯一的日志级别
  const logLevels = React.useMemo(() => {
    const levels = new Set<string>();
    logEntries.forEach((entry) => {
      if (entry.level) {
        levels.add(entry.level);
      }
    });
    return Array.from(levels);
  }, [logEntries]);
  
  // 提取唯一的模块
  const logModules = React.useMemo(() => {
    const modules = new Set<string>();
    logEntries.forEach((entry) => {
      if (entry.module) {
        modules.add(entry.module);
      }
    });
    return Array.from(modules);
  }, [logEntries]);
  
  // 时间范围
  const timeData = React.useMemo(() => {
    if (logEntries.length === 0) return { min: 0, max: 0, timestamps: [] };
    
    const timestamps = logEntries
      .filter((entry) => entry.timestamp)
      .map((entry) => new Date(entry.timestamp || '').getTime())
      .sort((a, b) => a - b);
    
    if (timestamps.length === 0) return { min: 0, max: 0, timestamps: [] };
    
    return {
      min: timestamps[0],
      max: timestamps[timestamps.length - 1],
      timestamps
    };
  }, [logEntries]);
  
  // 应用筛选条件
  useEffect(() => {
    let filtered = [...logEntries];
    
    // 文本搜索
    if (searchText) {
      const text = searchText.toLowerCase();
      filtered = filtered.filter((entry) => 
        entry.message?.toLowerCase().includes(text) || 
        entry.details?.toLowerCase().includes(text)
      );
    }
    
    // 日志级别筛选
    if (selectedLevels.length > 0) {
      filtered = filtered.filter((entry) => 
        entry.level && selectedLevels.includes(entry.level)
      );
    }
    
    // 模块筛选
    if (selectedModules.length > 0) {
      filtered = filtered.filter((entry) => 
        entry.module && selectedModules.includes(entry.module)
      );
    }
    
    // 时间范围筛选
    if (timeData.min !== timeData.max && logEntries.some((entry) => entry.timestamp)) {
      const minTime = timeData.min + (timeData.max - timeData.min) * timeRange[0] / 100;
      const maxTime = timeData.min + (timeData.max - timeData.min) * timeRange[1] / 100;
      
      filtered = filtered.filter((entry) => {
        if (!entry.timestamp) return true;
        const time = new Date(entry.timestamp).getTime();
        return time >= minTime && time <= maxTime;
      });
    }
    
    // 高级筛选
    if (advancedFilters.length > 0) {
      filtered = filtered.filter((entry) => {
        return advancedFilters.every(filter => {
          const field = filter.field as keyof LogEntry;
          if (!field || field === '') return true;
          
          const entryValue = entry[field];
          if (entryValue === undefined) return false;
          
          // 检查字段值是否包含筛选值
          return String(entryValue).toLowerCase().includes(filter.value.toLowerCase());
        });
      });
    }
    
    setFilteredEntries(filtered);
  }, [
    logEntries,
    searchText,
    selectedLevels,
    selectedModules,
    timeRange,
    advancedFilters,
    timeData
  ]);
  
  const handleLevelChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedLevels(typeof value === 'string' ? value.split(',') : value);
  };
  
  const handleModuleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedModules(typeof value === 'string' ? value.split(',') : value);
  };
  
  const handleTimeRangeChange = (_event: Event, newValue: number | number[]) => {
    setTimeRange(newValue as [number, number]);
  };
  
  const addAdvancedFilter = () => {
    setAdvancedFilters([...advancedFilters, { field: '', value: '' }]);
  };
  
  const updateAdvancedFilter = (index: number, field: string, value: string) => {
    const newFilters = [...advancedFilters];
    newFilters[index] = { field, value };
    setAdvancedFilters(newFilters);
  };
  
  const removeAdvancedFilter = (index: number) => {
    const newFilters = [...advancedFilters];
    newFilters.splice(index, 1);
    setAdvancedFilters(newFilters);
  };
  
  const formatTime = (value: number) => {
    if (timeData.min === timeData.max) return '';
    
    const time = timeData.min + (timeData.max - timeData.min) * value / 100;
    return new Date(time).toLocaleString();
  };
  
  const clearFilters = () => {
    setSearchText('');
    setSelectedLevels([]);
    setSelectedModules([]);
    setTimeRange([0, 100]);
    setAdvancedFilters([]);
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        筛选日志
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="搜索文本"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="在消息和详情中搜索..."
            size="small"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel id="level-select-label">日志级别</InputLabel>
            <Select
              labelId="level-select-label"
              multiple
              value={selectedLevels}
              onChange={handleLevelChange}
              label="日志级别"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {logLevels.map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel id="module-select-label">模块</InputLabel>
            <Select
              labelId="module-select-label"
              multiple
              value={selectedModules}
              onChange={handleModuleChange}
              label="模块"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {logModules.map((module) => (
                <MenuItem key={module} value={module}>
                  {module}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {timeData.min !== timeData.max && (
          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              时间范围
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={timeRange}
                onChange={handleTimeRangeChange}
                valueLabelDisplay="auto"
                valueLabelFormat={formatTime}
                min={0}
                max={100}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption">
                  {formatTime(timeRange[0])}
                </Typography>
                <Typography variant="caption">
                  {formatTime(timeRange[1])}
                </Typography>
              </Box>
            </Box>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2">高级筛选</Typography>
            <Button 
              startIcon={<AddIcon />} 
              size="small" 
              onClick={addAdvancedFilter}
            >
              添加筛选条件
            </Button>
          </Box>
          
          {advancedFilters.map((filter, index) => (
            <Box key={index} sx={{ display: 'flex', mb: 1, gap: 1 }}>
              <FormControl size="small" sx={{ width: '30%' }}>
                <InputLabel>字段</InputLabel>
                <Select
                  value={filter.field}
                  label="字段"
                  onChange={(e) => updateAdvancedFilter(index, e.target.value, filter.value)}
                >
                  <MenuItem value="timestamp">时间戳</MenuItem>
                  <MenuItem value="level">级别</MenuItem>
                  <MenuItem value="module">模块</MenuItem>
                  <MenuItem value="message">消息</MenuItem>
                  <MenuItem value="details">详情</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                placeholder="值"
                value={filter.value}
                onChange={(e) => updateAdvancedFilter(index, filter.field, e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              
              <IconButton 
                size="small" 
                color="error" 
                onClick={() => removeAdvancedFilter(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={clearFilters}>
              清除所有筛选条件
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FilterControls; 