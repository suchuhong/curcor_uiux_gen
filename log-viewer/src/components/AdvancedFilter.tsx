import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { ExpandMore, FilterAlt, Clear } from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LogEntry, LogModule } from '../types/LogTypes';

interface AdvancedFilterProps {
  modules: LogModule[];
  onFilter: (options: FilterOptions) => void;
  onReset: () => void;
}

export interface FilterOptions {
  text?: string;
  level?: LogEntry['level'][];
  modules?: string[];
  startTime?: Date | null;
  endTime?: Date | null;
}

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({ modules, onFilter, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    text: '',
    level: [],
    modules: [],
    startTime: null,
    endTime: null
  });
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({});

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterOptions({ ...filterOptions, text: event.target.value });
  };

  const handleLevelChange = (level: LogEntry['level']) => {
    setFilterOptions(prev => {
      const newLevels = prev.level?.includes(level)
        ? prev.level.filter(l => l !== level)
        : [...(prev.level || []), level];
      return { ...prev, level: newLevels };
    });
  };

  const handleModuleChange = (moduleName: string) => {
    setFilterOptions(prev => {
      const newModules = prev.modules?.includes(moduleName)
        ? prev.modules.filter(m => m !== moduleName)
        : [...(prev.modules || []), moduleName];
      return { ...prev, modules: newModules };
    });
  };

  const handleStartTimeChange = (date: Date | null) => {
    setFilterOptions({ ...filterOptions, startTime: date });
  };

  const handleEndTimeChange = (date: Date | null) => {
    setFilterOptions({ ...filterOptions, endTime: date });
  };

  const handleApplyFilter = () => {
    setActiveFilters({
      text: filterOptions.text || undefined,
      level: filterOptions.level?.length ? filterOptions.level : undefined,
      modules: filterOptions.modules?.length ? filterOptions.modules : undefined,
      startTime: filterOptions.startTime,
      endTime: filterOptions.endTime
    });
    onFilter(filterOptions);
  };

  const handleResetFilter = () => {
    setFilterOptions({
      text: '',
      level: [],
      modules: [],
      startTime: null,
      endTime: null
    });
    setActiveFilters({});
    onReset();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.text) count++;
    if (activeFilters.level?.length) count++;
    if (activeFilters.modules?.length) count++;
    if (activeFilters.startTime) count++;
    if (activeFilters.endTime) count++;
    return count;
  };

  return (
    <Paper sx={{ mb: 3 }}>
      <Accordion expanded={expanded} onChange={handleToggleExpand}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <FilterAlt sx={{ mr: 1 }} />
            <Typography variant="subtitle1">高级筛选</Typography>
            {getActiveFilterCount() > 0 && (
              <Chip
                label={`${getActiveFilterCount()}个筛选条件`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
            <Box sx={{ flex: 1 }} />
            {getActiveFilterCount() > 0 && (
              <Tooltip title="清除所有筛选">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetFilter();
                  }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* 文本搜索 */}
            <FormControl component="fieldset">
              <FormLabel component="legend">搜索文本</FormLabel>
              <TextField
                fullWidth
                placeholder="输入搜索关键词"
                value={filterOptions.text || ''}
                onChange={handleTextChange}
                size="small"
                variant="outlined"
              />
            </FormControl>

            {/* 日志级别选择 */}
            <FormControl component="fieldset">
              <FormLabel component="legend">日志级别</FormLabel>
              <FormGroup row>
                {['info', 'warn', 'error', 'debug'].map(level => (
                  <FormControlLabel
                    key={level}
                    control={
                      <Checkbox
                        checked={filterOptions.level?.includes(level as LogEntry['level']) || false}
                        onChange={() => handleLevelChange(level as LogEntry['level'])}
                        name={level}
                      />
                    }
                    label={level}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {/* 时间范围选择 */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <FormControl component="fieldset">
                <FormLabel component="legend">时间范围</FormLabel>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <DateTimePicker
                    label="开始时间"
                    value={filterOptions.startTime}
                    onChange={handleStartTimeChange}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DateTimePicker
                    label="结束时间"
                    value={filterOptions.endTime}
                    onChange={handleEndTimeChange}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
              </FormControl>
            </LocalizationProvider>

            {/* 模块选择 */}
            <FormControl component="fieldset">
              <FormLabel component="legend">模块选择 ({modules.length}个模块)</FormLabel>
              <Box sx={{ maxHeight: '150px', overflowY: 'auto', mt: 1 }}>
                <FormGroup>
                  {modules.map(module => (
                    <FormControlLabel
                      key={module.name}
                      control={
                        <Checkbox
                          checked={filterOptions.modules?.includes(module.name) || false}
                          onChange={() => handleModuleChange(module.name)}
                          name={module.name}
                        />
                      }
                      label={`${module.name} (${module.entries.length})`}
                    />
                  ))}
                </FormGroup>
              </Box>
            </FormControl>

            {/* 操作按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button variant="outlined" onClick={handleResetFilter}>
                重置
              </Button>
              <Button variant="contained" color="primary" onClick={handleApplyFilter}>
                应用筛选
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default AdvancedFilter; 