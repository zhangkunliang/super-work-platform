import type {
  AssignmentItem,
  AssignmentPage,
  AssignmentQuery,
  AttendanceQuery,
  AttendanceSummary,
  CommunicationPage,
  CommunicationQuery,
  CommunicationRecord,
  CreateAssignmentInput,
  CreateCommunicationInput,
  CreateScheduleInput,
  CreateTodoInput,
  LessonPlan,
  LessonPlanPage,
  LessonPlanQuery,
  OverviewQuery,
  ReminderResult,
  SaveAttendanceInput,
  ScheduleItem,
  SchedulePage,
  ScheduleQuery,
  StudentDetail,
  StudentPage,
  StudentQuery,
  TeacherSettings,
  TodoItem,
  TodoPage,
  TodoQuery,
  UpdateLessonPlanInput,
  UpdateScheduleInput,
  UpdateStudentInput,
  UpdateTeacherSettingsInput,
  UpdateTodoInput,
  WorkbenchContext,
  WorkbenchOverview,
} from "@/domain/workbench/models"
import type { ApiClient } from "./apiClient"
import type { TeacherRepository } from "./teacherRepository"

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

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value))
  })
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

export function createApiTeacherRepository(input: { client: ApiClient; routes: ApiRouteMap }): TeacherRepository {
  const { client, routes } = input
  return {
    getWorkbenchContext: () => client.request<WorkbenchContext>({ path: routes.context, method: "GET" }),
    getOverview: (query: OverviewQuery) => client.request<WorkbenchOverview>({ path: withQuery(routes.overview, query), method: "GET" }),
    listStudents: (query: StudentQuery) => client.request<StudentPage>({ path: withQuery(routes.students, query), method: "GET" }),
    getStudent: (id: string) => client.request<StudentDetail>({ path: routes.student(id), method: "GET" }),
    updateStudent: (id: string, body: UpdateStudentInput) => client.request<StudentDetail>({ path: routes.student(id), method: "PATCH", body }),
    listTodos: (query: TodoQuery) => client.request<TodoPage>({ path: withQuery(routes.todos, query), method: "GET" }),
    createTodo: (body: CreateTodoInput) => client.request<TodoItem>({ path: routes.todos, method: "POST", body }),
    updateTodo: (id: string, body: UpdateTodoInput) => client.request<TodoItem>({ path: routes.todo(id), method: "PATCH", body }),
    listAttendance: (query: AttendanceQuery) => client.request<AttendanceSummary>({ path: withQuery(routes.attendance, query), method: "GET" }),
    saveAttendance: (body: SaveAttendanceInput) => client.request<AttendanceSummary>({ path: routes.attendance, method: "PUT", body }),
    listSchedules: (query: ScheduleQuery) => client.request<SchedulePage>({ path: withQuery(routes.schedules, query), method: "GET" }),
    createSchedule: (body: CreateScheduleInput) => client.request<ScheduleItem>({ path: routes.schedules, method: "POST", body }),
    updateSchedule: (id: string, body: UpdateScheduleInput) => client.request<ScheduleItem>({ path: routes.schedule(id), method: "PATCH", body }),
    deleteSchedule: (id: string) => client.request<void>({ path: routes.schedule(id), method: "DELETE" }),
    listAssignments: (query: AssignmentQuery) => client.request<AssignmentPage>({ path: withQuery(routes.assignments, query), method: "GET" }),
    createAssignment: (body: CreateAssignmentInput) => client.request<AssignmentItem>({ path: routes.assignments, method: "POST", body }),
    remindAssignment: (id: string) => client.request<ReminderResult>({ path: routes.assignmentReminder(id), method: "POST" }),
    listCommunications: (query: CommunicationQuery) => client.request<CommunicationPage>({ path: withQuery(routes.communications, query), method: "GET" }),
    createCommunication: (body: CreateCommunicationInput) => client.request<CommunicationRecord>({ path: routes.communications, method: "POST", body }),
    resolveCommunication: (id: string) => client.request<CommunicationRecord>({ path: routes.communication(id), method: "PATCH", body: { status: "resolved" } }),
    listLessonPlans: (query: LessonPlanQuery) => client.request<LessonPlanPage>({ path: withQuery(routes.lessonPlans, query), method: "GET" }),
    updateLessonPlan: (id: string, body: UpdateLessonPlanInput) => client.request<LessonPlan>({ path: routes.lessonPlan(id), method: "PATCH", body }),
    copyLessonPlan: (id: string) => client.request<LessonPlan>({ path: routes.lessonPlanCopy(id), method: "POST" }),
    getTeacherSettings: () => client.request<TeacherSettings>({ path: routes.settings, method: "GET" }),
    updateTeacherSettings: (body: UpdateTeacherSettingsInput) => client.request<TeacherSettings>({ path: routes.settings, method: "PATCH", body }),
  }
}
