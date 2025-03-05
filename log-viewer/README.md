# Log Viewer

一个现代化的日志文件查看器，支持模块化展示和可视化分析。

## 功能特点

- 📁 支持拖放上传日志文件
- 📊 按模块分类展示日志
- 🔍 强大的搜索和过滤功能
- 📈 日志级别统计和可视化
- 🎨 美观的 Material Design 界面
- 🌈 不同日志级别的颜色区分
- 📱 响应式设计，支持各种设备

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 即可使用应用。

### 构建生产版本

```bash
npm run build
```

## 使用指南

### 1. 文件上传

- 支持的文件格式：`.log` 和 `.txt`
- 上传方式：
  - 点击上传区域选择文件
  - 直接拖放文件到上传区域

### 2. 日志格式支持

应用支持两种主要的日志格式：

#### JSON 格式

每行一个 JSON 对象，包含以下字段：
```json
{
  "timestamp": "2024-01-20T10:15:30.123Z",
  "level": "info",
  "module": "UserService",
  "message": "User login successful",
  "details": {
    "userId": "123",
    "ip": "192.168.1.1"
  }
}
```

#### 文本格式

使用以下格式：
```
TIMESTAMP [LEVEL] MODULE - MESSAGE
```

示例：
```
2024-01-20T10:15:30.123Z [INFO] UserService - User login successful
2024-01-20T10:15:31.456Z [ERROR] DatabaseService - Connection failed
```

### 3. 界面功能

#### 模块列表（左侧边栏）

- 显示所有检测到的日志模块
- 每个模块显示日志数量统计
- 按日志级别（info、warn、error、debug）分类显示
- 点击模块切换查看对应日志

#### 日志查看器（主区域）

- 表格式展示日志内容
- 列表项包含：
  - 时间戳
  - 日志级别（带颜色标识）
  - 消息内容
  - 详细信息（可展开）
- 搜索功能：
  - 支持按消息内容过滤
  - 支持按日志级别过滤
- 特殊标记：
  - 错误日志使用特殊背景色标注
  - 包含详细信息的日志条目显示展开按钮

### 4. 日志级别说明

- 🔵 INFO：普通信息日志
- 🟡 WARN：警告信息
- 🔴 ERROR：错误信息
- ⚪ DEBUG：调试信息

## 示例日志

### JSON 格式示例

```json
{"timestamp": "2024-01-20T10:15:30.123Z", "level": "info", "module": "UserService", "message": "User login successful", "details": {"userId": "123", "ip": "192.168.1.1"}}
{"timestamp": "2024-01-20T10:15:31.456Z", "level": "error", "module": "DatabaseService", "message": "Connection failed", "details": {"error": "timeout"}}
{"timestamp": "2024-01-20T10:15:32.789Z", "level": "warn", "module": "CacheService", "message": "Cache miss", "details": {"key": "user:123"}}
```

### 文本格式示例

```
2024-01-20T10:15:30.123Z [INFO] UserService - User login successful
2024-01-20T10:15:31.456Z [ERROR] DatabaseService - Connection failed
2024-01-20T10:15:32.789Z [WARN] CacheService - Cache miss
```

## 技术栈

- React 18
- TypeScript
- Material-UI (MUI)
- Vite
- React Dropzone
- Recharts (图表可视化)

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证

ISC License 