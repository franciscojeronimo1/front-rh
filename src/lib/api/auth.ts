import { API_BASE_URL } from "./http"

export interface LoginResponse {
  message: string
  user: {
    id: string
    name: string
    email: string
    role: "ADMIN" | "STAFF"
  }
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Erro ao fazer login. Tente novamente.",
    }))
    throw new Error(error.message || "Erro ao fazer login")
  }

  return response.json()
}

/** Chama GET /health para aquecer o banco (cold start). Rota pública. Não bloqueia o app em caso de falha. */
export async function checkHealth(): Promise<void> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)
  try {
    await fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
  } catch {
    // Ignora; as telas que precisam de dados usam retry
  } finally {
    clearTimeout(timeoutId)
  }
}
