# 教师工作台服务端持久化与交互复刻设计

## 1. 文档信息

- 日期：2026-09-05
- 状态：设计稿，待用户审阅
- 目标：在当前 React + Vite + TypeScript + Tailwind CSS + shadcn/ui 项目中，完整复刻 `http://localhost:3000/` 的教师工作台交互，并将业务数据从浏览器存储迁移到服务端持久化。
- 当前参考：2026-09-05 通过本地 Playwright 对参考页的可见页面、按钮、表单和状态变化进行采集。

## 2. 背景与现状

当前项目已经完成参考页风格的工作台壳层和核心首页，但数据主要由 `App.tsx` 中的本地状态与 mock snapshot 驱动，部分交互仍为空回调或占位页。当前已确认的主要差距如下：

- 参考页有 9 个可见入口：班级总览、今日任务、学生档案、课程与值日、备课中心、家校沟通、数据周报、系统设置、使用帮助。
- 当前项目的班级管理、成绩管理、家校沟通、备课资料仍有占位页面。
- 顶部搜索、通知、部分快捷操作和下一节课的备课入口没有完整行为。
- 设置保存、考勤摘要和部分待办行为没有形成可靠的持久化闭环。
- 当前页面文案的视觉名称与链接的无障碍名称存在分离，需要统一可见名称、路由标签和辅助技术名称。

## 3. 设计目标

### 3.1 必须达成

1. 参考页中每个可见按钮都产生明确结果：导航、筛选、打开详情、打开弹层、保存、更新状态或给出明确提示。
2. 业务数据以服务端数据库为唯一事实来源，刷新页面、重新登录或更换设备后仍可获取同一份数据。
3. 页面之间共享同一份服务端状态：例如考勤登记会同步影响总览、学生档案和关注列表；作业发布会同步影响作业统计和任务摘要。
4. 失败请求不会静默失败；操作有 loading、成功反馈、错误提示和必要的状态回滚。
5. 保留参考页的视觉语言，同时补齐工作台需要的交互反馈、空状态、错误状态和移动端行为。
6. 通过单元测试与 Playwright 覆盖页面、弹层、表单和跨页面联动。

### 3.2 不在本次范围

- 不复制或嵌入参考页的 HTML、CSS 或打包产物。
- 不在前端直接访问数据库；前端只通过后端 API 访问业务数据。
- 不臆造后端接口 URL、字段名或认证协议。API 适配器先定义前端领域契约，具体映射以实际后端接口文档为准。
- 不把正式业务实体写入 `localStorage`。离线编辑、离线队列和复杂冲突合并另行立项。
- 不新增参考页未出现的复杂业务规则；数据周报只实现参考页已有的展示、筛选和跳转能力。

## 4. 核心决策

### 4.1 服务端状态与界面状态分离

采用两类状态：

- 服务端状态：学生、任务、考勤、日程、作业、沟通记录、教案、班级汇总、教师资料。使用 TanStack Query 管理请求、缓存、失效、重试和 mutation 状态。
- 界面状态：当前路由、打开的 Dialog/Sheet、搜索关键字、筛选项、当前选中的班级、视图模式、toast、局部编辑草稿。使用页面局部 state 和工作台 UI reducer 管理。

页面组件不得直接读取 `localStorage` 或拼接 fetch 请求。页面只调用领域 hooks，例如 `useStudentsQuery`、`useUpdateTodoMutation`、`useSaveAttendanceMutation`。

### 4.2 Repository 作为后端边界

新增 `TeacherRepository` 领域接口，将 UI 与具体 HTTP 协议隔离：

```ts
interface TeacherRepository {
  getWorkbenchContext(): Promise<WorkbenchContext>
  getOverview(input: OverviewQuery): Promise<WorkbenchOverview>
  listStudents(input: StudentQuery): Promise<StudentPage>
  getStudent(id: string): Promise<StudentDetail>
  updateStudent(id: string, input: UpdateStudentInput): Promise<StudentDetail>
  listTodos(input: TodoQuery): Promise<TodoPage>
  createTodo(input: CreateTodoInput): Promise<Todo>
  updateTodo(id: string, input: UpdateTodoInput): Promise<Todo>
  listAttendance(input: AttendanceQuery): Promise<AttendanceSummary>
  saveAttendance(input: SaveAttendanceInput): Promise<AttendanceSummary>
  listSchedules(input: ScheduleQuery): Promise<SchedulePage>
  createSchedule(input: CreateScheduleInput): Promise<Schedule>
  updateSchedule(id: string, input: UpdateScheduleInput): Promise<Schedule>
  deleteSchedule(id: string): Promise<void>
  listAssignments(input: AssignmentQuery): Promise<AssignmentPage>
  createAssignment(input: CreateAssignmentInput): Promise<Assignment>
  remindAssignment(id: string): Promise<ReminderResult>
  listCommunications(input: CommunicationQuery): Promise<CommunicationPage>
  createCommunication(input: CreateCommunicationInput): Promise<Communication>
  resolveCommunication(id: string): Promise<Communication>
  listLessonPlans(input: LessonPlanQuery): Promise<LessonPlanPage>
  updateLessonPlan(id: string, input: UpdateLessonPlanInput): Promise<LessonPlan>
  copyLessonPlan(id: string): Promise<LessonPlan>
  getTeacherSettings(): Promise<TeacherSettings>
  updateTeacherSettings(input: UpdateTeacherSettingsInput): Promise<TeacherSettings>
}
```

实现分为两套：

- `MockTeacherRepository`：开发和自动化测试使用，数据来自当前 mock fixture，但通过同样的异步接口返回。
- `ApiTeacherRepository`：生产使用，将领域请求映射到实际后端 API，统一处理认证、错误码和响应转换。

前端通过环境配置选择实现，但生产环境禁止静默回退到 mock：

```text
VITE_DATA_PROVIDER=mock  # 本地开发和测试
VITE_DATA_PROVIDER=api   # 预发布和生产
```

### 4.3 认证与数据范围

- 登录成功后由认证模块保存服务端要求的 session 或 token，不在业务页面自行处理认证。
- API client 默认携带认证信息，并在 401 时清理会话、返回登录弹层或跳转首页。
- 所有查询和 mutation 自动带上当前教师上下文；班级 ID 由服务端校验，前端不能通过修改参数访问其他教师无权限的班级。
- 查询 key 必须包含教师上下文、班级 ID、筛选条件和分页信息，防止不同班级缓存串用。

## 5. 页面与功能设计

### 5.1 工作台壳层

- `AppShell` 固定视频背景、玻璃容器、侧栏、顶部栏和内容滚动区。
- 导航显示参考页的 8 个业务入口和 1 个帮助入口；移除当前参考页不存在的“班级管理”侧栏入口。
- 视觉名称、`aria-label`、路由 label 使用同一份导航配置，避免“学生档案/学生管理”不一致。
- 页面切换只替换内容区，保留侧栏和顶部栏；切换过程中显示局部 loading，不让整个页面闪烁。
- 移动端由 Sheet 承载导航，选择路由后自动关闭 Sheet，并将焦点返回打开按钮。

### 5.2 班级总览

- 班级切换更新 overview、学生、考勤、作业和沟通查询的上下文。
- 指标卡行为：在册学生跳转学生档案；今日到校打开学生状态筛选；待办事项跳转今日任务；未读消息跳转家校沟通。
- 顶部搜索实时搜索学生、任务和消息，结果以可键盘操作的浮层展示；选择结果跳转对应详情。
- 通知按钮跳转家校沟通并定位未读记录，成功处理后未读角标实时更新。
- 今日班务支持新增、完成、恢复、查看全部、编辑和延后；操作成功后更新任务列表与摘要计数。
- 今日考勤打开快速登记 Sheet，支持全员到校、异常筛选、学生级状态和请假原因；保存后刷新考勤摘要、学生档案和关注列表。
- “需要关注”支持类型筛选、查看学生、标记已处理；处理结果刷新未处理数量。
- 下一节课的“打开备课”跳转备课中心并选中对应教案。
- 快捷操作全部绑定真实动作：新建待办、登记考勤、发布作业、记录学生关注、发布班级通知。

### 5.3 今日任务

- 展示服务端任务列表和完成状态。
- 支持新增任务、完成、恢复、编辑、延后、删除和回到来源页面。
- 任务状态更新采用乐观更新；失败时恢复旧状态并显示重试入口。
- 总览摘要、任务计数和今日班务列表使用同一 query cache，避免页面之间出现不同数字。

### 5.4 学生档案

- 支持姓名/座号搜索、班级筛选、考勤状态筛选和分页。
- 支持导入 Excel：前端先校验文件格式和列结构，再提交后端；显示导入进度、成功数、失败行和下载错误报告。
- 支持导出 Excel：由后端生成文件或返回下载流，按钮显示生成中状态，完成后触发下载。
- 点击学生打开详情 Drawer；详情包含基本信息、考勤、到校率、关注标签、家校联系人、备注和近期记录。
- 编辑学生信息使用独立表单，支持保存、取消、字段校验和错误定位；保存后刷新列表与详情缓存。
- “查看记录”可展开近期学习、考勤和沟通记录，不再使用空回调。

### 5.5 课程与值日

- 日视图和周视图切换只改变查询参数，不丢失当前筛选。
- 支持新建、查看详情、编辑和删除日程。
- 新建和编辑表单校验时间范围、标题、班级和地点；提交时按钮进入 loading。
- 日程更新后同步首页课程时间线和下一节课卡片。

### 5.6 作业管理

- 支持作业搜索、班级筛选、状态筛选、分页和详情查看。
- 发布作业表单包含标题、科目、班级、截止时间、说明和附件入口；服务端返回后更新作业列表。
- “提醒未交”显示目标人数和发送结果，重复点击有防抖或 disabled 状态。
- 作业完成数据能反映到总览指标和学生关注列表。

### 5.7 备课中心

- 左侧展示教案列表和保存状态，点击列表切换当前教案。
- 编辑学科、课题、日期、节次、教学目标、重难点、课前材料和课后反思。
- 课堂流程支持新增、编辑、删除和排序；每个环节包含名称、预计时长和师生活动。
- 保存前显示未保存状态，保存成功后刷新服务端数据；失败保留草稿并给出重试。
- 支持复制教案，复制结果生成新的服务端实体，不覆盖原教案。

### 5.8 家校沟通

- 展示未读和已处理沟通记录，支持新增沟通、选择学生、输入内容和保存。
- “标记已处理”调用服务端 mutation，成功后更新未读角标和列表状态。
- “查看学生档案”打开对应学生详情，不刷新整个工作台。
- 通信内容不在 URL 或 localStorage 中保存，表单关闭时仅清理未提交草稿。

### 5.9 数据周报

- 按参考页已有的班级汇总、到校趋势和相关指标呈现数据。
- 支持时间范围或周次切换时重新查询服务端数据。
- 趋势图数据为空时显示空状态，接口失败时显示错误状态和重试。
- 需要查看明细的指标跳转到学生、考勤或作业页面，并携带筛选上下文。

### 5.10 系统设置与使用帮助

- 系统设置分为教师资料和工作台偏好，保存后由服务端返回最新值并刷新缓存。
- 保存按钮在请求期间 disabled；失败不显示成功提示，成功后显示 toast。
- `localStorage` 只保存非业务偏好，例如上次侧栏展开状态和动效偏好，不保存姓名、学生、任务或沟通记录。
- 使用帮助使用 Sheet，展示按模块分组的入口说明和快捷操作；关闭后恢复原焦点。

## 6. 数据流与同步策略

### 6.1 首次进入

1. 认证模块确认当前 session。
2. 工作台上下文查询当前教师可用班级和默认班级。
3. overview query 加载摘要、任务、考勤和关注事项。
4. 页面按需加载学生、日程、作业、沟通和教案，避免首次进入一次性请求全部详情。
5. 任一查询失败只影响对应模块，壳层和其他模块保持可用。

### 6.2 Mutation 生命周期

1. 表单先做本地字段校验。
2. 提交按钮进入 loading，阻止重复提交。
3. 可安全乐观更新的操作先更新缓存，并记录 rollback snapshot。
4. API 成功后以服务端返回值覆盖缓存，并失效受影响的关联 query。
5. API 失败时执行 rollback，显示可读错误和重试动作。
6. 成功或失败都结束 loading，避免页面永久僵住。

### 6.3 并发与版本

- 更新请求携带资源的 `updatedAt` 或版本号（具体字段由后端契约确定）。
- 服务端返回冲突时前端不覆盖用户最新编辑，提示数据已被他人更新，并提供重新加载和查看差异入口。
- 同一实体的重复 mutation 使用 mutation key 防止重复提交。

## 7. 视觉与交互体验

- 保持参考页的深色视频背景、玻璃容器、低饱和边框和高对比文字。
- 页面切换使用 160-220ms 的淡入/上移，内容区域先保持尺寸，避免布局跳动。
- Dialog、Sheet、DropdownMenu 统一使用 shadcn/ui，并保证打开、关闭、提交、错误和成功都有状态反馈。
- 弹层内的表单采用明确的 label、错误文本和焦点定位；保存失败时焦点移动到错误摘要。
- 所有触控目标不小于 44px；移动端列表卡片避免横向溢出。
- 背景视频保留 `autoplay`、`loop`、`muted`、`playsInline`；移动端降低玻璃 blur 层级，必要时使用静态 poster 作为低性能 fallback。
- `prefers-reduced-motion` 下关闭装饰性页面动画，但保留必要的 loading、错误和状态变化可见性。

## 8. 错误、空状态与安全

- 网络错误：显示模块级错误状态、错误原因的简短说明和重试按钮。
- 401：清理当前认证状态并回到登录弹层。
- 403：显示无权限状态，不暴露服务端敏感细节。
- 404：资源被删除或不存在时返回列表页并提示。
- 409：显示并发冲突提示，不静默覆盖本地编辑。
- 422：把服务端字段错误映射到对应输入框。
- 所有用户输入在发送前按领域规则校验，展示前按文本内容渲染，不使用危险 HTML 注入。
- 文件上传限制类型、大小和数量；导入失败只保留服务端返回的错误报告引用。

## 9. 代码组织

建议的目录边界：

```text
src/
  app/
    AppShell.tsx
    routes.ts
    TeacherWorkbenchProvider.tsx
  data/
    apiClient.ts
    teacherRepository.ts
    apiTeacherRepository.ts
    mockTeacherRepository.ts
    queryKeys.ts
  domain/
    workbench/
      models.ts
      actions.ts
      selectors.ts
      validation.ts
  features/
    overview/
    todos/
    attendance/
    students/
    schedule/
    assignments/
    communications/
    lesson-plans/
    settings/
    help/
  pages/
    WorkbenchPage.tsx
    TodosPage.tsx
    StudentsPage.tsx
    SchedulePage.tsx
    AssignmentsPage.tsx
    CommunicationsPage.tsx
    LessonPlansPage.tsx
    ReportsPage.tsx
    SettingsPage.tsx
```

当前组件可以保留并逐步迁移，但 `App.tsx` 不再承载所有业务 state、数据转换和 mutation；它只负责 Provider、路由和页面装配。

## 10. 测试策略

### 10.1 单元与组件测试

- repository 响应转换、错误码映射和 query key。
- reducer、selector 和摘要统计，重点覆盖考勤状态变化、待办完成/恢复和未读数量。
- 每个表单的必填字段、时间范围、错误显示和提交 disabled 状态。
- 每个页面的 loading、success、empty、error 状态。
- shadcn Dialog/Sheet 的打开、关闭和焦点返回。

### 10.2 Playwright 端到端测试

覆盖桌面端和移动端：

- 登录、退出和 401 回到登录。
- 9 个导航入口和移动端导航 Sheet。
- 总览指标跳转、搜索结果跳转、通知跳转、班级切换。
- 任务新增/完成/恢复/编辑/延后。
- 考勤批量登记、学生级状态、请假原因、失败回滚。
- 学生搜索/筛选/详情/编辑保存/导入/导出。
- 日程日周视图、新建/编辑/删除。
- 作业发布、详情、催交。
- 沟通新增、标记已处理、学生详情联动。
- 教案选择、编辑、添加流程、保存、复制。
- 设置保存后刷新仍保持服务端返回值。
- 网络失败、空列表、重复提交、移动端横向溢出和 reduced-motion。

测试默认使用 `MockTeacherRepository` 或 Playwright route interception，保证不依赖真实数据库；另设一组 API smoke test 在预发布环境验证 `ApiTeacherRepository` 的契约。

## 11. 实施阶段

### Phase 1：数据边界

- 建立领域模型、Repository 接口、MockRepository、ApiClient、query keys 和错误模型。
- 将当前 mock snapshot 转换为异步数据源。
- 为核心 query/mutation 写测试。

### Phase 2：总览闭环

- 接入导航、班级上下文、搜索、通知、指标跳转、任务、考勤和关注事项。
- 清理空回调并增加成功/失败反馈。

### Phase 3：核心业务页面

- 完成任务、学生、日程、作业、家校沟通页面及跨页面缓存同步。

### Phase 4：教学资料与账户设置

- 完成备课中心、数据周报、系统设置和帮助 Sheet。
- 接入服务端持久化与认证错误处理。

### Phase 5：体验与上线验证

- 补齐动效、loading、空/错状态、键盘可用性、移动端和低性能设备策略。
- 运行全量 Vitest、Lint、Build、Playwright 和 API smoke test。
- 在预发布环境验证刷新、换设备、权限、并发更新和文件导入导出。

## 12. 验收标准

- 参考页所有可见入口在当前项目中均有对应的可验证行为。
- 不存在未提示的空按钮、空回调或点击后无变化的业务入口。
- 所有业务 mutation 成功后刷新页面仍可看到服务端结果。
- 任意请求失败都有明确反馈，且不会把失败状态误显示为成功。
- 桌面端和移动端核心流程全部通过 Playwright。
- 生产构建不依赖 mock 数据，不把正式业务实体写入浏览器存储。
- 页面视觉仍保持参考页的主结构，同时动效、焦点和 loading 状态让交互自然可感知。

## 13. 待确认事项

以下内容不阻塞本设计，但在实现 `ApiTeacherRepository` 前必须从后端确认：

1. 登录方式：Cookie session、JWT 还是其他 token。
2. API base URL、接口清单、请求字段和响应字段。
3. 教师、班级、学生、任务等实体的主键类型和更新时间/版本字段。
4. 文件导入导出的接口方式和大小限制。
5. 统一错误码、权限码和并发冲突返回格式。
6. 是否需要服务端推送未读消息或考勤实时变化。

在这些契约确认前，前端可以完整开发和测试 MockRepository 版本，但不会假装已经完成真实服务端联调。
