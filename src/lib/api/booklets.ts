import { authenticatedFetch, authenticatedFetchWithRetry } from "./http"
import type { Client } from "./clients"

export type BookletParcelStatus = "PENDING" | "PAID" | "CANCELLED"

export interface BookletParcel {
  id: string
  number: number
  dueDate: string
  amount: string
  status: BookletParcelStatus
  paidAt?: string | null
}

export interface BookletOrganization {
  id: string
  name: string
  cnpj?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface Booklet {
  id: string
  organizationId: string
  clientId: string
  description?: string | null
  notes?: string | null
  installmentCount: number
  installmentAmount: string
  totalAmount: string
  firstDueDate: string
  active: boolean
  createdAt: string
  updatedAt: string
  paidAmount?: string
  openAmount?: string
  paidCount?: number
  pendingCount?: number
  cancelledCount?: number
  nextDueDate?: string | null
  client?: Pick<Client, "id" | "name" | "cpf" | "phone"> & Partial<Client>
  organization?: BookletOrganization
  parcels: BookletParcel[]
}

export interface CreateBookletRequest {
  clientId: string
  description?: string
  notes?: string
  installmentCount: number
  installmentAmount: number
  firstDueDate: string
}

export interface BookletsResponse {
  booklets: Booklet[]
}

export interface BookletResponse {
  booklet: Booklet
}

export interface CreateBookletResponse {
  message: string
  booklet: Booklet
}

export async function getBooklets(clientId?: string): Promise<BookletsResponse> {
  const searchParams = new URLSearchParams()
  if (clientId) searchParams.append("clientId", clientId)
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetchWithRetry(`/booklets${queryString}`)
  return response.json()
}

export async function getBookletById(id: string): Promise<BookletResponse> {
  const response = await authenticatedFetch(`/booklets/${id}`)
  return response.json()
}

export async function createBooklet(data: CreateBookletRequest): Promise<CreateBookletResponse> {
  const response = await authenticatedFetch("/booklets", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteBooklet(id: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`/booklets/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

export async function updateBookletParcel(
  bookletId: string,
  parcelId: string,
  status: BookletParcelStatus
): Promise<{ message: string; parcel: BookletParcel }> {
  const response = await authenticatedFetch(`/booklets/${bookletId}/parcels/${parcelId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })
  return response.json()
}
