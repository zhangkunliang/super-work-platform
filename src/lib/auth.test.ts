import { describe, expect, it, vi } from "vitest"
import { resetPasswordWithCloud, signInWithCloud, signUpWithCloud, signOutCloud, updatePasswordWithCloud } from "./auth"

describe("cloud authentication", () => {
  it("signs in with the normalized email and returns the authenticated identity", async () => {
    const client = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "teacher@example.com" } },
          error: null,
        }),
      },
    }

    await expect(signInWithCloud(client as never, " Teacher@Example.com ", "secret123")).resolves.toEqual({
      userId: "user-1",
      account: "teacher@example.com",
    })
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "teacher@example.com",
      password: "secret123",
    })
  })

  it("registers with Supabase Auth and returns the new identity", async () => {
    const client = {
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: { id: "user-2", email: "new@example.com" } },
          error: null,
        }),
      },
    }

    client.auth.signUp.mockResolvedValueOnce({
      data: { session: { access_token: "token" }, user: { id: "user-2", email: "new@example.com" } },
      error: null,
    })

    await expect(signUpWithCloud(client as never, "new@example.com", "secret123", "https://super-work-platform.vercel.app/")).resolves.toEqual({
      userId: "user-2",
      account: "new@example.com",
    })
    expect(client.auth.signUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "secret123",
      options: { emailRedirectTo: "https://super-work-platform.vercel.app/" },
    })
  })

  it("forwards auth errors and signs out the current session", async () => {
    const error = new Error("invalid login")
    const client = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    }

    await expect(signInWithCloud(client as never, "teacher@example.com", "secret123")).rejects.toBe(error)
    await expect(signOutCloud(client as never)).resolves.toBeUndefined()
    expect(client.auth.signOut).toHaveBeenCalledOnce()
  })

  it("sends a password reset email with a normalized account and redirect", async () => {
    const client = {
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      },
    }

    await expect(resetPasswordWithCloud(client as never, " Teacher@Example.com ", "https://example.com/reset")).resolves.toBeUndefined()
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith("teacher@example.com", {
      redirectTo: "https://example.com/reset",
    })
  })

  it("updates the password for the current recovery session", async () => {
    const client = {
      auth: {
        updateUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "teacher@example.com" } },
          error: null,
        }),
      },
    }

    await expect(updatePasswordWithCloud(client as never, "newsecret")).resolves.toEqual({
      userId: "user-1",
      account: "teacher@example.com",
    })
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "newsecret" })
  })
})
