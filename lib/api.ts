/**
 * FixItNow API client
 * Live base: https://fixitnow-backend-weld.vercel.app/api/v1
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://fixitnow-backend-weld.vercel.app/api/v1"

export type ApiErrorBody = {
  success: false
  error: { code: string; message: string }
}

export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  token?: string | null
  query?: Record<string, string | number | boolean | undefined | null>
  cache?: RequestCache
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const base = API_BASE_URL.replace(/\/$/, "")
  const clean = path.startsWith("/") ? path : `/${path}`
  const url = new URL(`${base}${clean}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiSuccess<T>> {
  const { method = "GET", body, token, query, cache } = options

  const headers: HeadersInit = {
    Accept: "application/json",
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (body !== undefined) {
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      // Let the browser set multipart boundary — do not set Content-Type
      payload = body
    } else {
      headers["Content-Type"] = "application/json"
      payload = JSON.stringify(body)
    }
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: payload,
    cache,
  })

  let json: ApiResponse<T> | null = null
  try {
    json = (await res.json()) as ApiResponse<T>
  } catch {
    throw new ApiError("Invalid JSON from API", "INVALID_JSON", res.status)
  }

  if (!res.ok || !json || json.success !== true) {
    const err = json && "error" in json ? json.error : null
    throw new ApiError(
      err?.message ?? `Request failed (${res.status})`,
      err?.code ?? "REQUEST_FAILED",
      res.status
    )
  }

  return json
}

/** Convenience helpers */
export const apiGet = <T>(
  path: string,
  query?: RequestOptions["query"],
  token?: string | null
) => api<T>(path, { method: "GET", query, token })

export const apiPost = <T>(
  path: string,
  body?: unknown,
  token?: string | null
) => api<T>(path, { method: "POST", body, token })

export const apiPatch = <T>(
  path: string,
  body?: unknown,
  token?: string | null
) => api<T>(path, { method: "PATCH", body, token })

export const apiPut = <T>(
  path: string,
  body?: unknown,
  token?: string | null
) => api<T>(path, { method: "PUT", body, token })

export const apiDelete = <T>(path: string, token?: string | null) =>
  api<T>(path, { method: "DELETE", token })
