import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("Supabase configuration", () => {
  it("reports local mode when public Supabase variables are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "")
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "")

    const { isSupabaseConfigured, PRIVATE_CLOUD_MODULES } = await import("./supabase")

    expect(isSupabaseConfigured()).toBe(false)
    expect(PRIVATE_CLOUD_MODULES).toEqual(["teaching", "homeroom", "workspace"])
  })

  it("reports cloud mode only when both public variables are present", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://demo.supabase.co")
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-anon-key")

    const { getSupabaseConfig, isSupabaseConfigured } = await import("./supabase")

    expect(isSupabaseConfigured()).toBe(true)
    expect(getSupabaseConfig()).toEqual({
      url: "https://demo.supabase.co",
      anonKey: "public-anon-key",
    })
  })
})
