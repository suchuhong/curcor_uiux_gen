import React, { useState } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import LogUploader from './components/LogUploader';
import ModuleList from './components/ModuleList';
import LogViewer from './components/LogViewer';
import { LogEntry, LogModule } from './types/LogTypes';
import { parseLogFile, groupLogsByModule } from './utils/logParser';

const App: React.FC = () => {
  const [modules, setModules] = useState<LogModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const handleFileUpload = (content: string) => {
    const logs = parseLogFile(content);
    const groupedLogs = groupLogsByModule(logs);
    setModules(groupedLogs);
    if (groupedLogs.length > 0) {
      setSelectedModule(groupedLogs[0].name);
    }
  };

  const selectedLogs = modules.find(m => m.name === selectedModule)?.entries || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Log Viewer
      </Typography>
      <Box sx={{ mb: 3 }}>
        <LogUploader onUpload={handleFileUpload} />
      </Box>
      {modules.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Paper sx={{ width: 250, p: 2 }}>
            <ModuleList
              modules={modules}
              selectedModule={selectedModule}
              onModuleSelect={setSelectedModule}
            />
          </Paper>
          <Paper sx={{ flex: 1, p: 2 }}>
            <LogViewer logs={selectedLogs} />
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default App; 