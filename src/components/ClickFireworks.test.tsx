import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ClickFireworks } from "./ClickFireworks"

afterEach(cleanup)

function createCanvasContext() {
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    setTransform: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    lineCap: "butt",
    lineWidth: 1,
    strokeStyle: "",
    fillStyle: "",
    shadowBlur: 0,
    shadowColor: "",
  } as unknown as CanvasRenderingContext2D
}

describe("ClickFireworks", () => {
  it("shares one animation loop across rapid clicks", () => {
    const context = createCanvasContext()
    const originalGetContext = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: vi.fn(() => context) })
    let frame: FrameRequestCallback | undefined
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      frame = callback
      return 1
    })
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame)
    vi.stubGlobal("cancelAnimationFrame", vi.fn())

    render(<ClickFireworks />)
    window.dispatchEvent(new MouseEvent("pointerdown", { button: 0, clientX: 120, clientY: 180 }))
    window.dispatchEvent(new MouseEvent("pointerdown", { button: 0, clientX: 200, clientY: 260 }))
    window.dispatchEvent(new MouseEvent("pointerdown", { button: 0, clientX: 280, clientY: 340 }))

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1)
    frame?.(0)
    expect(context.clearRect).toHaveBeenCalled()

    Object.defineProperty(document, "hidden", { configurable: true, value: true })
    document.dispatchEvent(new Event("visibilitychange"))
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: originalGetContext })
  })
})
