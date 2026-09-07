import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("./lib/supabase", () => ({
  getSupabaseClient: () => null,
}))

import App from "./App"
import { readSessionAccount } from "./lib/session"

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"

describe("Velorah hero", () => {
  it("restores the local session after a browser reload", () => {
    localStorage.setItem("velorah-session-v1", "teacher@example.com")
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([{ type: "reload" }] as PerformanceNavigationTiming[])

    expect(readSessionAccount()).toBe("teacher@example.com")
    expect(localStorage.getItem("velorah-session-v1")).toBe("teacher@example.com")
  })

  it("presents the hero message and primary action", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", {
        name: "Where dreams rise through the silence.",
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/We're designing tools for deep thinkers/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Begin Journey" })).toBeInTheDocument()
    expect(screen.queryByRole("navigation", { name: "Primary navigation" })).not.toBeInTheDocument()
  })

  it("uses the supplied video as an ambient looping background", () => {
    const { container } = render(<App />)
    const video = container.querySelector("video")
    const source = container.querySelector("video source")

    expect(video).not.toBeNull()
    expect(video).toHaveProperty("autoplay", true)
    expect(video).toHaveProperty("loop", true)
    expect(video).toHaveProperty("muted", true)
    expect(video).toHaveProperty("playsInline", true)
    expect(source).toHaveAttribute("src", videoUrl)
    expect(source).toHaveAttribute("type", "video/mp4")
  })

  it("opens the account dialog before entering the workbench", () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole("button", { name: "Begin Journey" })[0])

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.queryByTitle("教师工作台")).not.toBeInTheDocument()
  })

  it("opens the clean minimal account surface over the current hero", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))

    expect(screen.getByRole("heading", { name: "Sign in with email" })).toBeInTheDocument()
    expect(screen.getByText("登录后继续使用你的教师工作台。")).toBeInTheDocument()
    expect(screen.getByTestId("auth-background")).toHaveAttribute("data-theme", "clean-light")
    expect(screen.getByTestId("auth-background")).toHaveClass("bg-black/30", "backdrop-blur-sm")
    expect(screen.getByTestId("auth-background")).not.toHaveClass("bg-white")
    expect(screen.getByTestId("seamless-video")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Google|Facebook|Apple/i })).not.toBeInTheDocument()
  })

  it("keeps the clean minimal surface when switching to registration", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))

    expect(screen.getByTestId("auth-tab-indicator")).toHaveAttribute("data-active-mode", "signin")
    fireEvent.click(screen.getByRole("tab", { name: "注册" }))

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument()
    expect(screen.getByLabelText("再次输入密码")).toBeInTheDocument()
    expect(screen.getByTestId("auth-background")).toHaveAttribute("data-theme", "clean-light")
    expect(screen.getByTestId("auth-tab-indicator")).toHaveAttribute("data-active-mode", "signup")
  })

  it("prefills only the remembered account when the account dialog opens", () => {
    localStorage.setItem("velorah-auth-draft-v1", JSON.stringify({ account: "teacher@example.com", password: "secret123" }))
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))

    expect(screen.getByLabelText("用户名或邮箱")).toHaveValue("teacher@example.com")
    expect(screen.getByLabelText("密码")).toHaveValue("")
    expect(JSON.parse(localStorage.getItem("velorah-auth-draft-v1") || "null")).toEqual({ account: "teacher@example.com" })
  })

  it("does not persist the password after local sign in", async () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))
    fireEvent.click(screen.getByRole("tab", { name: "注册" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.change(screen.getByLabelText("再次输入密码"), { target: { value: "secret123" } })

    expect(localStorage.getItem("velorah-auth-draft-v1")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "注册并进入工作台" }))
    await waitFor(() => expect(screen.getByTitle("教师工作台")).toBeInTheDocument())

    expect(JSON.parse(localStorage.getItem("velorah-auth-draft-v1") || "null")).toEqual({ account: "teacher@example.com" })
  })

  it("does not store a reversible password when Web Crypto is unavailable", async () => {
    vi.stubGlobal("crypto", {})
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))
    fireEvent.click(screen.getByRole("tab", { name: "注册" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.change(screen.getByLabelText("再次输入密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "注册并进入工作台" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("当前浏览器不支持安全的本地登录")
    expect(localStorage.getItem("velorah-users-v1")).toBeNull()
  })

  it("requires matching passwords when registering", async () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))
    fireEvent.click(screen.getByRole("tab", { name: "注册" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.change(screen.getByLabelText("再次输入密码"), { target: { value: "secret321" } })
    fireEvent.click(screen.getByRole("button", { name: "注册并进入工作台" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("两次输入的密码不一致")
  })

  it("registers and enters the account workbench", async () => {
    render(<App />)
    fireEvent.click(screen.getByRole("button", { name: "Begin Journey" }))
    fireEvent.click(screen.getByRole("tab", { name: "注册" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.change(screen.getByLabelText("再次输入密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "注册并进入工作台" }))
    await waitFor(() => expect(screen.getByTitle("教师工作台")).toHaveAttribute("src", "/教师工作台.html?account=teacher%40example.com"))
    expect(screen.getByTestId("workbench-loading")).toBeInTheDocument()

    fireEvent.load(screen.getByTitle("教师工作台"))
    await waitFor(() => expect(screen.queryByTestId("workbench-loading")).not.toBeInTheDocument())
  })
})
