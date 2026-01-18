# 修复 Vercel 环境变量错误提示

## 问题
即使环境变量已完整配置，仍然显示错误："环境变量'NEXT_PUBLIC_SUPABASE_URL'引用了不存在的密钥'supabase_url'。"

## 原因
这通常是 Vercel 界面的缓存问题，或者项目设置中还有其他配置引用了旧的密钥。

## 解决方案

### 方法 1：刷新页面并重新配置（推荐）

1. **完全刷新页面**
   - 按 `Ctrl + F5`（Windows）或 `Cmd + Shift + R`（Mac）强制刷新
   - 或者关闭标签页，重新打开 Vercel Dashboard

2. **检查项目设置**
   - 进入项目 → Settings → General
   - 检查是否有其他配置引用了 `@supabase_url`
   - 如果有，删除或更新它们

3. **重新添加环境变量**
   - 删除所有现有的环境变量
   - 重新添加完整的环境变量
   - 确保选择所有环境（Production、Preview、Development）

4. **点击部署**

### 方法 2：直接忽略错误并部署

如果环境变量值都是完整的，这个错误可能只是界面提示问题，不影响实际部署：

1. **点击红色错误框的 "X" 关闭提示**
2. **直接点击 "部署" 按钮**
3. **查看部署日志**，如果构建成功，说明环境变量已正确加载

### 方法 3：检查 Vercel 项目设置

1. 进入项目 → **Settings** → **General**
2. 检查以下设置：
   - **Environment Variables** - 确保没有引用 `@supabase_url`
   - **Build & Development Settings** - 检查是否有自定义配置
   - **Git** - 确保连接的是正确的仓库

3. 如果有任何引用 `@supabase_url` 的地方，删除或更新它们

### 方法 4：使用 Vercel CLI 重新配置

如果界面方法不行，可以使用 CLI：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 删除所有环境变量（如果需要）
vercel env rm NEXT_PUBLIC_SUPABASE_URL --yes
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY --yes
vercel env rm DEEPSEEK_API_KEY --yes

# 重新添加环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 输入: https://ejysjfxbwbhqgnndlbqq.supabase.co
# 选择: Production, Preview, Development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 输入: sb_publishable_zbHaQJevK9N1ZbOR2S2UhQ_f0g0aO8x
# 选择: Production, Preview, Development

vercel env add DEEPSEEK_API_KEY
# 输入: sk-ca42de48390a44e89f6be2b3db5b8542
# 选择: Production, Preview, Development

# 部署
vercel --prod --yes
```

## 验证

部署后检查：
1. ✅ 构建日志中没有环境变量相关错误
2. ✅ 部署状态为 "Ready"
3. ✅ 网站可以正常访问
4. ✅ 功能正常工作（登录、AI 聊天等）

## 如果仍然有问题

1. **查看构建日志**
   - 在 Vercel Dashboard 中点击部署
   - 查看 "Build Logs"
   - 检查是否有实际的环境变量错误

2. **联系 Vercel 支持**
   - 如果错误持续存在，可能是 Vercel 平台的问题
   - 可以在 Vercel Dashboard 中提交支持请求
