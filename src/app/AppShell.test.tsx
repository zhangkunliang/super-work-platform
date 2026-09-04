import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppShell } from "./AppShell"

afterEach(cleanup)

const teacher = {
  id: "teacher-1",
  name: "林老师",
  schoolName: "星河实验学校",
}

describe("AppShell", () => {
  it("renders the teacher workspace inside an immersive glass frame", () => {
    render(<AppShell route="workbench" onNavigate={vi.fn()} teacher={teacher}>content</AppShell>)

    expect(screen.getByTestId("teacher-workbench-stage")).toBeInTheDocument()
    expect(screen.getByTestId("teacher-workbench-frame")).toHaveClass("backdrop-blur-2xl")
    expect(screen.getByTestId("teacher-workbench-background")).toHaveAttribute("autoplay", "")
    expect(screen.getByTestId("teacher-workbench-background")).toHaveAttribute("loop", "")
  })

  it("marks the workbench navigation item as active", () => {
    render(<AppShell route="workbench" onNavigate={vi.fn()} teacher={teacher}>content</AppShell>)

    expect(screen.getByRole("link", { name: "班级总览" })).toHaveAttribute("aria-current", "page")
  })

  it("navigates when a sidebar item is activated", () => {
    const onNavigate = vi.fn()
    render(<AppShell route="workbench" onNavigate={onNavigate} teacher={teacher}>content</AppShell>)

    fireEvent.click(screen.getByRole("link", { name: "学生档案" }))

    expect(onNavigate).toHaveBeenCalledWith("students")
  })
})
