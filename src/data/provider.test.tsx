import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { TeacherDataProvider, useOverviewQuery, useTeacherRepository, useWorkbenchContextQuery } from "./provider"

function Probe() {
  const repository = useTeacherRepository()
  const context = useWorkbenchContextQuery()
  const overview = useOverviewQuery({ classId: "class-1", date: "2026-09-04" })
  return <output>{repository ? `${context.data?.teacher.name ?? "loading"}:${overview.data?.todos.length ?? 0}` : "missing"}</output>
}

describe("TeacherDataProvider", () => {
  it("provides the default mock repository through TanStack Query", async () => {
    render(<TeacherDataProvider teacherId="teacher-1"><Probe /></TeacherDataProvider>)

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("林老师:4"))
  })

  it("rejects hooks rendered outside the provider", () => {
    expect(() => render(<Probe />)).toThrowError("TeacherDataProvider is missing")
  })
})
