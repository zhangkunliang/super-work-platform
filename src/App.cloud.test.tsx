import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const { client } = vi.hoisted(() => ({
  client: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn((callback: (event: string, session: { user: { id: string; email: string } } | null) => void) => {
        void callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "teacher@example.com" } },
        error: null,
      }),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "teacher@example.com" } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock("./lib/supabase", () => ({
  getSupabaseClient: () => client,
}))

vi.mock("@/lib/cloudSync", () => ({
  migrateLocalModules: vi.fn().mockResolvedValue({ migrated: [], remoteWins: [] }),
  saveCloudModule: vi.fn().mockResolvedValue(undefined),
  snapshotLocalModules: vi.fn(() => ({ teaching: {}, homeroom: {}, workspace: {} })),
}))

import App from "./App"

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe("cloud auth app flow", () => {
  it("signs in through Supabase without saving a local password draft", async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Begin Journey" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "登录并进入工作台" }))

    await waitFor(() => expect(screen.getByTitle("教师工作台")).toBeInTheDocument())
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "teacher@example.com",
      password: "secret123",
    })
    expect(localStorage.getItem("velorah-auth-draft-v1")).toBeNull()
  })

  it("returns to the landing page when the workbench requests sign out", async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Begin Journey" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "登录并进入工作台" }))
    await waitFor(() => expect(screen.getByTitle("教师工作台")).toBeInTheDocument())

    window.dispatchEvent(new MessageEvent("message", {
      origin: window.location.origin,
      data: { type: "zhixing:sign-out" },
    }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Begin Journey" })).toBeInTheDocument())
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  it("clears the local view even when cloud sign out fails", async () => {
    client.auth.signOut.mockRejectedValueOnce(new Error("network error"))
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Begin Journey" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "teacher@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "登录并进入工作台" }))
    await waitFor(() => expect(screen.getByTitle("教师工作台")).toBeInTheDocument())

    window.dispatchEvent(new MessageEvent("message", {
      origin: window.location.origin,
      data: { type: "zhixing:sign-out" },
    }))

    await waitFor(() => expect(screen.getByRole("button", { name: "Begin Journey" })).toBeInTheDocument())
  })

  it("sends a password reset email from the cloud account dialog", async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Begin Journey" }))
    fireEvent.click(screen.getByRole("button", { name: "忘记密码？" }))
    fireEvent.change(screen.getByLabelText("注册邮箱"), { target: { value: " Teacher@Example.com " } })
    fireEvent.click(screen.getByRole("button", { name: "发送重置邮件" }))

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("重置密码邮件已发送"))
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith("teacher@example.com", {
      redirectTo: `${window.location.origin}/`,
    })
  })

  it("presents email confirmation as a success notice after sign up", async () => {
    client.auth.signUp.mockResolvedValueOnce({
      data: { session: null, user: { id: "user-2", email: "new@example.com" } },
      error: null,
    })
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Begin Journey" }))
    fireEvent.click(screen.getByRole("tab", { name: "注册" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "new@example.com" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.change(screen.getByLabelText("再次输入密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "注册并进入工作台" }))

    expect(await screen.findByRole("status")).toHaveTextContent("注册成功，请完成邮箱验证后登录")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("rejects an invalid cloud email before calling Supabase", async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole("button", { name: "Begin Journey" }))
    fireEvent.change(screen.getByLabelText("用户名或邮箱"), { target: { value: "not-an-email" } })
    fireEvent.change(screen.getByLabelText("密码"), { target: { value: "secret123" } })
    fireEvent.click(screen.getByRole("button", { name: "登录并进入工作台" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("请输入有效的邮箱地址")
    expect(client.auth.signInWithPassword).not.toHaveBeenCalled()
  })

  it("lets a recovery session set a new password", async () => {
    let authCallback: ((event: string, session: { user: { id: string; email: string } } | null) => void) | undefined
    client.auth.onAuthStateChange.mockImplementationOnce((callback) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    render(<App />)
    await act(async () => {
      authCallback?.("PASSWORD_RECOVERY", { user: { id: "user-1", email: "teacher@example.com" } })
    })

    expect(await screen.findByRole("heading", { name: "Set a new password" })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("新密码"), { target: { value: "newsecret" } })
    fireEvent.change(screen.getByLabelText("确认新密码"), { target: { value: "newsecret" } })
    fireEvent.click(screen.getByRole("button", { name: "更新密码并进入工作台" }))

    await waitFor(() => expect(screen.getByTitle("教师工作台")).toBeInTheDocument())
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "newsecret" })
  })

  it("shows the landing page when cloud session recovery times out", async () => {
    vi.useFakeTimers()
    client.auth.getSession.mockReturnValueOnce(new Promise(() => {}))

    render(<App />)
    expect(screen.getByLabelText("正在恢复登录状态")).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.getByRole("button", { name: "Begin Journey" })).toBeInTheDocument()
  })

  it("restores local mode without attempting cloud sync when cloud recovery fails", async () => {
    localStorage.setItem("velorah-session-v1", "local@example.com")
    client.auth.getSession.mockRejectedValueOnce(new Error("offline"))

    render(<App />)

    const workbench = await screen.findByTitle("教师工作台")
    expect(workbench).toHaveAttribute("data-user-id", "local:local@example.com")
    expect(screen.getByRole("main", { name: "Signed-in workspace" })).toHaveAttribute("data-sync-status", "ready")
  })
})
