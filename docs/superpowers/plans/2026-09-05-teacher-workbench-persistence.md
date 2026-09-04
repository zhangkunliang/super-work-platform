# Teacher Workbench Persistence and Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前 React + Vite + TypeScript + Tailwind CSS + shadcn/ui 项目中，完成参考教师工作台的可验证交互，并将业务数据从浏览器状态迁移到可替换的服务端持久化边界。

**Architecture:** 使用 TanStack Query 管理服务端状态，使用页面局部 state 和 UI reducer 管理路由、筛选、弹层和编辑草稿。所有业务页面只依赖 `TeacherRepository` 领域接口；`MockTeacherRepository` 用于本地开发和测试，`ApiTeacherRepository` 通过注入的路由映射访问真实后端，避免页面绑定 HTTP 细节。

**Tech Stack:** React, Vite, TypeScript, Tailwind CSS v4, shadcn/ui Base UI, Lucide React, TanStack Query, Vitest, Testing Library, Playwright.

**Spec:** docs/superpowers/specs/2026-09-05-teacher-workbench-persistence-design.md

## Global Constraints

- 业务数据以服务端数据库为唯一事实来源，刷新页面、重新登录或更换设备后仍可获取同一份数据。
- `localStorage` 只保存非业务偏好，例如上次侧栏展开状态和动效偏好，不保存姓名、学生、任务或沟通记录。
- 页面组件不得直接读取 `localStorage` 或拼接 fetch 请求，只能调用领域 hooks 或 Repository facade。
- 生产环境禁止静默回退到 mock；`VITE_DATA_PROVIDER=api` 时缺少 API 配置必须显示启动错误。
- 不复制或嵌入 `http://localhost:3000/` 的 HTML、CSS 或打包产物。
- 所有业务 mutation 必须有 loading、成功反馈、错误反馈和必要的乐观更新回滚。
- 参考页的可见入口必须产生明确结果；不保留无提示的空回调或未说明的占位死路。
- 使用当前 base-nova shadcn 配置、Tailwind CSS variables 和 Base UI API。
- 桌面端验证 1440×900 和 1280×800，移动端验证 390×844。
- 工作台不渲染持续 canvas 动画或高频粒子效果；背景视频必须保留 autoplay、loop、muted、playsInline。
- 代码修改遵循先写失败测试、再写最小实现、最后重构的 TDD 顺序。

## File Structure and Responsibilities

- Modify `src/types/education.ts`: 保留兼容类型别名，并迁移到完整的领域模型类型。
- Create `src/domain/workbench/models.ts`: 定义学生、任务、考勤、日程、作业、沟通、教案、报表和设置模型。
- Create `src/domain/workbench/validation.ts`: 定义表单校验和服务端字段错误映射。
- Create `src/domain/workbench/selectors.ts`: 定义统计摘要、筛选和跨模块跳转所需的纯函数。
- Create `src/data/teacherRepository.ts`: 定义 `TeacherRepository` 和所有输入/返回类型。
- Create `src/data/apiClient.ts`: 统一认证、JSON、文件下载、HTTP 错误和 401 处理。
- Create `src/data/apiTeacherRepository.ts`: 将领域方法映射到注入的 API route config。
- Create `src/data/mockTeacherRepository.ts`: 将现有 mock fixture 暴露为异步、可重置的 Repository。
- Create `src/data/queryKeys.ts`: 统一 TanStack Query keys。
- Create `src/data/provider.tsx`: 创建 QueryClient、Repository context 和数据 provider。
- Create `src/app/TeacherWorkbenchProvider.tsx`: 组合认证上下文、UI reducer 和全局 toast 状态。
- Modify `src/App.tsx`: 只负责认证、hash 路由、Provider 和页面装配。
- Modify `src/app/routes.ts`: 与参考页统一 8 个业务入口和帮助入口，移除侧栏中的额外“班级管理”。
- Modify `src/components/layout`: 让导航、搜索、通知、班级切换、帮助和移动端 Sheet 都有真实行为。
- Modify `src/pages` and `src/features`: 迁移页面到领域 hooks，完成参考页全部状态。
- Create `tests/e2e/teacher-workbench-persistence.spec.ts`: 覆盖跨页面持久化、错误回滚、响应式和所有主要入口。
- Create `tests/e2e/api-provider-contract.spec.ts`: 使用 route interception 验证 API provider 的请求/响应映射。
- Modify `playwright.config.ts`: 增加 API provider 的测试 project 或通过环境变量切换数据 provider。
- Modify `README.md` or create `docs/development-data-provider.md`: 记录本地 mock、预发布 API 和生产环境变量。

---

### Task 1: Establish the domain and repository boundary

**Files:**
- Create: `src/domain/workbench/models.ts`
- Create: `src/domain/workbench/validation.ts`
- Create: `src/domain/workbench/selectors.ts`
- Create: `src/data/teacherRepository.ts`
- Create: `src/data/queryKeys.ts`
- Create: `src/data/mockTeacherRepository.ts`
- Create: `src/data/mockTeacherRepository.test.ts`
- Modify: `src/types/education.ts`

**Interfaces:**

The task produces these exact types and methods for later tasks:

```ts
export type TeacherRepository = {
  getWorkbenchContext(): Promise<WorkbenchContext>
  getOverview(input: OverviewQuery): Promise<WorkbenchOverview>
  listStudents(input: StudentQuery): Promise<StudentPage>
  getStudent(id: string): Promise<StudentDetail>
  updateStudent(id: string, input: UpdateStudentInput): Promise<StudentDetail>
  listTodos(input: TodoQuery): Promise<TodoPage>
  createTodo(input: CreateTodoInput): Promise<TodoItem>
  updateTodo(id: string, input: UpdateTodoInput): Promise<TodoItem>
  listAttendance(input: AttendanceQuery): Promise<AttendanceSummary>
  saveAttendance(input: SaveAttendanceInput): Promise<AttendanceSummary>
  listSchedules(input: ScheduleQuery): Promise<SchedulePage>
  createSchedule(input: CreateScheduleInput): Promise<ScheduleItem>
  updateSchedule(id: string, input: UpdateScheduleInput): Promise<ScheduleItem>
  deleteSchedule(id: string): Promise<void>
  listAssignments(input: AssignmentQuery): Promise<AssignmentPage>
  createAssignment(input: CreateAssignmentInput): Promise<AssignmentItem>
  remindAssignment(id: string): Promise<ReminderResult>
  listCommunications(input: CommunicationQuery): Promise<CommunicationPage>
  createCommunication(input: CreateCommunicationInput): Promise<CommunicationRecord>
  resolveCommunication(id: string): Promise<CommunicationRecord>
  listLessonPlans(input: LessonPlanQuery): Promise<LessonPlanPage>
  updateLessonPlan(id: string, input: UpdateLessonPlanInput): Promise<LessonPlan>
  copyLessonPlan(id: string): Promise<LessonPlan>
  getTeacherSettings(): Promise<TeacherSettings>
  updateTeacherSettings(input: UpdateTeacherSettingsInput): Promise<TeacherSettings>
}
```

- [x] **Step 1: Write failing model and repository tests.**

```tsx
import { describe, expect, it } from "vitest"
import { createMockTeacherRepository } from "./mockTeacherRepository"

describe("MockTeacherRepository", () => {
  it("returns independent overview data for the selected class", async () => {
    const repository = createMockTeacherRepository()
    const first = await repository.getOverview({ classId: "class-1", date: "2026-09-04" })
    first.todos[0].title = "changed in test"
    const second = await repository.getOverview({ classId: "class-1", date: "2026-09-04" })
    expect(second.todos[0].title).toBe("准备周五班会材料")
  })

  it("persists a todo mutation inside the repository instance", async () => {
    const repository = createMockTeacherRepository()
    await repository.updateTodo("todo-1", { status: "done" })
    const result = await repository.listTodos({ classId: "class-1", status: "all" })
    expect(result.items.find((item) => item.id === "todo-1")?.status).toBe("done")
  })
})
```

- [x] **Step 2: Run the focused test and verify it fails for the missing repository implementation.**

Run: `npx vitest run src/data/mockTeacherRepository.test.ts`

Expected: FAIL because the new model and repository files do not exist yet.

- [x] **Step 3: Define complete domain models.**

Add the types required by the interface above. Extend the current `StudentSummary`, `TodoItem`, `ScheduleItem` and `AssignmentItem` instead of changing their existing consumers abruptly. Add `CommunicationRecord`, `LessonPlan`, `LessonPlanStep`, `AttendanceSummary`, `WorkbenchOverview`, `StudentPage`, `SchedulePage`, `AssignmentPage`, `CommunicationPage`, `LessonPlanPage`, `TeacherSettings` and their query/input types.

Use ISO strings for timestamps, opaque string IDs, integer counts, explicit union values for status, and nullable values for optional server fields. Do not use `any` or `unknown` in public domain return types.

- [x] **Step 4: Add pure selectors and validation.**

Implement these pure functions:

```ts
export function selectOpenTodoCount(items: TodoItem[]): number
export function selectUnresolvedAttentionCount(items: StudentAttention[]): number
export function selectAttendanceRate(summary: AttendanceSummary): number
export function filterStudents(items: StudentSummary[], query: StudentQuery): StudentSummary[]
export function validateTodoInput(input: CreateTodoInput): FieldErrors
export function validateScheduleInput(input: CreateScheduleInput): FieldErrors
export function validateAssignmentInput(input: CreateAssignmentInput): FieldErrors
```

Tests must cover empty arrays, all-completed tasks, absent/late/leave attendance, whitespace-only titles, and an end time before a start time.

- [x] **Step 5: Implement `MockTeacherRepository` from the existing fixture.**

Move mutable mock data into a private repository instance initialized from `getWorkbenchSnapshot()`. Add deterministic communication records, lesson plans, settings and per-student attendance records matching the reference page. Every read returns cloned arrays/objects. Every mutation updates only the repository instance and returns the cloned server-shaped result. Add a small deterministic async boundary using `Promise.resolve()`; do not use timers in unit tests.

- [x] **Step 6: Implement query keys.**

```ts
export const queryKeys = {
  context: (teacherId: string) => ["teacher-context", teacherId] as const,
  overview: (teacherId: string, classId: string, date: string) => ["overview", teacherId, classId, date] as const,
  students: (teacherId: string, query: StudentQuery) => ["students", teacherId, query] as const,
  student: (teacherId: string, id: string) => ["student", teacherId, id] as const,
  todos: (teacherId: string, query: TodoQuery) => ["todos", teacherId, query] as const,
  attendance: (teacherId: string, query: AttendanceQuery) => ["attendance", teacherId, query] as const,
  schedules: (teacherId: string, query: ScheduleQuery) => ["schedules", teacherId, query] as const,
  assignments: (teacherId: string, query: AssignmentQuery) => ["assignments", teacherId, query] as const,
  communications: (teacherId: string, query: CommunicationQuery) => ["communications", teacherId, query] as const,
  lessonPlans: (teacherId: string, query: LessonPlanQuery) => ["lesson-plans", teacherId, query] as const,
  settings: (teacherId: string) => ["teacher-settings", teacherId] as const,
}
```

- [x] **Step 7: Run focused tests, lint and build.**

Run: `npx vitest run src/data/mockTeacherRepository.test.ts src/domain/workbench`

Expected: all focused tests pass.

Run: `npm run lint`

Expected: 0 errors.

Run: `npm run build`

Expected: production build exits 0.

- [x] **Step 8: Commit the repository boundary.**

```bash
git add src/types/education.ts src/domain/workbench src/data/teacherRepository.ts src/data/queryKeys.ts src/data/mockTeacherRepository.ts src/data/mockTeacherRepository.test.ts
git commit -m "feat: add teacher workbench repository boundary"
```

---

### Task 2: Add API transport, provider selection, and server-state hooks

**Files:**
- Create: `src/data/apiClient.ts`
- Create: `src/data/apiTeacherRepository.ts`
- Create: `src/data/provider.tsx`
- Create: `src/data/hooks.ts`
- Create: `src/data/apiClient.test.ts`
- Create: `src/data/apiTeacherRepository.test.ts`
- Modify: `package.json` and `package-lock.json`
- Modify: `src/App.tsx`

**Interfaces:**

```ts
export type ApiRouteMap = {
  context: string
  overview: string
  students: string
  student: (id: string) => string
  todos: string
  todo: (id: string) => string
  attendance: string
  schedules: string
  schedule: (id: string) => string
  assignments: string
  assignmentReminder: (id: string) => string
  communications: string
  communication: (id: string) => string
  lessonPlans: string
  lessonPlan: (id: string) => string
  lessonPlanCopy: (id: string) => string
  settings: string
}

export type ApiClient = {
  request<T>(input: RequestInput): Promise<T>
  download(input: RequestInput): Promise<Blob>
}

export function createApiTeacherRepository(input: {
  client: ApiClient
  routes: ApiRouteMap
}): TeacherRepository
```

- [x] **Step 1: Write failing transport tests.**

```tsx
it("maps a 422 response to field errors", async () => {
  const client = createApiClient({
    fetcher: async () => new Response(JSON.stringify({ code: "VALIDATION_ERROR", fields: { title: "标题不能为空" } }), { status: 422 }),
  })
  await expect(client.request({ path: "/todos", method: "POST", body: {} })).rejects.toMatchObject({ code: "VALIDATION_ERROR", fields: { title: "标题不能为空" } })
})

it("throws an auth error for a 401 response", async () => {
  const client = createApiClient({ fetcher: async () => new Response(null, { status: 401 }) })
  await expect(client.request({ path: "/context", method: "GET" })).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
})
```

- [x] **Step 2: Run the focused tests and verify the expected missing-module failure.**

Run: `npx vitest run src/data/apiClient.test.ts src/data/apiTeacherRepository.test.ts`

Expected: FAIL because the API transport and adapter do not exist.

- [x] **Step 3: Add `@tanstack/react-query` and implement `ApiClient`.**

`createApiClient` must accept an injected fetcher for tests, attach `credentials: "include"`, add JSON headers only when a JSON body exists, parse JSON and Blob responses, and normalize status codes 401, 403, 404, 409, 422 and 5xx into a typed `RepositoryError`. Never log tokens, cookies or response bodies containing student data.

- [x] **Step 4: Implement `ApiTeacherRepository` with injected routes.**

Each method calls the route map and converts the backend response into the domain model. Keep mapping functions explicit and unit-test them with representative success payloads. Do not add guessed default endpoint paths. If `VITE_DATA_PROVIDER=api` and no complete route map is supplied, provider initialization must throw a readable configuration error before rendering business pages.

- [x] **Step 5: Add provider selection.**

```tsx
export function TeacherDataProvider({ children, teacherId }: { children: React.ReactNode; teacherId: string })
export function useTeacherRepository(): TeacherRepository
export function useOverviewQuery(input: OverviewQuery): UseQueryResult<WorkbenchOverview, RepositoryError>
export function useStudentsQuery(input: StudentQuery): UseQueryResult<StudentPage, RepositoryError>
export function useTodosQuery(input: TodoQuery): UseQueryResult<TodoPage, RepositoryError>
export function useAttendanceQuery(input: AttendanceQuery): UseQueryResult<AttendanceSummary, RepositoryError>
```

Create one QueryClient with retry disabled for 4xx errors and one retry for network/5xx errors. Query keys must come from `queryKeys.ts`. Keep mutation invalidation in feature hooks, not in individual presentational components.

- [x] **Step 6: Wire the provider around authenticated routes.**

The mock provider remains the default for local development. The API provider is selected only from `VITE_DATA_PROVIDER`. Remove direct `getWorkbenchSnapshot()` reads from `App.tsx` after all consumers are migrated in later tasks; until then, keep a single compatibility adapter rather than two competing sources of truth.

- [x] **Step 7: Run focused tests, lint and build.**

Run: `npx vitest run src/data`

Expected: all data-layer tests pass.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful production build.

- [x] **Step 8: Commit the API boundary.**

```bash
git add package.json package-lock.json src/data src/App.tsx
git commit -m "feat: add api provider and server state hooks"
```

---

### Task 3: Refactor application composition and navigation state

**Files:**
- Create: `src/app/TeacherWorkbenchProvider.tsx`
- Create: `src/app/TeacherWorkbenchProvider.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/app/routes.ts`
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/components/layout/MobileNavigation.tsx`
- Modify: `src/components/layout/Topbar.tsx`

**Interfaces:**

```ts
export type WorkbenchUiState = {
  route: AppRoute
  selectedClassId: string
  searchQuery: string
  mobileNavOpen: boolean
  helpOpen: boolean
  notificationOpen: boolean
}

export type WorkbenchUiAction =
  | { type: "navigate"; route: AppRoute }
  | { type: "select-class"; classId: string }
  | { type: "set-search"; query: string }
  | { type: "toggle-mobile-nav"; open: boolean }
  | { type: "toggle-help"; open: boolean }
  | { type: "toggle-notifications"; open: boolean }
```

- [ ] **Step 1: Write failing reducer and navigation tests.**

```tsx
it("uses the reference page labels for navigation and excludes class management", () => {
  expect(navigationItems.map((item) => item.visibleLabel)).toEqual([
    "班级总览", "今日任务", "学生档案", "课程与值日", "备课中心", "家校沟通", "数据周报", "系统设置",
  ])
  expect(navigationItems.some((item) => item.route === "classes")).toBe(false)
})

it("keeps search and route changes in UI state only", () => {
  const state = workbenchUiReducer(initialWorkbenchUiState, { type: "set-search", query: "林语桐" })
  expect(state.searchQuery).toBe("林语桐")
  expect(state.route).toBe("workbench")
})
```

- [ ] **Step 2: Run the focused tests and verify failure against the current route table.**

Run: `npx vitest run src/app/TeacherWorkbenchProvider.test.tsx src/app/AppShell.test.tsx`

Expected: FAIL because current navigation includes `classes` and the UI reducer does not exist.

- [ ] **Step 3: Add the reducer and provider.**

Keep URL hash changes as the source of route transitions. The reducer must not write to `window`; the provider effect synchronizes the hash. Reset route to `landing` when authentication is lost. Persist only `mobileNavOpen` preference if the user has enabled it; never persist business state.

- [ ] **Step 4: Unify accessible and visible navigation labels.**

Update `navigationItems` so each item has one visible label and one route. Use that same label for link accessible names. Keep `getRouteTitle` pure. Remove `classes` from the rendered navigation while leaving unknown hash parsing safe by returning `landing`.

- [ ] **Step 5: Wire `App.tsx` to the provider and page registry.**

`App.tsx` must render `LandingPage` and `AuthDialog` when unauthenticated. Authenticated routes render `TeacherDataProvider`, `TeacherWorkbenchProvider`, `AppShell`, and a route-to-page registry. It must not contain lists of students, todos, attendance records or assignments.

- [ ] **Step 6: Run tests, lint and build.**

Run: `npx vitest run src/app src/App.test.tsx`

Expected: all application composition tests pass.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 7: Commit the composition refactor.**

```bash
git add src/App.tsx src/app src/components/layout src/types/education.ts
git commit -m "refactor: centralize workbench navigation state"
```

---

### Task 4: Complete shell interactions, search, notifications, class switcher, and help

**Files:**
- Create: `src/components/layout/GlobalSearch.tsx`
- Create: `src/components/layout/NotificationSheet.tsx`
- Create: `src/components/layout/HelpSheet.tsx`
- Create: `src/components/layout/GlobalSearch.test.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/components/layout/MobileNavigation.tsx`

**Interfaces:**

```ts
export type SearchResult =
  | { kind: "student"; id: string; label: string; detail: string }
  | { kind: "todo"; id: string; label: string; detail: string }
  | { kind: "communication"; id: string; label: string; detail: string }

export type GlobalSearchProps = {
  query: string
  results: SearchResult[]
  onQueryChange: (query: string) => void
  onSelect: (result: SearchResult) => void
}
```

- [ ] **Step 1: Write failing interaction tests.**

```tsx
it("shows a matching student result and calls the selection handler", async () => {
  const onSelect = vi.fn()
  const user = userEvent.setup()
  render(<GlobalSearch query="林" results={[{ kind: "student", id: "student-1", label: "林语桐", detail: "学生档案" }]} onQueryChange={vi.fn()} onSelect={onSelect} />)
  await user.click(screen.getByRole("option", { name: /林语桐/ }))
  expect(onSelect).toHaveBeenCalledWith({ kind: "student", id: "student-1", label: "林语桐", detail: "学生档案" })
})

it("opens help as an accessible Sheet", async () => {
  const user = userEvent.setup()
  render(<HelpSheet open onOpenChange={vi.fn()} />)
  expect(screen.getByRole("dialog")).toHaveTextContent("使用帮助")
})
```

- [ ] **Step 2: Run the focused tests and verify failure.**

Run: `npx vitest run src/components/layout/GlobalSearch.test.tsx`

Expected: FAIL because search results and help sheet are not implemented.

- [ ] **Step 3: Implement `GlobalSearch`.**

Use the current teacher, student, todo and communication queries to derive results. Debounce only the network-backed search if the API supports it; mock mode filters locally. Results use `role="listbox"` and `role="option"`, support ArrowUp/ArrowDown/Enter/Escape, and select the correct route/detail without writing business data locally.

- [ ] **Step 4: Implement notifications.**

The bell opens a Sheet listing unread communication records and relevant task reminders. “查看全部” navigates to communication or tasks based on the selected result. Marking a communication processed invalidates unread count and overview queries.

- [ ] **Step 5: Implement class switching.**

The class selector reads `WorkbenchContext.classes`. Selecting a class updates UI state and invalidates overview, students, attendance, schedules, assignments and communications queries. Keep the shell mounted so only content data refreshes.

- [ ] **Step 6: Implement help Sheet and mobile focus behavior.**

The help Sheet lists the 8 business modules and common shortcuts. On mobile, opening the navigation Sheet moves focus inside it; selecting a link closes it and restores focus to the menu button. All icon-only buttons have tooltip text and accessible labels.

- [ ] **Step 7: Run tests, lint and build.**

Run: `npx vitest run src/components/layout src/app`

Expected: all shell interaction tests pass.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 8: Commit the shell interactions.**

```bash
git add src/app/AppShell.tsx src/components/layout
git commit -m "feat: complete workbench shell interactions"
```

---

### Task 5: Complete overview, todos, attendance, and cross-page summary synchronization

**Files:**
- Modify: `src/pages/WorkbenchPage.tsx`
- Modify: `src/components/workbench/TodaySummary.tsx`
- Modify: `src/components/workbench/TodoList.tsx`
- Modify: `src/components/workbench/TodoComposer.tsx`
- Modify: `src/components/workbench/AttendanceDialog.tsx`
- Modify: `src/components/workbench/AttendanceOverview.tsx`
- Modify: `src/components/workbench/StudentAttentionList.tsx`
- Modify: `src/components/workbench/NextLessonCard.tsx`
- Create: `src/features/workbench/useWorkbenchActions.ts`
- Create: `src/features/workbench/useWorkbenchActions.test.ts`
- Modify: `src/pages/WorkbenchPage.test.tsx`

**Interfaces:**

```ts
export type WorkbenchActions = {
  createTodo(input: CreateTodoInput): Promise<void>
  updateTodo(id: string, input: UpdateTodoInput): Promise<void>
  saveAttendance(input: SaveAttendanceInput): Promise<void>
  resolveAttention(id: string): Promise<void>
  openStudent(id: string): void
  openTasks(): void
  openCommunications(): void
  openLessonPlan(id?: string): void
}
```

- [ ] **Step 1: Write failing workflow tests.**

```tsx
it("updates the summary after a todo is completed", async () => {
  const repository = createMockTeacherRepository()
  const actions = createWorkbenchActions({ repository, queryClient: new QueryClient() })
  await actions.updateTodo("todo-1", { status: "done" })
  const todos = await repository.listTodos({ classId: "class-1", status: "all" })
  expect(todos.items.find((item) => item.id === "todo-1")?.status).toBe("done")
})

it("derives leave and late counts from saved attendance records", async () => {
  const repository = createMockTeacherRepository()
  const result = await repository.saveAttendance({ classId: "class-1", records: { "student-1": "leave", "student-2": "late" } })
  expect(result.leaveCount).toBe(1)
  expect(result.lateCount).toBe(1)
})
```

- [ ] **Step 2: Run the focused tests and verify failure.**

Run: `npx vitest run src/features/workbench/useWorkbenchActions.test.ts src/pages/WorkbenchPage.test.tsx`

Expected: FAIL because actions are currently local state callbacks and attendance summary contains fixed values.

- [ ] **Step 3: Implement mutation hooks with optimistic updates.**

Use `useMutation` for todo, attendance and attention actions. On mutation start, update the relevant query cache and save a rollback snapshot. On error, restore the snapshot and show a toast with a retry action. On success, invalidate overview and the directly affected list/detail queries.

- [ ] **Step 4: Complete overview navigation behavior.**

Make the four summary cards buttons with explicit accessible names and route targets. Wire notification count, task “查看全部”, attention student buttons and next lesson “打开备课” to the appropriate action. Remove every `() => undefined` callback from overview composition.

- [ ] **Step 5: Complete todo behavior.**

Support add, complete, restore, edit, snooze and delete. The five-second undo control is a UI affordance over the mutation result; it calls `updateTodo` with the previous status and disappears after the timeout. The empty state appears only when the query returns no open items, not when the request is loading.

- [ ] **Step 6: Complete attendance behavior.**

The Sheet supports all students, “全员到校”, “异常”, student-level status, required leave reason, unchanged-count display and submit loading. `AttendanceOverview` renders `presentCount`, `leaveCount`, `lateCount` and the server-derived rate from `AttendanceSummary`; it must not calculate counts from a fixed constant.

- [ ] **Step 7: Complete attention and class overview synchronization.**

Type filtering, resolve, student detail and class metrics all consume query data. Resolving an item invalidates overview and attention queries. Changing class invalidates all class-scoped queries without unmounting `AppShell`.

- [ ] **Step 8: Run focused tests, lint, build and the current E2E suite.**

Run: `npx vitest run src/features/workbench src/components/workbench src/pages/WorkbenchPage.test.tsx`

Expected: all focused tests pass.

Run: `npm run test:e2e -- tests/e2e/teacher-workbench.spec.ts`

Expected: existing desktop and mobile workflows pass without modifying their intended behavior.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 9: Commit overview synchronization.**

```bash
git add src/pages/WorkbenchPage.tsx src/components/workbench src/features/workbench
git commit -m "feat: synchronize overview todo and attendance workflows"
```

---

### Task 6: Complete students and family-school communication

**Files:**
- Modify: `src/pages/StudentsPage.tsx`
- Modify: `src/components/workbench/StudentDetailDrawer.tsx`
- Create: `src/pages/CommunicationsPage.tsx`
- Create: `src/pages/CommunicationsPage.test.tsx`
- Create: `src/features/students/StudentEditor.tsx`
- Create: `src/features/students/StudentEditor.test.tsx`
- Create: `src/features/communications/CommunicationComposer.tsx`
- Create: `src/features/communications/CommunicationComposer.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**

```ts
export type StudentFilters = {
  query: string
  classId: string
  attendanceStatus: AttendanceStatus | "all"
  page: number
}

export type CommunicationComposerProps = {
  open: boolean
  students: StudentSummary[]
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateCommunicationInput) => Promise<void>
}
```

- [ ] **Step 1: Write failing student and communication tests.**

```tsx
it("shows a server error on the student editor without losing entered values", async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn().mockRejectedValue(new Error("保存失败"))
  render(<StudentEditor student={student} onSubmit={onSubmit} onCancel={vi.fn()} />)
  await user.clear(screen.getByLabelText("姓名"))
  await user.type(screen.getByLabelText("姓名"), "林语桐新名")
  await user.click(screen.getByRole("button", { name: "保存档案" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("保存失败")
  expect(screen.getByLabelText("姓名")).toHaveValue("林语桐新名")
})

it("marks a communication processed and removes it from the unread count", async () => {
  const user = userEvent.setup()
  render(<CommunicationsPage />)
  await user.click(screen.getByRole("button", { name: /标记已处理/ }).first())
  expect(await screen.findByText("已处理")).toBeInTheDocument()
})
```

- [ ] **Step 2: Run focused tests and verify failure.**

Run: `npx vitest run src/features/students src/features/communications src/pages/CommunicationsPage.test.tsx`

Expected: FAIL because the editor, composer and communications page do not exist.

- [ ] **Step 3: Migrate student list to server query parameters.**

Use controlled search, class, attendance status and page state. Pass filters to `useStudentsQuery`; do not filter a stale snapshot in the page. Show query loading skeleton, no-result empty state, API error with retry, and pagination controls. Keep import/export handlers separate from list rendering.

- [ ] **Step 4: Implement import/export states.**

Validate `.xlsx`/`.xls` file extension and configured size before upload. Show selected filename, upload progress, imported count, failed row count and error report download. Export uses `repository.download` or the API response Blob and disables the button until the download starts. Do not put spreadsheet data in localStorage.

- [ ] **Step 5: Implement student detail and editing.**

Open the Drawer by student ID and query the detail from the server. Edit form fields include basic information, status, labels, attendance rate, family contact and note. Map 422 field errors to inputs, preserve unsaved values on failure, and invalidate student/list/overview caches after save.

- [ ] **Step 6: Implement communication page and composer.**

Render unread/processed records, student, contact relation, timestamp, content, “标记已处理” and “查看学生档案”. The composer validates selected student and content, submits through the repository, resets only after success, and invalidates communication, student detail and overview queries. Notification count must update without a full page reload.

- [ ] **Step 7: Wire cross-page routes.**

Add the communication page to the route registry. Search results and overview cards can open a student Drawer or route to communications with an unread filter. Preserve class and query context in UI state, not in a business-data browser cache.

- [ ] **Step 8: Run focused tests, lint and build.**

Run: `npx vitest run src/pages/StudentsPage.test.tsx src/pages/CommunicationsPage.test.tsx src/features/students src/features/communications`

Expected: all focused tests pass.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 9: Commit student and communication workflows.**

```bash
git add src/pages/StudentsPage.tsx src/pages/CommunicationsPage.tsx src/features/students src/features/communications src/components/workbench/StudentDetailDrawer.tsx src/App.tsx
git commit -m "feat: add student and communication workflows"
```

---

### Task 7: Complete schedules and assignments

**Files:**
- Modify: `src/pages/SchedulePage.tsx`
- Modify: `src/features/schedule/ScheduleComposer.tsx`
- Create: `src/pages/SchedulePage.integration.test.tsx`
- Modify: `src/pages/AssignmentsPage.tsx`
- Modify: `src/features/assignments/AssignmentComposer.tsx`
- Create: `src/pages/AssignmentsPage.integration.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**

```ts
export type ScheduleActions = {
  create(input: CreateScheduleInput): Promise<void>
  update(id: string, input: UpdateScheduleInput): Promise<void>
  remove(id: string): Promise<void>
}

export type AssignmentActions = {
  create(input: CreateAssignmentInput): Promise<void>
  remind(id: string): Promise<void>
}
```

- [ ] **Step 1: Write failing schedule and assignment integration tests.**

```tsx
it("creates a schedule and renders it in the selected day", async () => {
  const repository = createMockTeacherRepository()
  const created = await repository.createSchedule({ title: "家长开放日", startsAt: "2026-09-05T09:00:00+08:00", endsAt: "2026-09-05T10:00:00+08:00", classId: "class-1", className: "七年级 2 班", location: "报告厅" })
  const page = await repository.listSchedules({ classId: "class-1", date: "2026-09-05", view: "day" })
  expect(page.items.some((item) => item.id === created.id)).toBe(true)
})

it("sends one reminder and prevents a duplicate mutation while pending", async () => {
  const repository = createMockTeacherRepository()
  const result = await repository.remindAssignment("assignment-1")
  expect(result.assignmentId).toBe("assignment-1")
  expect(result.recipientCount).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run focused tests and verify failure.**

Run: `npx vitest run src/pages/SchedulePage.integration.test.tsx src/pages/AssignmentsPage.integration.test.tsx`

Expected: FAIL because pages currently use local callbacks and do not consume repository hooks.

- [ ] **Step 3: Migrate schedule page to query/mutation hooks.**

Keep day/week as query parameters. Detail Drawer reads the selected item by ID. Create/edit validates title, start/end, class and location; delete requires confirmation. After each mutation invalidate schedules, overview and next-lesson queries. Preserve form values and show error feedback on failure.

- [ ] **Step 4: Migrate assignments page to server data.**

Use search, class, status and pagination query parameters. The detail Drawer shows description, submission progress and unsubmitted students. Publish requires title, subject, class and due time. Reminder mutation is disabled while pending, returns recipient count and invalidates assignment/overview/student attention queries.

- [ ] **Step 5: Wire overview shortcuts.**

“登记考勤” opens the attendance Sheet, “发布作业” opens the assignment composer, “打开备课” navigates to lesson plans, and metric cards route to the corresponding filtered page. No shortcut may display a success toast without a repository result.

- [ ] **Step 6: Run focused tests, lint, build and E2E.**

Run: `npx vitest run src/pages/SchedulePage* src/pages/AssignmentsPage* src/features/schedule src/features/assignments`

Expected: all focused tests pass.

Run: `npm run test:e2e -- tests/e2e/teacher-workbench.spec.ts`

Expected: existing schedule and assignment flows pass and include server-shaped state updates.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 7: Commit schedules and assignments.**

```bash
git add src/pages/SchedulePage.tsx src/features/schedule src/pages/AssignmentsPage.tsx src/features/assignments src/App.tsx
git commit -m "feat: add schedule and assignment persistence flows"
```

---

### Task 8: Complete lesson plans, reports, settings, and help content

**Files:**
- Create: `src/pages/LessonPlansPage.tsx`
- Create: `src/pages/LessonPlansPage.test.tsx`
- Create: `src/features/lesson-plans/LessonPlanEditor.tsx`
- Create: `src/features/lesson-plans/LessonPlanEditor.test.tsx`
- Create: `src/pages/ReportsPage.tsx`
- Create: `src/pages/ReportsPage.test.tsx`
- Modify: `src/pages/SettingsPage.tsx`
- Create: `src/pages/SettingsPage.integration.test.tsx`
- Modify: `src/components/layout/HelpSheet.tsx`
- Modify: `src/App.tsx`

**Interfaces:**

```ts
export type LessonPlanEditorProps = {
  plan: LessonPlan
  onSave: (input: UpdateLessonPlanInput) => Promise<void>
  onCopy: () => Promise<void>
}

export type ReportsPageProps = {
  classId: string
  dateRange: DateRange
}
```

- [ ] **Step 1: Write failing lesson-plan, report and settings tests.**

```tsx
it("adds a lesson step and saves the edited plan", async () => {
  const user = userEvent.setup()
  const onSave = vi.fn().mockResolvedValue(undefined)
  render(<LessonPlanEditor plan={plan} onSave={onSave} onCopy={vi.fn()} />)
  await user.click(screen.getByRole("button", { name: "添加环节" }))
  expect(screen.getByLabelText("第5个环节名称")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "保存备课" }))
  expect(onSave).toHaveBeenCalledOnce()
})

it("does not report settings saved when the repository rejects the mutation", async () => {
  const user = userEvent.setup()
  render(<SettingsPage teacher={teacher} onSave={vi.fn().mockRejectedValue(new Error("网络错误"))} />)
  await user.click(screen.getByRole("button", { name: "保存设置" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("网络错误")
  expect(screen.queryByText("设置已保存")).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run focused tests and verify failure.**

Run: `npx vitest run src/pages/LessonPlansPage.test.tsx src/pages/ReportsPage.test.tsx src/pages/SettingsPage.integration.test.tsx`

Expected: FAIL because the new pages and server-backed save state do not exist.

- [ ] **Step 3: Implement lesson-plan list and editor.**

Load the selected plan from `listLessonPlans`, preserve the selected ID in UI state, and edit all reference fields: subject, title, date, period, objectives, focus, difficulty, steps, materials and reflection. Add, edit, delete and reorder steps. Save and copy use mutation loading states; failures retain the draft and show an error alert.

- [ ] **Step 4: Implement reports page.**

Use the reference page’s existing trend and class summary data. Add date-range/week selection, loading skeleton, empty state, retry state and drilldown actions to students, attendance or assignments. Do not invent new business metrics beyond the reference content and the domain model.

- [ ] **Step 5: Make settings server-backed.**

Load settings through `useTeacherSettingsQuery`, initialize form fields from query data, and call `updateTeacherSettings`. The success message appears only after a resolved mutation. On refresh, the form must display the server-returned values. Persist only visual preferences locally and keep business profile fields server-owned.

- [ ] **Step 6: Finalize help content and route registry.**

Register lesson plans and reports under the reference labels “备课中心” and “数据周报”. The help Sheet lists these routes, existing shortcuts and keyboard focus behavior. Remove `PlaceholderPage` usage for any visible reference entry.

- [ ] **Step 7: Run focused tests, lint and build.**

Run: `npx vitest run src/pages src/features/lesson-plans src/components/layout/HelpSheet.test.tsx`

Expected: all focused tests pass.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 8: Commit lesson plans, reports and settings.**

```bash
git add src/pages src/features/lesson-plans src/components/layout/HelpSheet.tsx src/App.tsx
git commit -m "feat: add lesson plans reports and persistent settings"
```

---

### Task 9: Add smooth transitions, accessibility, and mobile performance safeguards

**Files:**
- Modify: `src/index.css`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Create: `src/lib/motion.ts`
- Create: `src/lib/accessibility.test.ts`
- Create: `tests/e2e/teacher-workbench-responsive.spec.ts`

**Interfaces:**

```ts
export const motionDurations = {
  page: 180,
  overlay: 200,
  feedback: 160,
} as const

export function getMotionPreference(): "full" | "reduced"
```

- [ ] **Step 1: Write failing responsive and motion tests.**

```tsx
it("uses reduced motion without removing status visibility", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  expect(getMotionPreference()).toBe("reduced")
  expect(document.body.textContent).not.toBe("")
})
```

- [ ] **Step 2: Run focused tests and verify failure.**

Run: `npx vitest run src/lib/accessibility.test.ts`

Expected: FAIL because the motion preference helper does not exist.

- [ ] **Step 3: Add page and overlay transition classes.**

Animate only the content region and overlay surfaces. Keep shell dimensions stable during route changes. Use 160-220ms durations and transform/opacity only. Do not animate layout-heavy properties or every list row on large pages.

- [ ] **Step 4: Refine reduced-motion behavior.**

Disable decorative page transitions under `prefers-reduced-motion`, but keep visible loading indicators, success/error text, focus rings and disabled states. Do not collapse an element solely because animation is disabled.

- [ ] **Step 5: Reduce mobile blur/video cost.**

At mobile widths reduce the number and strength of `backdrop-filter` layers, keep the video as the visual material, and use the existing poster/fallback if the browser cannot play the video. Verify no horizontal overflow and touch targets at least 44px.

- [ ] **Step 6: Add keyboard and screen-reader checks.**

Verify menu, search listbox, Sheet, Dialog, forms, comboboxes and toast/status regions have accessible names, focus restoration and `aria-live`/`role=status` where needed. Use the same visible label and accessible label for navigation.

- [ ] **Step 7: Run visual and responsive checks.**

Run: `npx playwright test tests/e2e/teacher-workbench-responsive.spec.ts --project=chromium --project=mobile`

Expected: desktop and mobile pages have no horizontal overflow, shell controls remain reachable, and reduced-motion context still exposes status text.

Run: `npm run lint` and `npm run build`

Expected: 0 lint errors and a successful build.

- [ ] **Step 8: Commit interaction polish.**

```bash
git add src/index.css src/app/AppShell.tsx src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/lib/motion.ts src/lib/accessibility.test.ts tests/e2e/teacher-workbench-responsive.spec.ts
git commit -m "feat: polish workbench motion accessibility and mobile performance"
```

---

### Task 10: Add complete E2E coverage, API contract checks, and deployment configuration

**Files:**
- Create: `tests/e2e/teacher-workbench-persistence.spec.ts`
- Create: `tests/e2e/api-provider-contract.spec.ts`
- Modify: `tests/e2e/teacher-workbench.spec.ts`
- Modify: `playwright.config.ts`
- Create: `.env.example`
- Create: `docs/development-data-provider.md`
- Create: `scripts/check-data-provider.mjs`
- Modify: `package.json`

**Interfaces:**

```ts
test("persists a todo mutation after route change and reload", async ({ page }) => {
  // Login, complete one todo, navigate to today's tasks, reload, and assert the same todo is completed.
})

test("rolls back an attendance mutation when the API returns 500", async ({ page }) => {
  // Intercept save attendance, return 500, assert visible error and original summary values.
})
```

- [ ] **Step 1: Write the complete E2E specs against the current mock provider.**

Cover these independent flows with fresh state per test: login/logout/401, all 9 visible entries, class switching, search result selection, notification navigation, task add/complete/restore/edit/snooze, attendance batch and individual state/reason, student search/filter/detail/edit/import/export, schedule day/week/create/edit/delete, assignment publish/detail/reminder, communication create/resolve/student navigation, lesson-plan edit/add/delete/reorder/save/copy, reports filter/drilldown, settings save/reload and help Sheet.

- [ ] **Step 2: Run the new E2E tests and verify every intended gap fails before implementation is complete.**

Run: `npx playwright test tests/e2e/teacher-workbench-persistence.spec.ts`

Expected: tests that exercise not-yet-migrated pages fail with locator or state assertions; do not weaken assertions to make them pass.

- [ ] **Step 3: Add API-provider contract tests.**

Use `page.route` or the Playwright request fixture to return deterministic payloads for overview, mutation success, 401, 403, 409 and 422. Assert that the UI sends the selected teacher/class IDs, query filters and mutation bodies through the adapter. No test may require a real production database.

- [ ] **Step 4: Add deployment data-provider configuration.**

`.env.example` must document:

```text
VITE_DATA_PROVIDER=mock
VITE_API_BASE_URL=http://localhost:3001
VITE_API_ROUTES_JSON={}
```

The startup check must reject `VITE_DATA_PROVIDER=api` when base URL or a complete route map is missing, and must never silently select mock in production builds. Document cookie/session requirements, CORS, HTTPS, backend route mapping, file upload limits and required API error shape.

- [ ] **Step 5: Run full verification.**

Run: `npx vitest run`

Expected: all unit and component tests pass.

Run: `npm run lint`

Expected: 0 errors. Existing non-blocking Fast Refresh warnings may remain documented.

Run: `npm run build`

Expected: production build exits 0.

Run: `npm run test:e2e`

Expected: desktop and mobile flows pass; only explicitly skipped project-specific tests remain skipped.

Run: `node C:\Users\Administrator\.codex\skills\impeccable\scripts\detect.mjs --json src index.html`

Expected: no new failure-level findings; advisory findings are reviewed against `DESIGN.md`.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 6: Commit test and deployment documentation.**

```bash
git add tests playwright.config.ts .env.example docs/development-data-provider.md scripts/check-data-provider.mjs package.json
git commit -m "test: cover persisted workbench flows and provider deployment"
```

## Final Handoff Checklist

- [ ] Every visible reference-page entry maps to a real page, Sheet, Drawer, mutation or explicit help surface.
- [ ] `App.tsx` no longer owns business arrays or direct local mutation logic.
- [ ] Mock and API repositories satisfy the same `TeacherRepository` interface.
- [ ] Business data is never written to `localStorage`.
- [ ] API provider has explicit auth, error, permission, conflict and validation behavior.
- [ ] Refresh and route changes preserve server mutation results.
- [ ] Search, notifications, class switching and cross-page drilldowns work on desktop and mobile.
- [ ] Loading, empty, error and success states are visible for every async module.
- [ ] E2E tests cover the complete teacher workflow and API route interception.
- [ ] Production build refuses incomplete API provider configuration.
- [ ] Vitest, lint, build, Playwright, detector and `git diff --check` have fresh passing evidence.
