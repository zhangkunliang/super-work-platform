import { RepositoryError, type RepositoryErrorCode } from "./teacherRepository"

export type RequestInput = {
  path: string
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: Record<string, unknown>
  signal?: AbortSignal
}

export type ApiClient = {
  request<T>(input: RequestInput): Promise<T>
  download(input: RequestInput): Promise<Blob>
}

type ApiClientOptions = {
  baseUrl?: string
  fetcher?: typeof fetch
}

type ErrorPayload = {
  code?: string
  message?: string
  fields?: Record<string, string>
}

function isErrorPayload(value: object): value is ErrorPayload {
  return "code" in value || "message" in value || "fields" in value
}

async function parseJson(response: Response): Promise<object | null> {
  const text = await response.text()
  if (!text) return null
  try {
    const value: unknown = JSON.parse(text)
    return typeof value === "object" && value !== null ? value : null
  } catch {
    return null
  }
}

function errorForStatus(status: number): RepositoryErrorCode {
  if (status === 401) return "UNAUTHENTICATED"
  if (status === 403) return "FORBIDDEN"
  if (status === 404) return "NOT_FOUND"
  if (status === 409) return "CONFLICT"
  if (status === 422) return "VALIDATION_ERROR"
  if (status >= 500) return "SERVER_ERROR"
  return "NETWORK_ERROR"
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? ""
  const fetcher = options.fetcher ?? fetch

  async function requestRaw(input: RequestInput, accept: string): Promise<Response> {
    const headers = new Headers({ Accept: accept })
    const hasBody = input.body !== undefined
    if (hasBody) headers.set("Content-Type", "application/json")
    try {
      return await fetcher(`${baseUrl}${input.path}`, {
        method: input.method,
        credentials: "include",
        headers,
        body: hasBody ? JSON.stringify(input.body) : undefined,
        signal: input.signal,
      })
    } catch {
      throw new RepositoryError("NETWORK_ERROR", "网络连接失败，请稍后重试")
    }
  }

  async function ensureSuccess(response: Response): Promise<void> {
    if (response.ok) return
    const payload = await parseJson(response)
    const details = payload && isErrorPayload(payload) ? payload : {}
    const code = details.code === "VALIDATION_ERROR" ? "VALIDATION_ERROR" : errorForStatus(response.status)
    const messages: Record<RepositoryErrorCode, string> = {
      UNAUTHENTICATED: "登录状态已失效，请重新登录",
      FORBIDDEN: "当前账号没有执行该操作的权限",
      NOT_FOUND: "请求的资源不存在",
      CONFLICT: "数据已发生变化，请刷新后重试",
      VALIDATION_ERROR: details.message ?? "请检查输入内容",
      SERVER_ERROR: "服务暂时不可用，请稍后重试",
      NETWORK_ERROR: "网络连接失败，请稍后重试",
    }
    throw new RepositoryError(code, details.message ?? messages[code], details.fields ?? {})
  }

  return {
    async request<T>(input: RequestInput): Promise<T> {
      const response = await requestRaw(input, "application/json")
      await ensureSuccess(response)
      if (response.status === 204) return undefined as T
      return await response.json() as T
    },
    async download(input: RequestInput): Promise<Blob> {
      const response = await requestRaw(input, "application/octet-stream")
      await ensureSuccess(response)
      return response.blob()
    },
  }
}
