# 部署指南

## Web 部署（Vercel）

### 前置条件

1. GitHub 账号
2. Vercel 账号（可通过 GitHub 登录）
3. Supabase 项目已配置
4. DeepSeek API Key

### 部署步骤

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **在 Vercel 中导入项目**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New Project"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 项目

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase Anon Key
   - `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成
   - 访问提供的 URL

### 环境变量配置（Vercel CLI）

如果你使用 Vercel CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DEEPSEEK_API_KEY

# 部署
vercel --prod
```

## Electron 应用打包

### Windows

```bash
npm run electron:build:win
```

输出文件：`dist/CogniFlow-<version>-x64.exe`

### macOS

```bash
npm run electron:build:mac
```

输出文件：`dist/CogniFlow-<version>-x64.dmg` 或 `CogniFlow-<version>-arm64.dmg`

### Linux

```bash
npm run electron:build:linux
```

输出文件：`dist/CogniFlow-<version>-x64.AppImage`

### 注意事项

1. **图标文件**：需要在 `build/` 目录下放置图标文件：
   - Windows: `icon.ico`
   - macOS: `icon.icns`
   - Linux: `icon.png`

2. **代码签名**（可选）：
   - Windows: 需要代码签名证书
   - macOS: 需要 Apple Developer 账号
   - Linux: 通常不需要

3. **自动更新**（可选）：
   可以集成 `electron-updater` 实现自动更新功能

## 故障排除

### Vercel 部署问题

1. **构建失败**
   - 检查环境变量是否正确配置
   - 查看构建日志中的错误信息
   - 确保 `package.json` 中的构建脚本正确

2. **API 路由不工作**
   - 确保 API 路由在 `app/api/` 目录下
   - 检查 Vercel 函数日志

3. **环境变量未生效**
   - 确保变量名以 `NEXT_PUBLIC_` 开头（客户端变量）
   - 重新部署项目

### Electron 打包问题

1. **TypeScript 编译错误**
   ```bash
   npm run electron:compile
   ```

2. **找不到图标文件**
   - 创建 `build/` 目录
   - 放置相应的图标文件

3. **打包文件过大**
   - 检查 `electron-builder.yml` 中的 `files` 配置
   - 排除不必要的文件

## 持续集成/持续部署 (CI/CD)

### GitHub Actions 示例

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```
