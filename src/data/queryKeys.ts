import type { AssignmentQuery, AttendanceQuery, CommunicationQuery, LessonPlanQuery, OverviewQuery, ScheduleQuery, StudentQuery, TodoQuery } from "@/domain/workbench/models"

export const queryKeys = {
  context: (teacherId: string) => ["teacher-context", teacherId] as const,
  overview: (teacherId: string, query: OverviewQuery) => ["overview", teacherId, query] as const,
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
