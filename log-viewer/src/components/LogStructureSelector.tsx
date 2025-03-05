import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Grid,
  FormLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { LogParseStructure, ParseResult } from '../types/LogTypes';
import { getAllStructures, addUserStructure, removeUserStructure } from '../utils/logStructures';

interface LogStructureSelectorProps {
  initialStructureId?: string;
  onStructureSelect: (structureId: string | undefined) => void;
  parseResult?: ParseResult;
}

const LogStructureSelector: React.FC<LogStructureSelectorProps> = ({
  initialStructureId,
  onStructureSelect,
  parseResult
}) => {
  const [structures, setStructures] = useState<LogParseStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | undefined>(initialStructureId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<LogParseStructure | null>(null);
  
  // 新结构的表单状态
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    type: 'regex' as 'regex' | 'json' | 'custom',
    regexPattern: '',
    timestampField: '',
    levelField: '',
    moduleField: '',
    messageField: '',
    detailsField: ''
  });
  
  // 初始化结构列表
  useEffect(() => {
    setStructures(getAllStructures());
  }, []);
  
  // 当解析结果更新时，如果有使用的结构，选中它
  useEffect(() => {
    if (parseResult?.usedStructure) {
      setSelectedStructureId(parseResult.usedStructure.id);
    }
  }, [parseResult]);
  
  const handleStructureChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const structureId = event.target.value as string;
    setSelectedStructureId(structureId);
    onStructureSelect(structureId);
  };
  
  const handleAddStructure = () => {
    setDialogOpen(true);
    setEditingStructure(null);
    setFormData({
      id: `custom-${Date.now()}`,
      name: '',
      description: '',
      type: 'regex',
      regexPattern: '',
      timestampField: '',
      levelField: '',
      moduleField: '',
      messageField: '',
      detailsField: ''
    });
  };
  
  const handleEditStructure = (structure: LogParseStructure) => {
    setDialogOpen(true);
    setEditingStructure(structure);
    
    // 填充表单数据
    setFormData({
      id: structure.id,
      name: structure.name,
      description: structure.description,
      type: structure.type,
      regexPattern: structure.regexPattern || '',
      timestampField: structure.type === 'regex' 
        ? structure.fieldMappings?.timestamp?.toString() || ''
        : structure.jsonFieldMappings?.timestamp || '',
      levelField: structure.type === 'regex'
        ? structure.fieldMappings?.level?.toString() || ''
        : structure.jsonFieldMappings?.level || '',
      moduleField: structure.type === 'regex'
        ? structure.fieldMappings?.module?.toString() || ''
        : structure.jsonFieldMappings?.module || '',
      messageField: structure.type === 'regex'
        ? structure.fieldMappings?.message?.toString() || ''
        : structure.jsonFieldMappings?.message || '',
      detailsField: structure.type === 'regex'
        ? structure.fieldMappings?.details?.toString() || ''
        : structure.jsonFieldMappings?.details || ''
    });
  };
  
  const handleDeleteStructure = (structureId: string) => {
    removeUserStructure(structureId);
    setStructures(getAllStructures());
    
    // 如果删除的是当前选中的结构，清除选择
    if (selectedStructureId === structureId) {
      setSelectedStructureId(undefined);
      onStructureSelect(undefined);
    }
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  const handleFormChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };
  
  const handleSaveStructure = () => {
    // 构建新的日志解析结构
    const newStructure: LogParseStructure = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      type: formData.type
    };
    
    if (formData.type === 'regex') {
      newStructure.regexPattern = formData.regexPattern;
      newStructure.fieldMappings = {};
      
      if (formData.timestampField) newStructure.fieldMappings.timestamp = parseInt(formData.timestampField);
      if (formData.levelField) newStructure.fieldMappings.level = parseInt(formData.levelField);
      if (formData.moduleField) newStructure.fieldMappings.module = parseInt(formData.moduleField);
      if (formData.messageField) newStructure.fieldMappings.message = parseInt(formData.messageField);
      if (formData.detailsField) newStructure.fieldMappings.details = parseInt(formData.detailsField);
      
      // 添加匹配测试函数
      newStructure.matchTest = (line) => {
        try {
          const regex = new RegExp(formData.regexPattern);
          return regex.test(line);
        } catch {
          return false;
        }
      };
    } else if (formData.type === 'json') {
      newStructure.jsonFieldMappings = {};
      
      if (formData.timestampField) newStructure.jsonFieldMappings.timestamp = formData.timestampField;
      if (formData.levelField) newStructure.jsonFieldMappings.level = formData.levelField;
      if (formData.moduleField) newStructure.jsonFieldMappings.module = formData.moduleField;
      if (formData.messageField) newStructure.jsonFieldMappings.message = formData.messageField;
      if (formData.detailsField) newStructure.jsonFieldMappings.details = formData.detailsField;
      
      // 添加匹配测试函数
      newStructure.matchTest = (line) => {
        try {
          const obj = JSON.parse(line);
          return typeof obj === 'object' && obj !== null;
        } catch {
          return false;
        }
      };
    }
    
    // 添加或更新结构
    if (editingStructure) {
      removeUserStructure(editingStructure.id);
    }
    
    addUserStructure(newStructure);
    setStructures(getAllStructures());
    setDialogOpen(false);
    
    // 选择新创建/编辑的结构
    setSelectedStructureId(newStructure.id);
    onStructureSelect(newStructure.id);
  };
  
  // 渲染日志解析规则表单
  const renderStructureForm = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="名称"
              value={formData.name}
              onChange={handleFormChange('name')}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="描述"
              value={formData.description}
              onChange={handleFormChange('description')}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">结构类型</FormLabel>
              <RadioGroup
                row
                name="type"
                value={formData.type}
                onChange={handleFormChange('type')}
              >
                <FormControlLabel value="regex" control={<Radio />} label="正则表达式" />
                <FormControlLabel value="json" control={<Radio />} label="JSON" />
              </RadioGroup>
            </FormControl>
          </Grid>
          
          {formData.type === 'regex' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="正则表达式模式"
                value={formData.regexPattern}
                onChange={handleFormChange('regexPattern')}
                required
                helperText="使用捕获组()标记字段，例如：(\\d{4}-\\d{2}-\\d{2})\\s+\\[(\\w+)\\]\\s+(.*)"
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              字段映射 {formData.type === 'regex' ? '(捕获组索引)' : '(JSON字段名)'}
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="时间戳字段"
              value={formData.timestampField}
              onChange={handleFormChange('timestampField')}
              helperText={formData.type === 'regex' ? '捕获组索引 (1-based)' : 'JSON字段名'}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="日志级别字段"
              value={formData.levelField}
              onChange={handleFormChange('levelField')}
              helperText={formData.type === 'regex' ? '捕获组索引 (1-based)' : 'JSON字段名'}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="模块字段"
              value={formData.moduleField}
              onChange={handleFormChange('moduleField')}
              helperText={formData.type === 'regex' ? '捕获组索引 (1-based)' : 'JSON字段名'}
            />
          </Grid>
          
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="消息字段"
              value={formData.messageField}
              onChange={handleFormChange('messageField')}
              helperText={formData.type === 'regex' ? '捕获组索引 (1-based)' : 'JSON字段名'}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="详细信息字段"
              value={formData.detailsField}
              onChange={handleFormChange('detailsField')}
              helperText={formData.type === 'regex' ? '捕获组索引 (1-based)' : 'JSON字段名'}
            />
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">日志解析结构</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddStructure}
        >
          新建结构
        </Button>
      </Box>
      
      {parseResult && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <Chip 
              label={`已解析：${parseResult.entries.length}行`} 
              color="success" 
              variant="outlined"
            />
            {parseResult.failedLines > 0 && (
              <Chip 
                label={`解析失败：${parseResult.failedLines}行`} 
                color="error" 
                variant="outlined"
              />
            )}
            {parseResult.usedStructure && (
              <Chip 
                label={`使用结构：${parseResult.usedStructure.name}`} 
                color="primary" 
              />
            )}
          </Box>
          {parseResult.failedLines > 0 && (
            <Typography variant="body2" color="text.secondary">
              当前解析结构无法解析部分日志行。尝试选择其他结构或创建自定义结构。
            </Typography>
          )}
        </Box>
      )}
      
      <FormControl fullWidth>
        <InputLabel id="structure-select-label">选择解析结构</InputLabel>
        <Select
          labelId="structure-select-label"
          value={selectedStructureId || ''}
          onChange={handleStructureChange}
          label="选择解析结构"
        >
          <MenuItem value="">
            <em>自动检测</em>
          </MenuItem>
          {structures.map((structure) => (
            <MenuItem key={structure.id} value={structure.id}>
              {structure.name}
              {structure.id === parseResult?.usedStructure?.id && " (当前)"}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          可用的日志结构
        </Typography>
        <TableContainer sx={{ maxHeight: 200 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>名称</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>描述</TableCell>
                <TableCell width={100}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {structures.map((structure) => (
                <TableRow 
                  key={structure.id}
                  selected={structure.id === selectedStructureId}
                  hover
                >
                  <TableCell>{structure.name}</TableCell>
                  <TableCell>
                    {structure.type === 'regex' ? '正则' : 
                     structure.type === 'json' ? 'JSON' : '自定义'}
                  </TableCell>
                  <TableCell>{structure.description}</TableCell>
                  <TableCell>
                    {structure.id.startsWith('custom-') && (
                      <Box sx={{ display: 'flex' }}>
                        <Button
                          size="small"
                          onClick={() => handleEditStructure(structure)}
                          startIcon={<EditIcon />}
                        >
                          编辑
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteStructure(structure.id)}
                          startIcon={<DeleteIcon />}
                        >
                          删除
                        </Button>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* 创建/编辑结构对话框 */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingStructure ? '编辑日志结构' : '创建新的日志结构'}
        </DialogTitle>
        <DialogContent>
          {renderStructureForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleSaveStructure} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || (formData.type === 'regex' && !formData.regexPattern)}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default LogStructureSelector; 