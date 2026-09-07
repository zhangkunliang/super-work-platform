# super-work-platform 部署指南

本项目是 Vite 静态应用。生产构建会生成以下内容：

- `dist/index.html`：首页动画、登录和注册入口
- `dist/教师工作台.html`：登录后的教师工作台
- `dist/pic/`：Hello Kitty、工具头像和其它本地图片
- `dist/assets/`：Vite 构建后的 JavaScript 和 CSS

如果启用跨设备账号同步，还需要配置 Supabase。完整步骤见 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)。

## 发布前检查

在项目根目录执行：

```bash
npm ci
npm run lint
npm test -- --run
npm run build
npm run preview -- --host 0.0.0.0
```

打开 `http://localhost:4173/`，确认首页、登录注册、教师工作台、移动端菜单和图片资源正常。

构建完成后可以检查关键文件：

```bash
dist/index.html
dist/教师工作台.html
dist/pic/no1.jpeg
```

## 方案 A：Vercel

### 首次发布

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 登录 [Vercel](https://vercel.com/)，选择 **Add New Project**。
3. 导入代码仓库，Vercel 会读取根目录的 `vercel.json`。
4. 确认以下构建设置：
   - Install Command：`npm ci`
   - Build Command：`npm run build`
   - Output Directory：`dist`
5. 点击 **Deploy**。

如果已经接入 Supabase，在 Vercel 的 Preview 和 Production 环境中增加：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

修改环境变量后需要重新部署，Vite 变量在构建阶段生效。

也可以使用 CLI：

```bash
npx vercel login
npx vercel --prod
```

### 绑定自定义域名

1. 进入 Vercel 项目 **Settings → Domains**。
2. 添加你的域名，例如 `work.example.com`。
3. 在域名 DNS 控制台添加 Vercel 显示的记录。常见配置是：
   - 子域名：`CNAME work cname.vercel-dns.com`
   - 根域名：按 Vercel 控制台显示的 `A` 记录配置
4. 等待 DNS 生效。Vercel 会自动签发 HTTPS 证书。
5. 在 **Domains** 页面确认域名状态为 `Valid Configuration`。

不要同时给同一个主机名配置多条冲突的 `A` 或 `CNAME` 记录。

## 方案 B：Cloudflare Pages

### CLI 发布

```bash
npx wrangler login
npm run build
npx wrangler pages project create super-work-platform
npx wrangler pages deploy dist --project-name super-work-platform
```

如果项目已经创建过，只执行：

```bash
npm run build
npx wrangler pages deploy dist --project-name super-work-platform
```

发布后会得到类似 `https://super-work-platform.pages.dev` 的预览域名。

### 绑定自定义域名

1. 打开 Cloudflare 控制台的 **Workers & Pages**。
2. 进入 `super-work-platform` 项目，选择 **Custom domains → Set up a custom domain**。
3. 输入域名并完成 DNS 引导。
4. 如果域名托管在 Cloudflare，按控制台提示授权即可。
5. 如果域名在其它 DNS 服务商，添加 Cloudflare 提供的 `CNAME` 记录指向项目的 `pages.dev` 域名。
6. 等待状态变为 **Active**。Cloudflare 会自动配置 HTTPS。

也可以在 Pages 项目中配置 Git 自动部署：

- Build command：`npm run build`
- Build output directory：`dist`
- Root directory：项目根目录
- Node.js：使用项目当前支持的 Node.js LTS 版本

## 发布后的验收清单

- 首页域名可以打开，首页动画和 `Begin Journey` 正常。
- 注册账号后能进入 `/教师工作台.html?account=...`。
- 刷新页面后，账号状态和个人工作台数据仍能从当前浏览器恢复。
- `https://你的域名/pic/no1.jpeg` 可以直接打开。
- 移动端菜单、上下滚动、课表横向滚动和小助手拖拽正常。
- 浏览器控制台没有资源 404、混合内容或脚本异常。
- Vercel/Cloudflare 的 HTTPS 状态已生效。
- 如果已配置 Supabase，使用两个浏览器或设备验证同一账号的数据同步和不同账号的数据隔离。

## 当前数据边界

未配置 Supabase 时，登录、账号、教师工作台数据和通知模板保存在浏览器 `localStorage` 中。配置 Supabase 后，登录由 Supabase Auth 负责，教学工作、班主任和工作区管理数据会按账号保存到 `user_module_data`，并继续使用 localStorage 作为本地缓存。AI 与应用模块仍为公共内容。

如果后续需要管理员账号、密码找回或多人协作，还需要增加对应的权限模型、邮件流程和协作冲突策略。未配置 Supabase 的本地模式不应被当成生产级身份认证。

## 回滚

- Vercel：进入项目 **Deployments**，选择上一条部署并执行 **Promote to Production**。
- Cloudflare Pages：在项目 **Deployments** 中选择上一条成功部署并回滚。

每次发布前建议保留一次可访问的生产预览地址，先完成验收再绑定为生产域名。
