# 重新部署指南

## 方法 1：在 Vercel Dashboard 中重新部署（最简单）

### 步骤：

1. **访问 Vercel Dashboard**
   - 打开 https://vercel.com/dashboard
   - 登录你的账号

2. **找到你的项目**
   - 在项目列表中找到 `cogniflow` 项目
   - 点击进入项目详情页

3. **重新部署**
   - 点击顶部的 "Deployments" 标签
   - 找到最新的部署记录（通常是第一个）
   - 点击右侧的 **"..."** 菜单
   - 选择 **"Redeploy"**
   - 确认重新部署

4. **等待部署完成**
   - 部署通常需要 2-5 分钟
   - 可以在部署页面查看实时日志
   - 部署完成后会显示绿色的 "Ready" 状态

## 方法 2：使用 Vercel CLI（需要登录）

如果你已经配置了 Vercel CLI：

```bash
# 登录（如果还没登录）
npx vercel login

# 链接项目（如果还没链接）
npx vercel link

# 重新部署到生产环境
npx vercel --prod --yes
```

## 验证部署

部署完成后：

1. ✅ 检查部署状态是否为 "Ready"
2. ✅ 访问部署的 URL（例如：`https://cogniflow.vercel.app`）
3. ✅ 测试登录功能
4. ✅ 测试 AI 聊天功能

## 如果部署失败

1. **查看构建日志**
   - 在 Vercel Dashboard 中点击失败的部署
   - 查看 "Build Logs" 了解错误信息

2. **常见问题**
   - 环境变量未正确配置 → 检查 Settings → Environment Variables
   - 构建错误 → 检查构建日志中的具体错误
   - API 路由错误 → 检查环境变量是否正确加载

3. **重新配置环境变量**
   - 如果环境变量有问题，在 Settings → Environment Variables 中修改
   - 修改后需要重新部署才能生效
