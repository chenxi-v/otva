<h1 align="center">
  <img src="https://cdn.ouonnki.site/gh/Ouonnki/blog-pictures/posts/logo.svg" alt="OuonnkiTV Logo" width="80"/><br/>
  OuonnkiTV
</h1>

<p align="center">
  基于OuonnkiTV修改，添加数据库支持，API数据显示（类似lunaTV的源浏览器但是支持自动识别分类和子分类）。
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue" alt="License"/></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen" alt="Node.js >=20"/>
  <img src="https://img.shields.io/badge/pnpm-%3E%3D9.15.4-blue" alt="pnpm >=9.15.4"/>
  <img src="https://img.shields.io/badge/vite-%5E6.3.5-yellowgreen" alt="Vite"/>
  <a href="https://github.com/Ouonnki/OuonnkiTV/stargazers"><img src="https://img.shields.io/github/stars/Ouonnki/OuonnkiTV?style=social" alt="GitHub stars"/></a>
</p>

<p align="center">
  <a href="#-简介">简介</a> ·
  <a href="#-特性">特性</a> ·
  <a href="#-部署">部署</a> ·
  <a href="#-更新同步">更新</a> ·
  <a href="#-视频源导入">导入</a> ·
  <a href="#-自定义样式">样式</a> ·
  <a href="#-给开发者">开发</a>
</p>

---

<details>
<summary><strong>📑 目录</strong></summary>

- [📖 简介](#-简介)
- [✨ 特性](#-特性)
- [🚀 部署](#-部署)
  - [Vercel 部署](#vercel-部署)
  - [Cloudflare Pages 部署](#cloudflare-pages-部署)
  - [Netlify 部署](#netlify-部署)
  - [Docker 部署](#docker-部署)
  - [本地运行](#本地运行)
- [🔄 更新同步](#-更新同步)
- [📥 视频源导入](#-视频源导入)
- [☁️ 云端同步](#️-云端同步)
- [🎨 自定义样式](#-自定义样式)
  - [主题颜色](#主题颜色)
  - [播放器样式](#播放器样式)
  - [布局调整](#布局调整)
- [⚙️ 配置管理](#️-配置管理)
- [👨‍💻 给开发者](#-给开发者)
- [📜 其他](#-其他)

</details>

## 📖 简介

**OuonnkiTV** 是一个现代化的视频聚合搜索与播放前端应用，基于 **React 19 + Vite 6 + TypeScript** 构建。

本项目在 OuonnkiTV 的基础上进行了多项修改：

- 🎨 **视觉优化** - 自定义视频播放器主题（绿色进度条、隐藏通知栏）
- 📱 **移动端适配** - 海报尺寸优化、布局居中、触摸友好的交互
- 🌙 **深色模式** - 完整的深色主题支持，全页面统一
- ☁️ **云端同步** - Upstash Redis 支持，跨设备同步观看记录和设置
- 📊 **数据分析** - Vercel Analytics & Speed Insights 集成
- ⚡ **性能优化** - 响应式布局、流畅动画、快速加载

## ✨ 特性

### 核心功能
- **🔍 聚合搜索** - 多源并发搜索，自动去重，快速定位内容
- **▶️ 流畅播放** - 基于 Artplayer，支持 HLS/MP4，自适应码率
- **📱 横屏播放** - 手机端支持横屏全屏播放，自动旋转适配
- **🎨 自定义主题** - 播放器主题色、控制栏样式、进度条颜色可配置
- **📱 响应式设计** - 移动端/桌面端自适应布局，海报尺寸智能调整
- **🌙 深色模式** - 全页面深色主题支持，自动/手动切换
- **📥 批量导入** - 支持文件/文本/URL 多种方式导入视频源
- **🕒 智能记录** - 自动保存观看历史与搜索记录，便于追溯
- **☁️ 云端同步** - 基于 Upstash Redis 的跨设备数据同步
- **🚀 高性能优化** - 代码分割、懒加载、并发控制
- **💾 状态持久化** - 基于 Zustand 的状态管理，数据本地存储
- **📊 访问统计** - Vercel Analytics 数据分析与性能监控

### 播放器特性
- ✅ 绿色渐变进度条和音量控制
- ✅ 隐藏播放/暂停通知栏
- ✅ 全屏模式自动隐藏进度条（鼠标悬停显示）
- ✅ 控制栏按钮样式优化
- ✅ 移动端控制栏自适应收缩
- ✅ 自动续播下一集
- ✅ 广告过滤支持

## 🚀 部署

### Vercel 部署

**部署步骤：**
1. Fork 本仓库到您的 GitHub 账户
2. 登录 Vercel，点击 "New Project"
3. 导入您的 GitHub 仓库
4. 配置构建选项：
   - Install Command: `pnpm install`
   - Build Command: `pnpm build`
   - Output Directory: `dist`
5. （可选）配置环境变量
6. 点击 "Deploy" 开始部署

### Cloudflare Pages 部署

1. Fork 本仓库到您的 GitHub 账户
2. 登录 Cloudflare Dashboard，进入 **Workers & Pages**
3. 点击 **Create application** -> **Pages** -> **Connect to Git**
4. 选择您的仓库
5. 配置构建选项：
   - **Framework preset**: `Vite`
   - **Build command**: `pnpm run build`
   - **Build output directory**: `dist`
6. 点击 **Save and Deploy**
7. 
**环境变量配置**（可选）：

1. 复制环境变量示例文件：
   ```bash
   copy .env.example .env
   ```

2. 编辑 `.env` 文件：
   ```env
   # 初始视频源（单行 JSON 格式）
   VITE_INITIAL_VIDEO_SOURCES=[{"name":"示例源","url":"https://api.example.com","isEnabled":true}]
   
   # 禁用分析（建议开启）
   VITE_DISABLE_ANALYTICS=true

   # 访问用户名和密码（可选，用于登录保护）
   VITE_ACCESS_USERNAME=your_username
   VITE_ACCESS_PASSWORD=your_secure_password
   
   # Upstash Redis 配置（用于云端同步）
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

3. 构建并启动：
   ```bash
   docker-compose up -d --build
   ```
### 本地运行

**环境要求：**
- Node.js >= 20.0.0
- pnpm >= 9.15.4

```bash
# 克隆仓库
git clone https://github.com/Ouonnki/OuonnkiTV.git
cd OuonnkiTV

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

## 🔄 更新同步

### Vercel 更新
- **自动更新**：每次推送到主分支时自动重新部署
- **手动更新**：进入 Vercel 项目控制台 → "Deployments" → "Redeploy"

### Docker 更新
```bash
docker-compose pull
docker-compose up -d
```

### Fork 同步
项目内置自动同步工作流（`.github/workflows/sync.yml`）：
- **自动触发**：每日 UTC 02:00
- **手动触发**：Actions → "Sync Upstream" → Run workflow

## 📥 视频源导入

### 应用内导入

1. 点击右上角设置图标进入设置页面
2. 点击"导入源"按钮
3. 选择导入方式：
   - 📁 **本地文件导入** - 支持 `.json` 格式文件
   - 📝 **JSON 文本导入** - 直接粘贴 JSON 配置
   - 🌐 **URL 导入** - 从远程 URL 获取配置

### JSON 格式说明

```json
[
  {
    "id": "source1",
    "name": "示例视频源",
    "url": "https://api.example.com/search",
    "detailUrl": "https://api.example.com/detail",
    "isEnabled": true
  }
]
```

| 字段 | 必需 | 说明 |
| ---- | ---- | ---- |
| `name` | 是 | 视频源显示名称 |
| `url` | 是 | 搜索 API 地址 |
| `detailUrl` | 否 | 详情 API 地址（默认使用 url） |
| `isEnabled` | 否 | 是否启用（默认 true） |

## ☁️ 云端同步

本项目支持基于 **Upstash Redis** 的云端数据同步功能：

### 功能特性
- 🔄 **自动同步** - 观看记录、搜索历史、应用设置自动同步到云端
- 📱 **跨设备** - 在不同设备上登录，数据自动同步
- ⚡ **实时更新** - 数据变更后自动推送至云端
- 🔒 **安全存储** - 基于 Upstash Redis 的安全数据存储

### 配置方法

1. 注册 [Upstash](https://upstash.com/) 账号
2. 创建 Redis 数据库
3. 获取 REST URL 和 REST Token
4. 配置环境变量：
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```
5. 重新部署应用

### 使用说明
- 在设置页面开启"云端同步"功能
- 登录后数据自动同步
- 支持手动触发同步操作

## 🎨 自定义样式

本项目经过多轮 UI/UX 优化，主要样式文件：

### 主题颜色

**播放器主题色**（绿色进度条）：
- 文件：`src/pages/Video.tsx`
- 配置：`theme: '#22c55e'`

**深色模式**：
- 自动检测系统主题
- 手动切换：设置页面 → 主题设置
- 全页面统一深色样式

### 播放器样式

**自定义样式文件**：`src/styles/main.css`

主要优化项：
- ✅ 绿色渐变进度条和音量控制
- ✅ 隐藏播放/暂停通知栏
- ✅ 全屏模式自动隐藏进度条（鼠标悬停显示）
- ✅ 控制栏按钮样式优化
- ✅ 移动端控制栏自适应
- ✅ 横屏自动全屏播放支持

### 布局调整

**首页布局**（`src/App.tsx`）：
- 标题和搜索框居中显示
- 分类按钮居中排列
- 移动端海报尺寸优化（更大的显示区域）

**视频详情页**（`src/pages/Detail.tsx`）：
- 选集按钮：黑色背景 + 白色文字
- 返回按钮：黑色背景 + 白色文字

## ⚙️ 配置管理

### 环境变量

```env
# 完整配置（推荐）
VITE_INITIAL_CONFIG='{"settings":{...},"videoSources":[...]}'

# 独立配置项
VITE_INITIAL_VIDEO_SOURCES=[{"name":"源1","url":"..."}]
VITE_DEFAULT_TIMEOUT=5000
VITE_DEFAULT_RETRY=3

# 云端同步（Upstash Redis）
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# 数据分析
VITE_DISABLE_ANALYTICS=true  # 禁用 Vercel Analytics

# 访问控制（可选，用于登录保护）
VITE_ACCESS_USERNAME=your_username
VITE_ACCESS_PASSWORD=your_secure_password
```

### 恢复默认配置

设置 → 关于项目 → 配置操作 → 恢复默认配置

## 👨‍💻 给开发者

### 技术栈

| 技术 | 版本 | 用途 |
| ---- | ---- | ---- |
| React | 19 | 前端框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 6 | 构建工具 |
| TailwindCSS | 4 | 样式框架 |
| HeroUI | 2.8 | UI 组件库 |
| Framer Motion | 12 | 动画库 |
| Artplayer | 5.3 | 视频播放器 |
| Zustand | 5 | 状态管理 |
| React Router | 7 | 路由管理 |
| Upstash Redis | 1.36 | 云端数据同步 |
| Vercel Analytics | 1.5 | 数据分析 |

### 项目结构

```text
OuonnkiTV/
├─ api/                      # Vercel Serverless Functions
│  ├─ proxy.ts              # Vercel 代理接口
│  └─ db.ts                 # Upstash Redis 数据库接口
├─ src/
│  ├─ components/           # React 组件
│  │  ├─ CategorySection.tsx    # 分类视频列表
│  │  ├─ XmlCategorySection.tsx # XML 分类列表
│  │  └─ ...
│  ├─ pages/                # 页面组件
│  │  ├─ Video.tsx          # 视频播放页（播放器配置）
│  │  ├─ Detail.tsx         # 视频详情页
│  │  └─ ...
│  ├─ styles/               # 样式文件
│  │  └─ main.css           # 播放器自定义样式
│  ├─ services/             # 服务层
│  │  ├─ api.service.ts     # API 请求服务
│  │  └─ db.service.ts      # 数据库服务（云端同步）
│  ├─ hooks/                # 自定义 Hooks
│  │  └─ useCloudSync.ts    # 云端同步 Hook
│  ├─ store/                # Zustand 状态管理
│  ├─ config/               # 配置文件
│  │  ├─ api.config.ts      # API 配置
│  │  └─ analytics.config.ts # 数据分析配置
│  └─ types/                # TypeScript 类型定义
├─ proxy-server.js          # Docker 代理服务器
├─ nginx.conf               # Nginx 配置
└─ docker-compose.yml       # Docker Compose 配置
```

### 常用命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产环境构建
pnpm preview      # 预览构建结果
pnpm lint         # ESLint 代码检查
```

### 提交规范

- `feat:` 新功能
- `fix:` 修复 Bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构代码
- `perf:` 性能优化

### 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源协议。

### 免责声明

本项目仅作为视频搜索与聚合工具，不存储、上传或分发任何视频内容。所有视频内容均来自第三方 API 的搜索结果。

- ❌ 本项目不提供任何视频源
- ❌ 本项目不托管任何视频内容
- ❌ 本项目不对视频内容负责

---

<p align="center">
  如果本项目对你有帮助，欢迎 ⭐ Star 支持！
</p>
