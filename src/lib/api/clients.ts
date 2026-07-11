import { authenticatedFetch, authenticatedFetchWithRetry } from "./http"
import type { PaginationInfo } from "./types"

export interface Client {
  id: string
  organizationId: string
  name: string
  cpf: string
  phone: string
  email?: string | null
  street?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  addressReference?: string | null
  notes?: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateClientRequest {
  name: string
  cpf: string
  phone: string
  email?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  addressReference?: string
  notes?: string
  active?: boolean
}

export interface UpdateClientRequest {
  name?: string
  cpf?: string
  phone?: string
  email?: string | null
  street?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  addressReference?: string | null
  notes?: string | null
  active?: boolean
}

export interface ClientsResponse {
  clients: Client[]
  pagination: PaginationInfo
}

export interface ClientResponse {
  client: Client
}

export interface CreateClientResponse {
  message: string
  client: Client
}

export interface UpdateClientResponse {
  message: string
  client: Client
}

export interface DeleteClientResponse {
  message: string
}

export interface GetClientsParams {
  includeInactive?: boolean
  search?: string
  page?: number
  limit?: number
}

export async function getClients(params?: GetClientsParams): Promise<ClientsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.includeInactive === true) searchParams.append("includeInactive", "true")
  if (params?.search) searchParams.append("search", params.search)
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetchWithRetry(`/clients${queryString}`)
  return response.json()
}

export async function getClientById(id: string): Promise<ClientResponse> {
  const response = await authenticatedFetch(`/clients/${id}`)
  return response.json()
}

export async function createClient(data: CreateClientRequest): Promise<CreateClientResponse> {
  const response = await authenticatedFetch("/clients", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function updateClient(
  id: string,
  data: UpdateClientRequest
): Promise<UpdateClientResponse> {
  const response = await authenticatedFetch(`/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteClient(id: string): Promise<DeleteClientResponse> {
  const response = await authenticatedFetch(`/clients/${id}`, {
    method: "DELETE",
  })
  return response.json()
}
