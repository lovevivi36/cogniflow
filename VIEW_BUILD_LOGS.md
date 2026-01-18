# 如何查看 Vercel 构建日志

## 📍 步骤 1：访问 Vercel Dashboard

1. 打开浏览器，访问：**https://vercel.com/dashboard**
2. 使用你的 GitHub 账号登录

## 📍 步骤 2：找到你的项目

1. 在项目列表中找到 **`cogniflow`** 项目
2. 点击项目名称进入项目详情页

## 📍 步骤 3：查看部署记录

1. 点击顶部的 **"Deployments"** 标签
2. 你会看到所有部署记录的列表
3. 找到最新的部署（通常是第一个，显示为 "Building" 或 "Error" 状态）

## 📍 步骤 4：查看构建日志

1. 点击最新的部署记录
2. 在部署详情页面，你会看到几个标签：
   - **Overview** - 部署概览
   - **Build Logs** - **构建日志（这里！）**
   - **Function Logs** - 函数日志
   - **Analytics** - 分析数据

3. 点击 **"Build Logs"** 标签

## 📍 步骤 5：查找错误信息

在构建日志中：

1. **查找红色错误信息**
   - 错误通常以红色显示
   - 可能包含 "Error"、"Failed"、"Type error" 等关键词

2. **查看完整的错误堆栈**
   - 点击错误信息可以展开查看详情
   - 复制完整的错误信息

3. **常见错误位置**
   - 安装依赖阶段：`npm install` 相关错误
   - 构建阶段：`npm run build` 相关错误
   - TypeScript 错误：`Type error: ...`
   - 环境变量错误：`process.env.XXX is undefined`

## 📋 需要复制的信息

请复制以下信息：

1. **错误标题**（第一行红色文字）
2. **完整的错误堆栈**（展开后的详细信息）
3. **错误发生的阶段**（Installing / Building / Deploying）
4. **任何相关的警告信息**

## 🔍 示例：如何识别常见错误

### TypeScript 错误
```
Type error: Property 'xxx' does not exist on type 'yyy'.
```

### 环境变量错误
```
Error: process.env.NEXT_PUBLIC_SUPABASE_URL is undefined
```

### 依赖安装错误
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

### 构建超时
```
Error: Command "npm run build" exceeded maximum execution time
```

## 💡 快速链接

- **Vercel Dashboard**: https://vercel.com/dashboard
- **项目直接链接**: https://vercel.com/dashboard/lovevivi36/cogniflow
- **部署记录**: https://vercel.com/dashboard/lovevivi36/cogniflow/deployments

## 📸 截图说明

如果方便，也可以：
1. 截图构建日志的错误部分
2. 或者直接复制粘贴错误文本

这样我可以更准确地帮你诊断问题！
