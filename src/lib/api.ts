const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"

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

