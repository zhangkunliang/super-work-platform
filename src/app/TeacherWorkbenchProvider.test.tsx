import { describe, expect, it } from "vitest"
import { navigationItems } from "./routes"
import { initialWorkbenchUiState, workbenchUiReducer } from "./TeacherWorkbenchProvider"

describe("teacher workbench navigation state", () => {
  it("uses the reference page labels and excludes class management", () => {
    expect(navigationItems.map((item) => item.visibleLabel)).toEqual([
      "班级总览", "今日任务", "学生档案", "课程与值日", "备课中心", "家校沟通", "数据周报", "系统设置",
    ])
    expect(navigationItems.some((item) => item.route === "classes")).toBe(false)
  })

  it("keeps search and route changes in UI state only", () => {
    const state = workbenchUiReducer({ ...initialWorkbenchUiState, route: "workbench" }, { type: "set-search", query: "林语桐" })
    expect(state.searchQuery).toBe("林语桐")
    expect(state.route).toBe("workbench")
    expect(workbenchUiReducer(state, { type: "navigate", route: "students" }).route).toBe("students")
  })
})
