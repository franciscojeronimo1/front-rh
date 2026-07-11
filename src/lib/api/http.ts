import { getAuthToken, redirectToLogin } from "@/lib/auth"

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"

/** Timeout para listagem de produtos e ponto (start/stop/summary). Backend espera até 60s. */
const API_TIMEOUT_MS = 30000
/** Espera entre tentativas de retry (cold start do banco). */
const RETRY_DELAY_MS = 1500
const MAX_RETRIES = 2

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getMessageByStatus(status: number, code?: string): string {
  if (status === 403 && code === "SUBSCRIPTION_REQUIRED") {
    return "Plano Premium necessário. Faça upgrade na tela de Administração."
  }
  switch (status) {
    case 401:
      return "Sessão expirada ou inválida. Faça login novamente."
    case 403:
      return "Você não tem permissão para acessar este recurso."
    case 404:
      return "Recurso não encontrado."
    case 429:
      return "Muitas requisições. Aguarde alguns minutos e tente novamente."
    case 500:
    case 502:
    case 503:
      return "Problema temporário no servidor. Tente novamente em alguns instantes."
    default:
      return "Erro na requisição. Tente novamente."
  }
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.statusCode === 0) return true
    if (err.statusCode >= 500) return true
    return false
  }
  if (err instanceof Error && err.name === "AbortError") return true
  if (err instanceof TypeError && err.message.includes("fetch")) return true
  return false
}

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<Response> {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`
  const isFormData = options.body instanceof FormData
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  let response: Response
  let controller: AbortController | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  if (timeoutMs != null && timeoutMs > 0) {
    controller = new AbortController()
    timeoutId = setTimeout(() => controller!.abort(), timeoutMs)
  }

  try {
    response = await fetch(url, {
      ...options,
      headers,
      ...(controller && { signal: controller.signal }),
    })
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId)
    if (err instanceof Error && err.name === "AbortError") throw err
    const message =
      err instanceof TypeError && err.message.includes("fetch")
        ? "Não foi possível conectar ao servidor. Verifique sua internet ou tente mais tarde."
        : "Erro na requisição. Tente novamente."
    throw new ApiError(message, 0)
  }

  if (timeoutId) clearTimeout(timeoutId)

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin(true)
      throw new ApiError("Sessão expirada. Redirecionando para login...", 401)
    }
    const error = await response.json().catch(() => ({}))
    const code = error?.code && typeof error.code === "string" ? error.code : undefined
    const statusMessage = getMessageByStatus(response.status, code)
    const message =
      error?.message && typeof error.message === "string" ? error.message : statusMessage
    throw new ApiError(message, response.status, code)
  }

  return response
}

/** Requisição autenticada com timeout e retry (rede/timeout/5xx). Para produtos e ponto. */
export async function authenticatedFetchWithRetry(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await authenticatedFetch(endpoint, options, timeoutMs)
    } catch (e) {
      lastErr = e
      if (attempt === MAX_RETRIES || !isRetryableError(e)) throw e
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
    }
  }
  throw lastErr
}
