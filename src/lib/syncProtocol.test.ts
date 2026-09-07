import { describe, expect, it, vi } from "vitest"
import { createDebouncedModuleSync, isModuleChangeMessage } from "./syncProtocol"

describe("workbench sync protocol", () => {
  it("accepts only same-origin changes for private modules", () => {
    expect(isModuleChangeMessage({ origin: "https://app.test", data: { type: "zhixing:module-change", module: "teaching", keys: ["zhixing.schedule.v1"] } }, "https://app.test")).toBe(true)
    expect(isModuleChangeMessage({ origin: "https://evil.test", data: { type: "zhixing:module-change", module: "teaching", keys: [] } }, "https://app.test")).toBe(false)
    expect(isModuleChangeMessage({ origin: "https://app.test", data: { type: "zhixing:module-change", module: "public", keys: [] } }, "https://app.test")).toBe(false)
  })

  it("coalesces rapid changes per module", () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const queue = createDebouncedModuleSync(onChange, 500)

    queue.schedule({ type: "zhixing:module-change", module: "teaching", keys: ["zhixing.schedule.v1"] })
    queue.schedule({ type: "zhixing:module-change", module: "teaching", keys: ["zhixing.students.v1"] })
    queue.schedule({ type: "zhixing:module-change", module: "homeroom", keys: ["zhixing.notices.v1"] })

    vi.advanceTimersByTime(499)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenCalledWith({
      type: "zhixing:module-change",
      module: "teaching",
      keys: ["zhixing.schedule.v1", "zhixing.students.v1"],
    })
    queue.dispose()
    vi.useRealTimers()
  })
})
