import type { LucideIcon } from "lucide-react"

export type AppRoute =
  | "landing"
  | "workbench"
  | "schedule"
  | "students"
  | "classes"
  | "assignments"
  | "grades"
  | "communication"
  | "materials"
  | "settings"

export type NavigationItem = {
  route: Exclude<AppRoute, "landing">
  label: string
  visibleLabel?: string
  description: string
  icon: LucideIcon
  phase: "P0" | "P1" | "P2"
}

export type Teacher = {
  id: string
  name: string
  schoolName?: string | null
}

export type ClassGroup = {
  id: string
  name: string
  grade?: string
  studentCount: number
}

export type AttendanceStatus = "present" | "late" | "absent" | "leave"

export type StudentSummary = {
  id: string
  name: string
  classId: string
  seatNumber: number
  attendanceRate: number
  assignmentCompletionRate: number
  gradeTrend: "up" | "down" | "steady"
  recentNotes: string[]
}

export type StudentAttention = {
  id: string
  studentId: string
  studentName: string
  title: string
  description: string
  resolved: boolean
}

export type TodoItem = {
  id: string
  title: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in_progress" | "done"
  dueAt?: string
}

export type ScheduleItem = {
  id: string
  title: string
  classId?: string
  className?: string
  startsAt: string
  endsAt: string
  location?: string
  status: "upcoming" | "ongoing" | "completed"
}

export type AssignmentItem = {
  id: string
  title: string
  subject: string
  classId: string
  className: string
  description?: string
  dueAt: string
  status: "draft" | "published" | "closed"
  submittedCount: number
  totalCount: number
  unsubmittedStudentIds: string[]
}

export type WorkbenchSnapshot = {
  teacher: Teacher
  classes: ClassGroup[]
  selectedClassId: string
  students: StudentSummary[]
  todos: TodoItem[]
  attentions: StudentAttention[]
  schedule: ScheduleItem[]
  assignments: AssignmentItem[]
  classMetrics: Record<string, {
    attendanceRate: number
    assignmentCompletionRate: number
    attentionCount: number
  }>
}
