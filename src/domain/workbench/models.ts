import type {
  AssignmentItem,
  AttendanceStatus,
  ClassGroup,
  StudentAttention,
  StudentSummary,
  TodoItem,
  Teacher,
  ScheduleItem,
} from "@/types/education"

export type { AssignmentItem, AttendanceStatus, ClassGroup, StudentAttention, StudentSummary, TodoItem, Teacher, ScheduleItem }

export type WorkbenchContext = {
  teacher: Teacher
  classes: ClassGroup[]
  selectedClassId: string
}

export type AttendanceRecord = {
  studentId: string
  studentName: string
  status: AttendanceStatus
  reason: string | null
}

export type AttendanceRecordInput = Pick<AttendanceRecord, "studentId" | "status"> & {
  reason?: string | null
}

export type AttendanceSummary = {
  classId: string
  date: string
  total: number
  present: number
  late: number
  absent: number
  leave: number
  records: AttendanceRecord[]
}

export type WorkbenchOverview = {
  classId: string
  date: string
  classMetrics: {
    attendanceRate: number
    assignmentCompletionRate: number
    attentionCount: number
  }
  students: StudentSummary[]
  todos: TodoItem[]
  attentions: StudentAttention[]
  schedule: ScheduleItem[]
  assignments: AssignmentItem[]
  attendance: AttendanceSummary
}

export type StudentDetail = StudentSummary & {
  gender: "female" | "male" | "unknown"
  phone: string | null
  guardianName: string | null
  guardianPhone: string | null
  address: string | null
  tags: string[]
  notes: string[]
  attendance: AttendanceRecord[]
}

export type StudentQuery = {
  classId: string
  search: string
  attendance: "all" | "attention" | AttendanceStatus
  page: number
  pageSize: number
}

export type StudentPage = {
  items: StudentSummary[]
  total: number
  page: number
  pageSize: number
}

export type UpdateStudentInput = Partial<Pick<StudentSummary, "name" | "seatNumber" | "attendanceRate" | "assignmentCompletionRate" | "gradeTrend" | "recentNotes">> & {
  gender?: StudentDetail["gender"]
  phone?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  address?: string | null
  tags?: string[]
  notes?: string[]
}

export type TodoQuery = {
  classId: string
  status: "all" | TodoItem["status"]
}

export type TodoPage = {
  items: TodoItem[]
  total: number
}

export type CreateTodoInput = {
  title: string
  priority: TodoItem["priority"]
  dueAt?: string
}

export type UpdateTodoInput = Partial<Pick<TodoItem, "title" | "priority" | "dueAt" | "status">>

export type OverviewQuery = {
  classId: string
  date: string
}

export type AttendanceQuery = {
  classId: string
  date: string
}

export type SaveAttendanceInput = AttendanceQuery & {
  records: AttendanceRecordInput[]
}

export type ScheduleQuery = {
  classId: string
  from: string
  to: string
}

export type SchedulePage = {
  items: ScheduleItem[]
  total: number
}

export type CreateScheduleInput = {
  title: string
  classId?: string
  className?: string
  startsAt: string
  endsAt: string
  location?: string
}

export type UpdateScheduleInput = Partial<CreateScheduleInput>

export type AssignmentQuery = {
  classId: string
  search?: string
  status?: "all" | AssignmentItem["status"]
  page: number
  pageSize: number
}

export type AssignmentPage = {
  items: AssignmentItem[]
  total: number
  page: number
  pageSize: number
}

export type CreateAssignmentInput = {
  title: string
  subject: string
  classId: string
  className: string
  description?: string
  dueAt: string
  status?: AssignmentItem["status"]
}

export type ReminderResult = {
  assignmentId: string
  targetCount: number
  sentAt: string
}

export type CommunicationStatus = "unread" | "resolved"

export type CommunicationRecord = {
  id: string
  classId: string
  studentId: string
  studentName: string
  senderName: string
  content: string
  status: CommunicationStatus
  createdAt: string
}

export type CommunicationQuery = {
  classId: string
  status?: "all" | CommunicationStatus
}

export type CommunicationPage = {
  items: CommunicationRecord[]
  total: number
  unreadCount: number
}

export type CreateCommunicationInput = {
  classId: string
  studentId: string
  content: string
}

export type LessonPlanStep = {
  id: string
  title: string
  durationMinutes: number
  teacherActivity: string
  studentActivity: string
}

export type LessonPlan = {
  id: string
  classId: string
  subject: string
  title: string
  date: string
  period: string
  objective: string
  keyPoints: string
  materials: string
  reflection: string
  steps: LessonPlanStep[]
  updatedAt: string
}

export type LessonPlanQuery = {
  classId: string
  search?: string
}

export type LessonPlanPage = {
  items: LessonPlan[]
  total: number
}

export type UpdateLessonPlanInput = Partial<Omit<LessonPlan, "id" | "updatedAt" | "steps">> & {
  steps?: LessonPlanStep[]
}

export type TeacherSettings = {
  teacherName: string
  schoolName: string
  notificationEmail: boolean
  reduceMotion: boolean
  sidebarCollapsed: boolean
}

export type UpdateTeacherSettingsInput = Partial<TeacherSettings>
