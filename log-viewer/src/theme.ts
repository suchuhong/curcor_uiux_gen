import { createTheme, PaletteMode, ThemeOptions } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';

// 定义颜色配置
const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // 亮色模式
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          error: {
            main: '#f44336',
            light: '#ffebee',
            lighter: 'rgba(244, 67, 54, 0.1)',
          },
          warning: {
            main: '#ff9800',
            light: '#fff3e0',
          },
          info: {
            main: '#2196f3',
            light: '#e3f2fd',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
          text: {
            primary: 'rgba(0, 0, 0, 0.87)',
            secondary: 'rgba(0, 0, 0, 0.6)',
          }
        }
      : {
          // 暗色模式
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#f48fb1',
          },
          error: {
            main: '#f44336',
            light: '#5f2120',
            lighter: 'rgba(244, 67, 54, 0.15)',
          },
          warning: {
            main: '#ff9800',
            light: '#4d3c19',
          },
          info: {
            main: '#2196f3',
            light: '#193247',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
          }
        }),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: mode === 'light' ? '#bfbfbf transparent' : '#6b6b6b transparent',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: 'transparent',
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: mode === 'light' ? '#bfbfbf' : '#6b6b6b',
            border: '2px solid transparent',
          },
          '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
            backgroundColor: mode === 'light' ? '#999999' : '#888888',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: mode === 'light' ? '#999999' : '#888888',
          }
        }
      }
    }
  }
});

// 创建响应系统主题首选项的钩子
export const useColorTheme = () => {
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    // 监听系统颜色主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setMode(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // 切换主题函数
  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // 创建主题
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return { theme, mode, toggleColorMode };
};

// 导出默认主题(兼容现有代码)
const theme = createTheme(getDesignTokens('light'));
export default theme; 