import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Chip
} from '@mui/material';
import { LogModule } from '../types/LogTypes';

interface ModuleListProps {
  modules: LogModule[];
  selectedModule: string | null;
  onModuleSelect: (moduleName: string) => void;
}

const ModuleList: React.FC<ModuleListProps> = ({
  modules,
  selectedModule,
  onModuleSelect
}) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        模块列表
      </Typography>
      <List>
        {modules.map((module) => (
          <ListItem key={module.name} disablePadding>
            <ListItemButton
              selected={module.name === selectedModule}
              onClick={() => onModuleSelect(module.name)}
            >
              <ListItemText
                primary={module.name}
                secondary={
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Object.entries(module.stats).map(([level, count]) => (
                      count > 0 && (
                        <Chip
                          key={level}
                          label={`${level}: ${count}`}
                          size="small"
                          color={
                            level === 'error'
                              ? 'error'
                              : level === 'warn'
                              ? 'warning'
                              : level === 'info'
                              ? 'info'
                              : 'default'
                          }
                        />
                      )
                    ))}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default ModuleList; 