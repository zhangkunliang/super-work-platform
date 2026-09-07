import { describe, expect, it } from "vitest"
import { createMockTeacherRepository } from "./mockTeacherRepository"
import { filterStudents, selectAttendanceRate, selectOpenTodoCount } from "@/domain/workbench/selectors"
import { validateScheduleInput, validateTodoInput } from "@/domain/workbench/validation"

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

describe("workbench selectors", () => {
  it("counts open todos and computes attendance from present and late students", () => {
    expect(selectOpenTodoCount([{ id: "1", title: "A", priority: "low", status: "todo" }])).toBe(1)
    expect(selectAttendanceRate({ classId: "class-1", date: "2026-09-04", total: 4, present: 2, late: 1, absent: 1, leave: 0, records: [] })).toBe(75)
  })

  it("filters students by name and attention-relevant attendance", () => {
    const students = [
      { id: "1", name: "林语桐", classId: "class-1", seatNumber: 1, attendanceRate: 91, assignmentCompletionRate: 90, gradeTrend: "steady" as const, recentNotes: [] },
      { id: "2", name: "周予安", classId: "class-1", seatNumber: 2, attendanceRate: 99, assignmentCompletionRate: 90, gradeTrend: "up" as const, recentNotes: [] },
    ]

    expect(filterStudents(students, { classId: "class-1", search: "林", attendance: "all", page: 1, pageSize: 20 })).toHaveLength(1)
    expect(filterStudents(students, { classId: "class-1", search: "", attendance: "attention", page: 1, pageSize: 20 })).toHaveLength(1)
  })
})

describe("workbench validation", () => {
  it("rejects blank todo titles", () => {
    expect(validateTodoInput({ title: "   ", priority: "medium" })).toEqual({ title: "请输入待办标题" })
  })

  it("rejects a schedule whose end is before its start", () => {
    expect(validateScheduleInput({ title: "数学课", classId: "class-1", startsAt: "2026-09-04T10:00:00+08:00", endsAt: "2026-09-04T09:00:00+08:00" })).toEqual({ endsAt: "结束时间必须晚于开始时间" })
  })
})
