import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { GlobalSearch } from "./GlobalSearch"

afterEach(cleanup)

describe("GlobalSearch", () => {
  it("shows matching results and selects a result", () => {
    const onChange = vi.fn()
    const onSelect = vi.fn()
    render(<GlobalSearch value="陈" results={[{ id: "student-1", type: "student", title: "陈同学", description: "学生档案" }]} onChange={onChange} onSelect={onSelect} />)

    fireEvent.change(screen.getByRole("textbox", { name: "全局搜索" }), { target: { value: "陈同" } })
    fireEvent.click(screen.getByRole("option", { name: /陈同学/ }))

    expect(onChange).toHaveBeenCalledWith("陈同")
    expect(onSelect).toHaveBeenCalledWith({ id: "student-1", type: "student", title: "陈同学", description: "学生档案" })
  })

  it("selects the first result with ArrowDown and Enter", () => {
    const onSelect = vi.fn()
    render(<GlobalSearch value="陈" results={[{ id: "student-1", type: "student", title: "陈同学", description: "学生档案" }]} onChange={vi.fn()} onSelect={onSelect} />)

    fireEvent.keyDown(screen.getByRole("textbox", { name: "全局搜索" }), { key: "ArrowDown" })
    fireEvent.keyDown(screen.getByRole("textbox", { name: "全局搜索" }), { key: "Enter" })

    expect(onSelect).toHaveBeenCalledWith({ id: "student-1", type: "student", title: "陈同学", description: "学生档案" })
  })
})
