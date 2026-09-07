import { describe, expect, it } from "vitest"
import { createApiClient } from "./apiClient"

describe("ApiClient", () => {
  it("maps a 422 response to field errors", async () => {
    const client = createApiClient({
      fetcher: async () => new Response(JSON.stringify({ code: "VALIDATION_ERROR", fields: { title: "标题不能为空" } }), { status: 422 }),
    })

    await expect(client.request({ path: "/todos", method: "POST", body: {} })).rejects.toMatchObject({ code: "VALIDATION_ERROR", fields: { title: "标题不能为空" } })
  })

  it("throws an auth error for a 401 response", async () => {
    const client = createApiClient({ fetcher: async () => new Response(null, { status: 401 }) })

    await expect(client.request({ path: "/context", method: "GET" })).rejects.toMatchObject({ code: "UNAUTHENTICATED" })
  })

  it("sends JSON bodies with credentials and parses JSON responses", async () => {
    let request: { input: RequestInfo | URL; init?: RequestInit } | undefined
    const client = createApiClient({
      fetcher: async (input, init) => {
        request = { input, init }
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } })
      },
    })

    await expect(client.request<{ ok: boolean }>({ path: "/todos", method: "POST", body: { title: "备课" } })).resolves.toEqual({ ok: true })
    expect(request?.init?.credentials).toBe("include")
    expect(new Headers(request?.init?.headers).get("content-type")).toBe("application/json")
    expect(request?.init?.body).toBe(JSON.stringify({ title: "备课" }))
  })
})
