import React, { useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';

interface LogUploaderProps {
  onUpload: (content: string) => void;
}

const LogUploader: React.FC<LogUploaderProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        onUpload(content);
      };
      reader.readAsText(file);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/*': ['.log', '.txt'] },
    multiple: false
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 1,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover'
        }
      }}
    >
      <input {...getInputProps()} />
      <Typography variant="h6" gutterBottom>
        {isDragActive ? '拖放文件到这里' : '点击或拖放日志文件到这里'}
      </Typography>
      <Button variant="contained" color="primary">
        选择文件
      </Button>
    </Box>
  );
};

export default LogUploader; 