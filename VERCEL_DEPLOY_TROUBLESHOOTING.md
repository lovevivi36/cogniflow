# Vercel 部署故障排除指南

## 🔍 第一步：查看构建日志

**最重要**：在 Vercel Dashboard 中查看具体的错误信息

1. 进入项目 → **Deployments**
2. 点击失败的部署
3. 查看 **"Build Logs"** 标签
4. 找到红色的错误信息
5. **复制完整的错误信息**

## 常见问题和解决方案

### 问题 1：构建错误（Build Error）

#### 错误类型 A：TypeScript 错误
```
Type error: ...
```

**解决方案**：
```bash
# 本地测试构建
npm run build

# 如果有错误，修复后再推送
git add .
git commit -m "修复构建错误"
git push
```

#### 错误类型 B：依赖安装失败
```
npm ERR! ...
```

**解决方案**：
1. 检查 `package.json` 中的依赖版本
2. 确保所有依赖都是最新稳定版
3. 在 `vercel.json` 中指定 Node.js 版本

#### 错误类型 C：环境变量未定义
```
process.env.XXX is undefined
```

**解决方案**：
1. 检查 Vercel 环境变量配置
2. 确保变量名完全匹配（区分大小写）
3. 确保选择了正确的环境（Production、Preview、Development）

### 问题 2：API Routes 错误

#### 错误类型 A：函数超时
```
Function execution exceeded timeout
```

**解决方案**：
- 当前已设置 `maxDuration = 30`，如果还不够，可以增加到 60
- 优化 API 响应时间

#### 错误类型 B：DeepSeek API 调用失败
```
Failed to fetch from DeepSeek API
```

**解决方案**：
1. 检查 `DEEPSEEK_API_KEY` 是否正确
2. 检查 API Key 是否有效
3. 检查网络连接（Vercel 可能需要配置）

### 问题 3：Next.js 配置问题

#### 检查 `next.config.ts`
确保配置正确：
```typescript
const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
  },
}
```

### 问题 4：Supabase 连接问题

#### 错误类型 A：认证失败
```
Supabase auth error
```

**解决方案**：
1. 检查 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. 确保 Supabase 项目允许来自 Vercel 域名的请求
3. 检查 Supabase RLS 策略

## 🔧 快速修复步骤

### 步骤 1：本地测试构建
```bash
# 确保本地可以构建成功
npm run build

# 如果有错误，先修复本地错误
```

### 步骤 2：检查环境变量
在 Vercel Dashboard 中：
1. Settings → Environment Variables
2. 确认所有变量都存在
3. 确认值完整且正确
4. 确认选择了所有环境

### 步骤 3：更新 vercel.json（如果需要）
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 步骤 4：检查 Node.js 版本
在 `package.json` 中添加：
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 📋 需要提供的信息

如果问题仍然存在，请提供：

1. **构建日志中的完整错误信息**（最重要）
2. **失败的具体步骤**（安装依赖、构建、部署）
3. **环境变量配置截图**
4. **本地构建是否成功**（`npm run build` 的结果）

## 🚀 临时解决方案

如果急需部署，可以尝试：

1. **简化配置**
   - 暂时移除可能有问题的功能
   - 先部署一个最小可用版本

2. **使用 Vercel CLI 本地测试**
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   vercel --prod
   ```

3. **检查 Vercel 状态**
   - 访问 https://www.vercel-status.com
   - 确认 Vercel 服务正常
