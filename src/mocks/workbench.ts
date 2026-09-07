import type { WorkbenchSnapshot } from "@/types/education"

export function getWorkbenchSnapshot(): WorkbenchSnapshot {
  return {
    teacher: {
      id: "teacher-1",
      name: "林老师",
      schoolName: "星河实验学校",
    },
    classes: [
      { id: "class-1", name: "七年级 2 班", grade: "七年级", studentCount: 4 },
      { id: "class-2", name: "八年级 1 班", grade: "八年级", studentCount: 3 },
    ],
    selectedClassId: "class-1",
    students: [
      { id: "student-1", name: "陈同学", classId: "class-1", seatNumber: 1, attendanceRate: 91, assignmentCompletionRate: 90, gradeTrend: "steady", recentNotes: ["需要关注近期出勤情况"] },
      { id: "student-2", name: "林语桐", classId: "class-1", seatNumber: 2, attendanceRate: 98, assignmentCompletionRate: 100, gradeTrend: "up", recentNotes: [] },
      { id: "student-3", name: "周予安", classId: "class-1", seatNumber: 3, attendanceRate: 99, assignmentCompletionRate: 94, gradeTrend: "steady", recentNotes: [] },
      { id: "student-4", name: "沈知行", classId: "class-1", seatNumber: 4, attendanceRate: 96, assignmentCompletionRate: 88, gradeTrend: "down", recentNotes: ["作业完成度有波动"] },
      { id: "student-5", name: "许安然", classId: "class-2", seatNumber: 1, attendanceRate: 100, assignmentCompletionRate: 100, gradeTrend: "up", recentNotes: [] },
      { id: "student-6", name: "顾言", classId: "class-2", seatNumber: 2, attendanceRate: 97, assignmentCompletionRate: 92, gradeTrend: "steady", recentNotes: [] },
      { id: "student-7", name: "宋知夏", classId: "class-2", seatNumber: 3, attendanceRate: 94, assignmentCompletionRate: 90, gradeTrend: "down", recentNotes: [] },
    ],
    todos: [
      { id: "todo-1", title: "准备周五班会材料", priority: "high", status: "todo", dueAt: "2026-09-04T17:00:00+08:00" },
      { id: "todo-2", title: "整理本周家校沟通记录", priority: "medium", status: "in_progress", dueAt: "2026-09-05T17:00:00+08:00" },
      { id: "todo-3", title: "更新学生座位表", priority: "low", status: "todo", dueAt: "2026-09-05T12:00:00+08:00" },
      { id: "todo-4", title: "复盘语文测验错题", priority: "medium", status: "done", dueAt: "2026-09-03T20:00:00+08:00" },
    ],
    attentions: [
      { id: "attention-1", studentId: "student-1", studentName: "陈同学", title: "今日缺勤", description: "请确认缺勤原因并记录跟进情况。", resolved: false },
      { id: "attention-2", studentId: "student-4", studentName: "沈知行", title: "作业完成度下降", description: "建议查看最近一次作业提交情况。", resolved: false },
    ],
    schedule: [
      { id: "schedule-1", title: "语文", classId: "class-1", className: "七年级 2 班", startsAt: "2026-09-04T08:00:00+08:00", endsAt: "2026-09-04T08:45:00+08:00", location: "二号教学楼 301", status: "completed" },
      { id: "schedule-2", title: "班会", classId: "class-1", className: "七年级 2 班", startsAt: "2026-09-04T15:30:00+08:00", endsAt: "2026-09-04T16:15:00+08:00", location: "七年级 2 班", status: "upcoming" },
    ],
    assignments: [
      { id: "assignment-1", title: "古诗文阅读练习", subject: "语文", classId: "class-1", className: "七年级 2 班", description: "完成课后阅读练习。", dueAt: "2026-09-05T20:00:00+08:00", status: "published", submittedCount: 3, totalCount: 4, unsubmittedStudentIds: ["student-4"] },
    ],
    classMetrics: {
      "class-1": { attendanceRate: 96, assignmentCompletionRate: 93, attentionCount: 2 },
      "class-2": { attendanceRate: 97, assignmentCompletionRate: 94, attentionCount: 0 },
    },
  }
}
