# Supabase Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** 将首页认证和教师工作台个人数据接入 Supabase，实现手机与 PC 使用同一账号时的数据同步，同时保留未配置 Supabase 时的本地开发兜底。

**Architecture:** React 首页负责 Supabase Auth、会话和云端同步；独立的 `教师工作台.html` 继续负责工作台 UI，通过同源 `postMessage` 把现有 localStorage 变化通知父页面。Supabase 使用 RLS 保护 `user_module_data`，每个用户按 `teaching`、`homeroom`、`workspace` 三个模块存储 JSON 数据。

**Tech Stack:** Vite, React, TypeScript, `@supabase/supabase-js`, Supabase Auth, PostgreSQL JSONB, Vitest, jsdom.

**Spec:** `docs/superpowers/specs/2026-09-05-supabase-cloud-sync-design.md`

## Global Constraints

- AI 与应用模块保持公共数据，不写入用户隔离表。
- 个人数据只隔离教学工作、班主任、工作区管理三个模块。
- 禁止将 Supabase service role key 放入前端或仓库。
- 未配置 Supabase 环境变量时必须保留本地开发模式。
- 密码只能交给 Supabase Auth 处理，不能写入 localStorage。
- 现有教师工作台 HTML 的 UI 样式和模块行为保持不变。
- 每个任务结束后运行与任务风险匹配的测试，最后运行完整 lint、test、build 和公网预览检查。

---

### Task 1: Add Supabase client configuration and database migration

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/cloudTypes.ts`
- Create: `supabase/migrations/001_user_module_data.sql`
- Create: `.env.example`
- Test: `src/lib/supabase.test.ts`

**Interfaces:**
- `isSupabaseConfigured(): boolean`
- `getSupabaseClient(): SupabaseClient | null`
- `CloudModule = "teaching" | "homeroom" | "workspace"`
- `CloudModuleRow = { user_id: string; module: CloudModule; payload: Record<string, unknown>; updated_at: string }`

- [x] **Step 1: Write the failing configuration tests**

Add tests that temporarily set `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, assert configured mode, then clear them and assert local mode. Assert the module list only contains the three private modules.

- [x] **Step 2: Run the focused test and confirm it fails**

Run: `npm test -- --run src/lib/supabase.test.ts`  
Expected: FAIL because the Supabase client module and module constants do not exist.

- [x] **Step 3: Install the client and implement configuration**

Run: `npm install @supabase/supabase-js`.

Implement a singleton client only when both Vite variables are non-empty. Export typed module constants and an explicit `null` client in local mode.

- [x] **Step 4: Add SQL and environment documentation**

Create the table, check constraint, primary key, RLS enablement, and four user-scoped policies from the approved spec. Add only public/publishable key placeholders to `.env.example`.

- [x] **Step 5: Run focused tests and lint**

Run: `npm test -- --run src/lib/supabase.test.ts` and `npm run lint`  
Expected: focused tests pass and lint exits 0.

### Task 2: Add cloud module serialization and migration logic

**Files:**
- Create: `src/lib/cloudSync.ts`
- Create: `src/lib/cloudSync.test.ts`
- Modify: `src/lib/session.ts`

**Interfaces:**
- `snapshotLocalModules(storage: Storage, account: string): Record<CloudModule, Record<string, unknown>>`
- `hydrateLocalModules(storage: Storage, account: string, payloads: Partial<Record<CloudModule, Record<string, unknown>>>): void`
- `migrateLocalModules(client: SupabaseClient, storage: Storage, userId: string, account: string): Promise<MigrationResult>`
- `loadCloudModules(client: SupabaseClient, userId: string): Promise<CloudModulePayloads>`
- `saveCloudModule(client: SupabaseClient, userId: string, module: CloudModule, payload: Record<string, unknown>): Promise<void>`

- [x] **Step 1: Write failing serialization tests**

Cover account-prefixed keys, grouping into the three modules, ignoring public keys, hydration without overwriting unrelated public data, and idempotent migration decisions.

- [x] **Step 2: Run tests and confirm the expected failure**

Run: `npm test -- --run src/lib/cloudSync.test.ts`  
Expected: FAIL because the serializer and cloud operations are not implemented.

- [x] **Step 3: Implement pure local snapshot and hydration functions**

Use the private key map from the design spec. Never include `velorah-users-v1`, `velorah-auth-draft-v1`, public application keys, or arbitrary localStorage keys.

- [x] **Step 4: Implement Supabase load, upsert, and migration**

Use the authenticated client and `user_id` from the session. Fetch rows for the three allowed modules, upsert only the current user’s row, and preserve local data when the remote row is absent. Return per-module migration status and errors.

- [x] **Step 5: Verify focused tests and lint**

Run: `npm test -- --run src/lib/cloudSync.test.ts` and `npm run lint`  
Expected: all focused tests pass and lint exits 0.

### Task 3: Replace local authentication with Supabase Auth plus local fallback

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/lib/session.ts`

**Interfaces:**
- `AuthDialog` submits email/password to Supabase when configured.
- Local demo auth remains available only when `isSupabaseConfigured()` is false.
- Parent app exposes an authenticated `CloudSyncProvider` state to the iframe shell.

- [x] **Step 1: Add failing auth behavior tests**

Test configured signup calls `auth.signUp`, configured signin calls `auth.signInWithPassword`, configured logout calls `auth.signOut`, and no password is written to localStorage in configured mode. Preserve existing local-mode tests for fallback behavior.

- [x] **Step 2: Run the auth tests and confirm failure**

Run: `npm test -- --run src/App.test.tsx`  
Expected: FAIL on the new configured-mode expectations.

- [x] **Step 3: Implement configured-mode auth**

Use Supabase email/password auth. Convert Supabase errors into the existing Chinese form error surface. Replace `rememberCredentials` in cloud mode with browser password-manager autocomplete only. Subscribe to `onAuthStateChange` and clean up the subscription.

- [x] **Step 4: Keep local mode explicit and isolated**

Retain current local users only for no-config development. Do not mix local users with Supabase users, and do not attempt to upload the local password hash as cloud auth data.

- [x] **Step 5: Run tests, lint, and build**

Run: `npm test -- --run src/App.test.tsx`, `npm run lint`, and `npm run build`  
Expected: all pass and the build emits no secret values.

### Task 4: Hydrate the iframe before showing the teacher workbench

**Files:**
- Create: `src/components/CloudSyncProvider.tsx`
- Create: `src/components/CloudSyncProvider.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- `CloudSyncProvider` accepts `{ account, userId, children }` and exposes sync status through context.
- `useCloudSync()` returns `{ mode, status, lastSyncedAt, error, retry }`.

- [x] **Step 1: Write failing provider tests**

Assert cloud data is loaded before the iframe is rendered, local mode renders immediately, and a failed remote read leaves the local cache intact while exposing an error state.

- [x] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- --run src/components/CloudSyncProvider.test.tsx`  
Expected: FAIL because the provider does not exist.

- [x] **Step 3: Implement provider initialization**

On authenticated boot, load the three cloud rows, hydrate the account-prefixed cache, run the migration when required, and render the iframe only after initialization reaches ready or fallback-ready. Do not clear public module data.

- [x] **Step 4: Add sync status to the existing shell without changing workbench UI**

Expose status for later UI use and add a small accessible status region only in the React shell if needed. Keep the teacher workbench HTML styles unchanged.

- [x] **Step 5: Verify provider tests and full app tests**

Run: `npm test -- --run src/components/CloudSyncProvider.test.tsx src/App.test.tsx`  
Expected: all targeted tests pass.

### Task 5: Add the same-origin iframe sync bridge

**Files:**
- Modify: `教师工作台.html`
- Modify: `src/components/CloudSyncProvider.tsx`
- Create: `src/lib/syncProtocol.ts`
- Create: `src/lib/syncProtocol.test.ts`

**Interfaces:**
- Message request: `{ type: "zhixing:module-change"; module: CloudModule; keys: string[] }`
- Parent response: `{ type: "zhixing:sync-status"; status: "idle" | "saving" | "saved" | "error"; module?: CloudModule; message?: string }`

- [x] **Step 1: Write failing protocol tests**

Assert only allowed modules are accepted, malformed messages are ignored, and a module-change message is converted into a debounced upload request.

- [x] **Step 2: Run protocol tests and confirm failure**

Run: `npm test -- --run src/lib/syncProtocol.test.ts`  
Expected: FAIL because the protocol helpers do not exist.

- [x] **Step 3: Implement protocol validation and debounce**

Validate `event.origin === window.location.origin`, module membership, and message shape. Coalesce changes per module within 500 ms and retain dirty modules after a failed upload.

- [x] **Step 4: Instrument the existing workbench storage wrapper**

After the existing account-scoping wrapper resolves a private key, post the module-change message to `window.parent`. Keep current localStorage writes synchronous so the workbench remains usable offline.

- [x] **Step 5: Verify the bridge and workbench build path**

Run: `npm test -- --run src/lib/syncProtocol.test.ts`; `npm run build`; check `dist/教师工作台.html` exists and includes the bridge marker. 

### Task 6: Add deployment configuration and migration documentation

**Files:**
- Modify: `docs/DEPLOYMENT.md`
- Modify: `README.md` if present, otherwise create `docs/SUPABASE_SETUP.md`
- Modify: `vercel.json` only if environment guidance needs headers or rewrites

- [x] **Step 1: Document Supabase project setup**

Document creating a project, applying `supabase/migrations/001_user_module_data.sql`, copying the project URL and publishable/anon key, and adding both variables to Vercel Preview and Production environments.

- [x] **Step 2: Document local development**

Document `.env.local`, `npm run dev`, local-mode behavior when variables are absent, and the requirement to restart Vite after env changes.

- [x] **Step 3: Document acceptance and rollback**

Add the two-device sync checklist, RLS verification, and the fact that removing Supabase variables returns to local mode but does not migrate new cloud changes back automatically.

- [x] **Step 4: Check docs and diff**

Run: `git diff --check` and scan docs for service role key examples or unresolved implementation placeholders.

### Task 7: Full verification and two-device deployment check

**Files:**
- Modify tests only if a verification gap is found.

- [x] **Step 1: Run the complete local quality suite**

Run: `npm run lint`, `npm test -- --run`, `npm run build`, and `git diff --check`.

- [x] **Step 2: Verify generated artifacts**

Check `dist/index.html`, `dist/教师工作台.html`, `dist/pic/no1.jpeg`, and confirm no `service_role` or secret key string appears in `dist`.

- [ ] **Step 3: Configure Vercel environment variables**

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Preview and Production, trigger a new deployment, and verify the build logs show the correct Vite build without printing values.

- [x] **Step 4: Run public smoke checks**

Verify homepage, signup/signin, teacher workbench load, public AI/app data, and `/pic/no1.jpeg` over HTTPS.

- [ ] **Step 5: Run the two-device acceptance flow**

Use two browser profiles/devices to create a record on device A, verify it on device B, update it on device B, verify the update on device A, then verify a second account cannot read the first account’s private modules.
