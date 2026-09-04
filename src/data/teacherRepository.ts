import type {
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
  SchedulePage,
  ScheduleQuery,
  SaveAttendanceInput,
  StudentDetail,
  StudentPage,
  StudentQuery,
  TeacherSettings,
  TodoItem,
  TodoQuery,
  TodoPage,
  UpdateLessonPlanInput,
  UpdateScheduleInput,
  UpdateStudentInput,
  UpdateTeacherSettingsInput,
  UpdateTodoInput,
  WorkbenchContext,
  WorkbenchOverview,
  ReminderResult,
  AssignmentItem,
  ScheduleItem,
} from "@/domain/workbench/models"

export type RepositoryErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR" | "SERVER_ERROR" | "NETWORK_ERROR"

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode
  readonly fields: Record<string, string>

  constructor(code: RepositoryErrorCode, message: string, fields: Record<string, string> = {}) {
    super(message)
    this.name = "RepositoryError"
    this.code = code
    this.fields = fields
  }
}

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

export type {
  AssignmentItem,
  CommunicationRecord,
  LessonPlan,
  ScheduleItem,
  StudentDetail,
  TodoItem,
} from "@/domain/workbench/models"
