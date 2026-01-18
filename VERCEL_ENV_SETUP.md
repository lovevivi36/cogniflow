# Vercel 环境变量配置指南

## 问题说明

如果你看到错误提示："环境变量'NEXT_PUBLIC_SUPABASE_URL'引用了不存在的密钥'supabase_url'"，这是因为 `vercel.json` 中使用了 Vercel 的环境变量密钥引用，但这些密钥还没有创建。

## 解决方案

### 方法 1：在 Vercel Dashboard 中直接配置（推荐）

1. **访问项目设置**
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 选择你的项目 `cogniflow`
   - 点击 "Settings" → "Environment Variables"

2. **添加环境变量**
   点击 "Add New" 添加以下三个环境变量：

   | 变量名 | 值 | 环境 |
   |--------|-----|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase 项目 URL | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 Supabase Anon Key | Production, Preview, Development |
   | `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key | Production, Preview, Development |

3. **保存并重新部署**
   - 保存所有环境变量
   - 点击 "Deployments" → 选择最新的部署 → "Redeploy"

### 方法 2：使用 Vercel CLI 配置

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 设置环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 输入你的 Supabase URL，选择所有环境（Production, Preview, Development）

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 输入你的 Supabase Anon Key，选择所有环境

vercel env add DEEPSEEK_API_KEY
# 输入你的 DeepSeek API Key，选择所有环境

# 重新部署
vercel --prod
```

## 如何获取环境变量值

### Supabase 配置

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 点击 "Settings" → "API"
4. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### DeepSeek API Key

1. 访问 [DeepSeek 控制台](https://platform.deepseek.com)
2. 登录你的账号
3. 在 API Keys 页面创建或查看你的 API Key
4. 复制 API Key → `DEEPSEEK_API_KEY`

## 验证配置

配置完成后，重新部署项目。如果配置正确，你应该能够：

1. ✅ 成功构建项目
2. ✅ 访问部署的网站
3. ✅ 正常使用登录功能
4. ✅ AI 聊天功能正常工作

## 注意事项

- `NEXT_PUBLIC_` 前缀的变量会暴露给客户端，确保这些是公开的密钥
- `DEEPSEEK_API_KEY` 是服务端变量，不会暴露给客户端
- 修改环境变量后需要重新部署才能生效
- 建议为 Production、Preview、Development 环境分别配置（可以使用相同的值）
