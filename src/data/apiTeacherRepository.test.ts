import { describe, expect, it } from "vitest"
import { createApiTeacherRepository, type ApiRouteMap } from "./apiTeacherRepository"
import type { ApiClient, RequestInput } from "./apiClient"

const routes: ApiRouteMap = {
  context: "/context",
  overview: "/overview",
  students: "/students",
  student: (id) => `/students/${id}`,
  todos: "/todos",
  todo: (id) => `/todos/${id}`,
  attendance: "/attendance",
  schedules: "/schedules",
  schedule: (id) => `/schedules/${id}`,
  assignments: "/assignments",
  assignmentReminder: (id) => `/assignments/${id}/remind`,
  communications: "/communications",
  communication: (id) => `/communications/${id}`,
  lessonPlans: "/lesson-plans",
  lessonPlan: (id) => `/lesson-plans/${id}`,
  lessonPlanCopy: (id) => `/lesson-plans/${id}/copy`,
  settings: "/settings",
}

describe("ApiTeacherRepository", () => {
  it("maps context and query parameters through the configured route", async () => {
    const calls: Array<{ path: string; method: string }> = []
    const client: ApiClient = {
      request: async <T>(input: RequestInput): Promise<T> => {
        calls.push({ path: input.path, method: input.method })
        return { teacher: { id: "teacher-1", name: "林老师" }, classes: [], selectedClassId: "class-1" } as T
      },
      download: async () => new Blob(),
    }
    const repository = createApiTeacherRepository({ client, routes })

    await expect(repository.getWorkbenchContext()).resolves.toMatchObject({ selectedClassId: "class-1" })
    await repository.listTodos({ classId: "class-1", status: "all" })

    expect(calls).toEqual([
      { path: "/context", method: "GET" },
      { path: "/todos?classId=class-1&status=all", method: "GET" },
    ])
  })
})
