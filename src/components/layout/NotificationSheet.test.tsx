import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { NotificationSheet } from "./NotificationSheet"

describe("NotificationSheet", () => {
  it("opens with unresolved items and resolves one", () => {
    const onResolve = vi.fn()
    render(<NotificationSheet open items={[{ id: "attention-1", title: "陈同学今日缺勤", description: "请确认情况", studentId: "student-1", studentName: "陈同学", resolved: false }]} onOpenChange={vi.fn()} onResolve={onResolve} />)

    expect(screen.getByRole("heading", { name: "通知" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "标记已处理 陈同学今日缺勤" }))
    expect(onResolve).toHaveBeenCalledWith("attention-1")
  })
})
