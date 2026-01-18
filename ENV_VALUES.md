# 环境变量值

## 你的环境变量配置

### 1. NEXT_PUBLIC_SUPABASE_URL
```
https://ejysjfxbwbhqgnndlbqq.supabase.co
```

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
sb_publishable_zbHaQJevK9N1ZbOR2S2UhQ_f0g0aO8x
```

### 3. DEEPSEEK_API_KEY
```
sk-ca42de48390a44e89f6be2b3db5b8542
```

## 在 Vercel 中配置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `cogniflow`
3. 进入 "Settings" → "Environment Variables"
4. 添加以下三个变量：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ejysjfxbwbhqgnndlbqq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_zbHaQJevK9N1ZbOR2S2UhQ_f0g0aO8x` |
| `DEEPSEEK_API_KEY` | `sk-ca42de48390a44e89f6be2b3db5b8542` |

5. 选择环境：**Production, Preview, Development**（全部勾选）
6. 保存后重新部署

## 本地开发配置

如果需要本地开发，创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://ejysjfxbwbhqgnndlbqq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_zbHaQJevK9N1ZbOR2S2UhQ_f0g0aO8x
DEEPSEEK_API_KEY=sk-ca42de48390a44e89f6be2b3db5b8542
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ⚠️ 安全提示

- 这些密钥已经暴露在代码仓库中，建议：
  1. 如果这是公开仓库，考虑重新生成新的密钥
  2. 确保 Supabase 的 RLS (Row Level Security) 已正确配置
  3. DeepSeek API Key 有使用限制，注意保护
