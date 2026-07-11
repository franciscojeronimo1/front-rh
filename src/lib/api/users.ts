import { authenticatedFetch } from "./http"

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

export interface CreateStaffRequest {
  name: string
  email: string
  password: string
}

export interface CreateStaffResponse {
  message: string
  user: User
  token: string
}

export async function createStaff(data: CreateStaffRequest): Promise<CreateStaffResponse> {
  const response = await authenticatedFetch("/users/staff", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
}

export interface UpdateUserResponse {
  message: string
  user: User
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<UpdateUserResponse> {
  const response = await authenticatedFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`/users/${id}`, {
    method: "DELETE",
  })
  return response.json()
}
