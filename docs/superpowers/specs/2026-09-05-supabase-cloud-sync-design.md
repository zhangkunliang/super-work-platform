# Supabase Cloud Sync Design

**Date:** 2026-09-05  
**Status:** Approved design, pending implementation plan  
**Goal:** 将当前按浏览器保存的账号和教师工作台个人数据升级为可跨设备同步的 Supabase 云端数据，同时保留离线本地兜底。

## Scope

本次改造覆盖注册、登录、退出、会话恢复、个人模块数据同步和旧数据迁移。个人数据范围固定为：

- 教学工作
- 班主任
- 工作区管理

AI 与应用集合继续作为公共模块，不按账号隔离。本次不实现多人实时协作、复杂冲突合并、密码找回和管理员后台。

## Architecture

前端仍部署在 Vercel，Supabase 提供认证和数据库：

```text
React 首页
  ├─ Supabase Auth：注册、登录、会话
  ├─ CloudSync：用户模块数据读写
  └─ iframe 教师工作台
       └─ postMessage + same-origin localStorage bridge

Supabase
  ├─ auth.users
  └─ public.user_module_data
```

React 首页使用 `@supabase/supabase-js` 管理认证。教师工作台是独立的 `教师工作台.html`，不重写为 React；首页在 iframe 创建前将云端数据写入当前 origin 的本地缓存，工作台通过现有 localStorage 逻辑读取。工作台的数据写入通过同源消息通知父页面，由父页面的 CloudSync 防抖上传到 Supabase。

## Configuration

新增环境变量：

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-or-anon-key>
```

只允许使用 Supabase publishable/anon key。禁止将 service role key 写入前端、Git、Vercel 环境变量的公开构建产物或文档示例。

未配置变量时，应用进入 local mode：保留现有本地账号和 localStorage 行为，并在登录界面显示非阻塞的本地模式状态。已配置变量但 Supabase 请求失败时，不清空本地缓存，使用本地数据继续工作，并显示可重试的同步状态。

## Database Schema

新增 `supabase/migrations/001_user_module_data.sql`：

```sql
create table if not exists public.user_module_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('teaching', 'homeroom', 'workspace')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, module)
);

alter table public.user_module_data enable row level security;

create policy "users can read their own module data"
  on public.user_module_data for select
  using (auth.uid() = user_id);

create policy "users can insert their own module data"
  on public.user_module_data for insert
  with check (auth.uid() = user_id);

create policy "users can update their own module data"
  on public.user_module_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete their own module data"
  on public.user_module_data for delete
  using (auth.uid() = user_id);
```

The client uses an upsert keyed by `(user_id, module)`. `updated_at` is set by the client for deterministic last-write-wins behavior; no service role access is required.

## Data Mapping

The existing private localStorage keys are grouped as follows:

| Module | Keys |
|---|---|
| `teaching` | `zhixing.calendar-settings.v1`, `zhixing.calendar-events.v1`, `zhixing.schedule.v1`, `zhixing.students.v1`, `zhixing.exams.v1`, `zhixing.classes.v1`, `zhixing.active-class.v1`, `zhixing.seating-layouts.v1`, `zhixing.prep-links.v1`, `zhixing.prep-links.v2`, `zhixing.prep-links.v3`, `zhixing.prep-records.v1` |
| `homeroom` | `zhixing.notices.v1`, `zhixing.notice-templates.v1`, `zhixing.class-notice.templates.v1` |
| `workspace` | `zhixing.workspaces.v3`, `zhixing.profile.v2`, `zhixing.profile.v3`, `zhixing.home-modules.v1` |

The public AI/application collection remains outside these rows. The existing account-prefixed localStorage convention remains as the cache namespace so existing browser data can be migrated without overwriting another account.

## Authentication Flow

1. App boot calls `supabase.auth.getSession()`.
2. If a Supabase session exists, the app renders the signed-in shell and passes the authenticated account identity to the iframe.
3. Registration calls `supabase.auth.signUp({ email, password })`; the app does not save the password locally.
4. Login calls `supabase.auth.signInWithPassword({ email, password })`.
5. `onAuthStateChange` updates the React shell and iframe sync bridge.
6. Logout calls `supabase.auth.signOut()`, clears the active account cache and returns to the homepage.
7. If Supabase is not configured, the existing local demo auth remains available only as a development fallback.

The current plaintext remembered-password draft must be removed from the cloud-enabled path. Browser password managers remain available through `autocomplete` attributes.

## Sync Flow

### Initial load

1. After authentication, fetch the three module rows for the current user.
2. For each returned row, hydrate the account-prefixed local cache.
3. Preserve local-only data if the remote row does not exist.
4. If no remote row exists but local private data does, upload a migration snapshot once.
5. Only after hydration, create or reveal the teacher workbench iframe.

### Local changes

1. The workbench writes through its existing localStorage wrappers.
2. The wrapper posts `{ type: "zhixing:module-change", module, keys }` to the same-origin parent.
3. The parent reads the changed module snapshot from the account-prefixed local cache.
4. A 500 ms debounce coalesces rapid editor changes.
5. CloudSync upserts the current module row and updates the visible sync status.

### Failure handling

- Read failure: keep the current local cache and show `云端同步失败，当前使用本地数据`.
- Write failure: retain the local change, mark the module dirty, and offer a retry action.
- Session expiry: stop writes, refresh the Supabase session once, then retry; otherwise return to login.
- Network recovery: retry dirty modules on the next authenticated app focus event.

## Migration

Migration is per account and idempotent:

- Existing local data is read from the account-prefixed cache.
- A remote module row is authoritative when it exists and has a newer `updated_at`.
- If the remote row is absent, local data is uploaded.
- No local data is deleted during migration.
- A migration result is recorded only in local storage, not as trusted authorization state.

## Security

- RLS must remain enabled in production.
- Every query is filtered by the authenticated Supabase session; the client never sends an arbitrary user id as authority.
- The service role key is never shipped to the browser.
- Passwords are handled only by Supabase Auth and are never written to localStorage.
- The existing local fallback is explicitly a development/offline mode, not production authentication.

## Testing and Acceptance

Automated tests must cover:

- Auth client disabled mode and configured mode.
- Local-to-cloud migration for all three modules.
- Remote hydration before iframe creation.
- Debounced module upsert and retry after a failed request.
- Account isolation: user A cannot read or write user B's module rows.
- Logout clearing the active session without deleting public app data.

Manual acceptance requires two browsers or devices:

1. Register/login on device A and create a teaching or homeroom record.
2. Login with the same account on device B.
3. Verify the record appears on device B.
4. Change it on device B and verify the update returns to device A after refresh.
5. Login as a different account and verify the personal modules are empty while public AI/application data remains available.

## Deployment

Vercel must receive `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Preview and Production environments. The SQL migration is applied in the Supabase SQL editor or CLI before the first cloud-enabled deployment. The deployment guide must document that a frontend rebuild is required after changing Vite environment variables.

