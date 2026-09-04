import type { AttendanceSummary, StudentQuery } from "./models"
import type { StudentSummary, TodoItem } from "@/types/education"

export function selectOpenTodoCount(items: TodoItem[]): number {
  return items.filter((item) => item.status !== "done").length
}

export function selectUnresolvedAttentionCount(items: { resolved: boolean }[]): number {
  return items.filter((item) => !item.resolved).length
}

export function selectAttendanceRate(summary: AttendanceSummary): number {
  if (summary.total === 0) return 0
  return Math.round(((summary.present + summary.late) / summary.total) * 100)
}

export function filterStudents(items: StudentSummary[], query: StudentQuery): StudentSummary[] {
  const search = query.search.trim().toLocaleLowerCase()
  return items.filter((student) => {
    const matchesClass = student.classId === query.classId
    const matchesSearch = !search || student.name.toLocaleLowerCase().includes(search) || String(student.seatNumber).includes(search)
    const matchesAttendance = query.attendance === "all" || query.attendance === "attention" && student.attendanceRate < 95
    return matchesClass && matchesSearch && matchesAttendance
  })
}
