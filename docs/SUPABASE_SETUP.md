# Supabase 配置指南

## 1. 创建项目

1. 登录 [Supabase](https://supabase.com/)，创建一个新项目。
2. 打开项目的 **SQL Editor**。
3. 执行项目中的 `supabase/migrations/001_user_module_data.sql`。
4. 在 **Project Settings → API** 复制：
   - Project URL
   - Publishable key 或 anon key

不要复制或暴露 `service_role` key。前端只需要 publishable/anon key。

## 2. 本地配置

在项目根目录创建 `.env.local`：

```text
VITE_SUPABASE_URL=https://你的项目编号.supabase.co
VITE_SUPABASE_ANON_KEY=你的publishable或anon-key
```

然后重启 Vite：

```bash
npm run dev
```

没有配置这两个变量时，项目会使用本地开发模式；配置完成后，注册、登录和三类个人模块会切换到 Supabase。

## 3. 认证设置

在 Supabase **Authentication → Providers → Email** 中确认 Email provider 已启用。

如果希望注册后直接进入工作台，可以关闭 **Confirm email**。如果保持开启，用户需要先完成邮箱验证，再使用登录操作进入工作台。

在 **Authentication → URL Configuration** 中配置：

- **Site URL**：生产环境站点地址，例如 `https://your-app.vercel.app`
- **Redirect URLs**：加入生产地址及本地开发地址，例如 `https://your-app.vercel.app/**` 和 `http://localhost:5173/**`

邮箱验证和忘记密码都会使用这些回跳地址。Supabase 免费计划可使用这些认证能力，但内置邮件服务有发送频率和收件人限制，适合开发验证。面向真实用户时，请在 **Authentication → SMTP Settings** 配置一个提供免费额度的 SMTP 服务，并按该服务的免费额度控制邮件量；本项目不依赖任何付费邮件 API。

## 4. Vercel 配置

进入 Vercel 项目的 **Settings → Environment Variables**，分别为 Preview 和 Production 添加：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

添加或修改环境变量后必须重新部署，因为 Vite 会在构建阶段把公开配置写入前端构建产物。

## 5. 数据边界

Supabase 的 `user_module_data` 只保存当前登录用户的：

- `teaching`：教学工作
- `homeroom`：班主任
- `workspace`：工作区管理

AI 与应用集合仍然是公共数据。表启用 RLS 后，用户只能读取和写入自己的三类模块。

## 6. 双设备验收

1. 在电脑注册或登录账号 A。
2. 在电脑的教师工作台新增一条课表、学生或班级通知数据。
3. 在手机使用同一个账号 A 登录。
4. 刷新或重新进入工作台，确认数据出现。
5. 在手机修改该数据，回到电脑刷新确认更新。
6. 使用账号 B 登录，确认看不到账号 A 的教学、班主任和工作区数据。
7. 确认账号 B 仍能看到公共 AI 与应用集合。

如果 Supabase 暂时不可用，工作台会继续使用当前浏览器的本地缓存，并保留同步错误状态；恢复网络后再次进入或触发保存即可重试。
