# CogniFlow (智流)

结合 FSRS 记忆算法与费曼学习法的深度学习工具。

## 项目状态

✅ 项目初始化已完成

## 技术栈

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Shadcn/UI
- **Backend/Database**: Supabase (PostgreSQL, Auth, Edge Functions)
- **AI Integration**: Vercel AI SDK (Streaming text)
- **Algorithm**: FSRS v5 (ts-fsrs)
- **State**: Zustand (Global), Nuqs (URL state)

## 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── auth/             # 认证相关组件
│   └── ui/               # Shadcn/UI 组件
├── lib/                   # 工具函数和配置
│   ├── supabase/         # Supabase 客户端配置
│   │   ├── server.ts     # 服务端客户端
│   │   └── client.ts     # 浏览器客户端
│   └── utils.ts          # 工具函数
├── supabase/             # Supabase 配置
│   └── migrations/       # 数据库迁移文件
│       └── 001_init.sql  # 初始数据库 Schema
└── middleware.ts         # Next.js 中间件（路由保护）

```

## 环境变量配置

创建 `.env.local` 文件并添加以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 数据库 Schema

项目包含以下数据表：

- **profiles**: 用户扩展信息（xp, streak）
- **decks**: 牌组
- **cards**: 核心卡片表（包含 FSRS 参数：stability, difficulty, due_date, state）
- **study_logs**: 复习记录（包含费曼对话历史）

所有表都启用了 Row Level Security (RLS)，确保用户只能访问自己的数据。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# Electron 开发
npm run electron:dev          # 启动 Electron 开发模式
npm run electron:build        # 构建 Electron 应用（所有平台）
npm run electron:build:win   # 仅构建 Windows
npm run electron:build:mac    # 仅构建 macOS
npm run electron:build:linux  # 仅构建 Linux
```

## 部署

### Web 部署（Vercel）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 配置环境变量（见 `vercel.json`）
4. 自动部署完成

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 下一步

1. 配置 Supabase 项目并运行迁移文件
2. 实现用户认证流程
3. 开发卡片创建和管理功能
4. 实现费曼模式对话界面
5. 集成 FSRS v5 算法计算复习间隔

## 编码规范

请参考 `.cursorrules` 文件了解详细的编码规范。
