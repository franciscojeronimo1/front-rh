const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken()
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Erro na requisição. Tente novamente.",
    }))
    throw new Error(error.message || "Erro na requisição")
  }

  return response
}


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

// ========== SISTEMA DE PONTO ==========

export interface TimeRecord {
  id: string
  type: "START" | "STOP"
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
}

export interface TimePeriod {
  start: string
  stop: string
  minutes: number
}

export interface TimeSummary {
  date: string
  periods: TimePeriod[]
  totalMinutes: number
  totalHours: string
  status: "started" | "stopped"
}

export interface StartTimeRecordResponse {
  id: string
  type: "START"
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  message: string
}

export interface StopTimeRecordResponse {
  id: string
  type: "STOP"
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  summary: TimeSummary
  message: string
}

export interface TimeRecordsResponse {
  records: TimeRecord[]
  summary: TimeSummary
}

// Iniciar trabalho
export async function startTimeRecord(): Promise<StartTimeRecordResponse> {
  const response = await authenticatedFetch("/time-records/start", {
    method: "POST",
  })
  return response.json()
}

// Parar trabalho
export async function stopTimeRecord(): Promise<StopTimeRecordResponse> {
  const response = await authenticatedFetch("/time-records/stop", {
    method: "POST",
  })
  return response.json()
}


export async function getTimeRecords(date?: string, userId?: string): Promise<TimeRecordsResponse> {
  const params = new URLSearchParams()

  if (date) {
    const formattedDate = date.includes("T") ? date.split("T")[0] : date
    const cleanDate = formattedDate.split("+")[0].split("Z")[0]
    params.append("date", cleanDate)
  }
  if (userId) params.append("userId", userId)
  const queryString = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedFetch(`/time-records${queryString}`)
  const data = await response.json()
  return data
}

export async function getTimeSummary(date?: string, userId?: string): Promise<{ summary: TimeSummary }> {
  const params = new URLSearchParams()
  if (date) {
    const formattedDate = date.includes("T") ? date.split("T")[0] : date
    const cleanDate = formattedDate.split("+")[0].split("Z")[0]
    params.append("date", cleanDate)
  }
  if (userId) params.append("userId", userId)
  const queryString = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedFetch(`/time-records/summary${queryString}`)
  const data = await response.json()
  return data
}

export interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "STAFF"
  createdById: string | null
  createdAt: string
  updatedAt: string
}

export interface UsersResponse {
  users: User[]
}

export async function getUsers(): Promise<UsersResponse> {
  const response = await authenticatedFetch("/users")
  return response.json()
}


export async function getUserById(id: string): Promise<{ user: User }> {
  const response = await authenticatedFetch(`/users/${id}`)
  return response.json()
}

