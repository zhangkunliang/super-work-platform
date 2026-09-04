import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { HelpSheet } from "./HelpSheet"

describe("HelpSheet", () => {
  it("shows grouped workbench help content", () => {
    const onOpenChange = vi.fn()
    render(<HelpSheet open onOpenChange={onOpenChange} />)

    expect(screen.getByRole("heading", { name: "使用帮助" })).toBeInTheDocument()
    expect(screen.getByText("班级总览")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "关闭帮助" }))
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false)
  })
})
