# 快速开始指南

## 🚀 立即部署到 Vercel

### 步骤 1: 创建 GitHub 仓库

1. 访问 [GitHub](https://github.com/new)
2. 创建新仓库（例如：`cogniflow`）
3. **不要**初始化 README、.gitignore 或 license（我们已经有了）

### 步骤 2: 推送代码到 GitHub

```bash
# 添加远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO_NAME）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 推送代码
git branch -M main
git push -u origin main
```

### 步骤 3: 在 Vercel 中部署

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New Project"
4. 选择你的仓库
5. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase Anon Key
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek API Key
6. 点击 "Deploy"

### 步骤 4: 等待部署完成

部署通常需要 2-5 分钟。完成后，你会得到一个 URL，例如：
`https://cogniflow.vercel.app`

## 📦 构建 Electron 应用

### Windows

```bash
npm run electron:build:win
```

输出文件：`dist/CogniFlow-0.1.0-x64.exe`

### macOS

```bash
npm run electron:build:mac
```

输出文件：`dist/CogniFlow-0.1.0-x64.dmg` 或 `CogniFlow-0.1.0-arm64.dmg`

### Linux

```bash
npm run electron:build:linux
```

输出文件：`dist/CogniFlow-0.1.0-x64.AppImage`

## 🔧 本地开发

### 启动 Web 开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

### 启动 Electron 开发模式

```bash
npm run electron:dev
```

这会同时启动 Next.js 开发服务器和 Electron 应用。

## 📝 环境变量配置

创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ❓ 需要帮助？

- 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细部署步骤
- 查看 [SETUP_SUMMARY.md](./SETUP_SUMMARY.md) 了解项目设置总结
- 查看 [README.md](./README.md) 了解项目详情
