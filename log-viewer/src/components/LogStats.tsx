import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { LogModule } from '../types/LogTypes';

interface LogStatsProps {
  modules: LogModule[];
}

const COLORS = {
  info: '#2196f3',
  warn: '#ff9800',
  error: '#f44336',
  debug: '#9e9e9e'
};

const LogStats: React.FC<LogStatsProps> = ({ modules }) => {
  // 计算日志级别统计数据
  const levelStats = {
    info: 0,
    warn: 0,
    error: 0,
    debug: 0
  };

  modules.forEach(module => {
    levelStats.info += module.stats.info;
    levelStats.warn += module.stats.warn;
    levelStats.error += module.stats.error;
    levelStats.debug += module.stats.debug;
  });

  const levelData = Object.entries(levelStats).map(([level, count]) => ({
    name: level,
    value: count
  }));

  // 计算模块统计数据
  const moduleData = modules
    .map(module => ({
      name: module.name,
      total: module.entries.length,
      info: module.stats.info,
      warn: module.stats.warn,
      error: module.stats.error,
      debug: module.stats.debug
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // 只显示前10个模块

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        日志统计信息
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, mt: 2 }}>
        {/* 日志级别饼图 */}
        <Box sx={{ flex: 1, height: 300, mb: { xs: 2, md: 0 } }}>
          <Typography variant="subtitle1" align="center" gutterBottom>
            日志级别分布
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={levelData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {levelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}条日志`, '数量']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* 模块统计条形图 */}
        <Box sx={{ flex: 1.5, height: 300 }}>
          <Typography variant="subtitle1" align="center" gutterBottom>
            模块日志分布 (Top 10)
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={moduleData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="info" fill={COLORS.info} stackId="a" name="信息" />
              <Bar dataKey="warn" fill={COLORS.warn} stackId="a" name="警告" />
              <Bar dataKey="error" fill={COLORS.error} stackId="a" name="错误" />
              <Bar dataKey="debug" fill={COLORS.debug} stackId="a" name="调试" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
};

export default LogStats; 