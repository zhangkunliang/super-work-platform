import { QueryClient, QueryClientProvider, useQuery, type UseQueryResult } from "@tanstack/react-query"
import { createContext, useContext, useState, type ReactNode } from "react"
import { createApiClient } from "./apiClient"
import { createApiTeacherRepository, type ApiRouteMap } from "./apiTeacherRepository"
import { createMockTeacherRepository } from "./mockTeacherRepository"
import { queryKeys } from "./queryKeys"
import type {
  AttendanceQuery,
  AttendanceSummary,
  OverviewQuery,
  StudentPage,
  StudentQuery,
  TodoPage,
  TodoQuery,
  WorkbenchContext,
  WorkbenchOverview,
} from "@/domain/workbench/models"
import { RepositoryError, type TeacherRepository } from "./teacherRepository"

const RepositoryContext = createContext<TeacherRepository | null>(null)
const TeacherIdContext = createContext<string | null>(null)

const routeKeys = [
  "context", "overview", "students", "student", "todos", "todo", "attendance", "schedules", "schedule", "assignments", "assignmentReminder", "communications", "communication", "lessonPlans", "lessonPlan", "lessonPlanCopy", "settings",
] as const

type RouteKey = typeof routeKeys[number]

function routeWithId(template: string, id: string): string {
  return template.replace(":id", encodeURIComponent(id)).replace("{id}", encodeURIComponent(id))
}

export function parseApiRoutes(serialized: string): ApiRouteMap {
  let raw: Partial<Record<RouteKey, string>>
  try {
    raw = JSON.parse(serialized) as Partial<Record<RouteKey, string>>
  } catch {
    throw new Error("VITE_API_ROUTES_JSON 必须是有效的 JSON")
  }
  const missing = routeKeys.filter((key) => typeof raw[key] !== "string" || !raw[key])
  if (missing.length) throw new Error(`API 路由配置不完整，缺少: ${missing.join(", ")}`)
  const required = raw as Record<RouteKey, string>
  return {
    context: required.context,
    overview: required.overview,
    students: required.students,
    student: (id) => routeWithId(required.student, id),
    todos: required.todos,
    todo: (id) => routeWithId(required.todo, id),
    attendance: required.attendance,
    schedules: required.schedules,
    schedule: (id) => routeWithId(required.schedule, id),
    assignments: required.assignments,
    assignmentReminder: (id) => routeWithId(required.assignmentReminder, id),
    communications: required.communications,
    communication: (id) => routeWithId(required.communication, id),
    lessonPlans: required.lessonPlans,
    lessonPlan: (id) => routeWithId(required.lessonPlan, id),
    lessonPlanCopy: (id) => routeWithId(required.lessonPlanCopy, id),
    settings: required.settings,
  }
}

export function createConfiguredTeacherRepository(): TeacherRepository {
  const provider = import.meta.env.VITE_DATA_PROVIDER ?? (import.meta.env.PROD ? "api" : "mock")
  if (provider === "mock") return createMockTeacherRepository()
  if (provider !== "api") throw new Error(`不支持的数据提供方: ${provider}`)
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  const serializedRoutes = import.meta.env.VITE_API_ROUTES_JSON
  if (!baseUrl) throw new Error("使用 API 数据提供方时必须配置 VITE_API_BASE_URL")
  if (!serializedRoutes) throw new Error("使用 API 数据提供方时必须配置 VITE_API_ROUTES_JSON")
  return createApiTeacherRepository({ client: createApiClient({ baseUrl }), routes: parseApiRoutes(serializedRoutes) })
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => error instanceof RepositoryError && ["NETWORK_ERROR", "SERVER_ERROR"].includes(error.code) && failureCount < 1,
      },
    },
  })
}

export function TeacherDataProvider({ children, teacherId, repository }: { children: ReactNode; teacherId: string; repository?: TeacherRepository }) {
  const [queryClient] = useState(createQueryClient)
  const [dataRepository] = useState(() => repository ?? createConfiguredTeacherRepository())
  return <QueryClientProvider client={queryClient}><TeacherIdContext.Provider value={teacherId}><RepositoryContext.Provider value={dataRepository}>{children}</RepositoryContext.Provider></TeacherIdContext.Provider></QueryClientProvider>
}

export function useTeacherRepository(): TeacherRepository {
  const repository = useContext(RepositoryContext)
  if (!repository) throw new Error("TeacherDataProvider is missing")
  return repository
}

function useTeacherId(): string {
  const teacherId = useContext(TeacherIdContext)
  if (!teacherId) throw new Error("TeacherDataProvider is missing")
  return teacherId
}

export function useWorkbenchContextQuery(): UseQueryResult<WorkbenchContext, RepositoryError> {
  const repository = useTeacherRepository()
  const teacherId = useTeacherId()
  return useQuery({ queryKey: queryKeys.context(teacherId), queryFn: repository.getWorkbenchContext, meta: { teacherId } })
}

export function useOverviewQuery(input: OverviewQuery): UseQueryResult<WorkbenchOverview, RepositoryError> {
  const repository = useTeacherRepository()
  const teacherId = useTeacherId()
  return useQuery({ queryKey: queryKeys.overview(teacherId, input), queryFn: () => repository.getOverview(input) })
}

export function useStudentsQuery(input: StudentQuery): UseQueryResult<StudentPage, RepositoryError> {
  const repository = useTeacherRepository()
  const teacherId = useTeacherId()
  return useQuery({ queryKey: queryKeys.students(teacherId, input), queryFn: () => repository.listStudents(input) })
}

export function useTodosQuery(input: TodoQuery): UseQueryResult<TodoPage, RepositoryError> {
  const repository = useTeacherRepository()
  const teacherId = useTeacherId()
  return useQuery({ queryKey: queryKeys.todos(teacherId, input), queryFn: () => repository.listTodos(input) })
}

export function useAttendanceQuery(input: AttendanceQuery): UseQueryResult<AttendanceSummary, RepositoryError> {
  const repository = useTeacherRepository()
  const teacherId = useTeacherId()
  return useQuery({ queryKey: queryKeys.attendance(teacherId, input), queryFn: () => repository.listAttendance(input) })
}

export { queryKeys }
