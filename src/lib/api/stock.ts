import { authenticatedFetch, authenticatedFetchWithRetry } from "./http"
import type { PaginationInfo } from "./types"

export interface StockEntry {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  totalPrice: string
  supplierName?: string | null
  supplierDoc?: string | null
  invoiceNumber?: string | null
  notes?: string | null
  product: {
    id: string
    name: string
    currentStock: number
  }
  user: {
    id: string
    name: string
  }
  createdAt: string
}

export interface CreateStockEntryRequest {
  productId: string
  quantity: number
  unitPrice: number
  supplierName?: string
  supplierDoc?: string
  invoiceNumber?: string
  notes?: string
}

export interface CreateStockEntryResponse {
  message: string
  entry: StockEntry
}

export interface StockEntriesResponse {
  entries: StockEntry[]
}

export async function createStockEntry(
  data: CreateStockEntryRequest
): Promise<CreateStockEntryResponse> {
  const response = await authenticatedFetch("/stock/entries", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export interface StockEntryBatchItem {
  productId: string
  quantity: number
  unitPrice: number
}

export interface CreateStockEntryBatchRequest {
  supplierName?: string
  supplierDoc?: string
  invoiceNumber?: string
  notes?: string
  items: StockEntryBatchItem[]
}

export interface CreateStockEntryBatchResponse {
  message: string
  entries: StockEntry[]
}

export async function createStockEntryBatch(
  data: CreateStockEntryBatchRequest
): Promise<CreateStockEntryBatchResponse> {
  const response = await authenticatedFetch("/stock/entries/batch", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function getStockEntries(
  productId?: string,
  startDate?: string,
  endDate?: string
): Promise<StockEntriesResponse> {
  const params = new URLSearchParams()
  if (productId) params.append("productId", productId)
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)
  const queryString = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedFetch(`/stock/entries${queryString}`)
  return response.json()
}

export interface UpdateStockEntryRequest {
  productId?: string
  quantity?: number
  unitPrice?: number
  supplierName?: string
  supplierDoc?: string
  invoiceNumber?: string
  notes?: string
}

export async function getStockEntryById(id: string): Promise<{ entry: StockEntry }> {
  const response = await authenticatedFetch(`/stock/entries/${id}`)
  return response.json()
}

export async function updateStockEntry(
  id: string,
  data: UpdateStockEntryRequest
): Promise<CreateStockEntryResponse> {
  const response = await authenticatedFetch(`/stock/entries/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteStockEntry(id: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`/stock/entries/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

export interface StockExit {
  id: string
  productId: string
  quantity: number
  unitPrice?: string | null
  totalPrice?: string | null
  projectName?: string | null
  clientName?: string | null
  serviceType?: string | null
  notes?: string | null
  product: {
    id: string
    name: string
    currentStock: number
  }
  user: {
    id: string
    name: string
  }
  createdAt: string
}

export interface CreateStockExitRequest {
  productId: string
  quantity: number
  unitPrice?: number
  projectName?: string
  clientName?: string
  serviceType?: string
  notes?: string
}

export interface CreateStockExitResponse {
  message: string
  exit: StockExit
}

export interface StockExitsResponse {
  exits: StockExit[]
}

export async function createStockExit(data: CreateStockExitRequest): Promise<CreateStockExitResponse> {
  const response = await authenticatedFetch("/stock/exits", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export interface StockExitBatchItem {
  productId: string
  quantity: number
  unitPrice?: number
}

export interface CreateStockExitBatchRequest {
  projectName?: string
  clientName?: string
  serviceType?: string
  notes?: string
  items: StockExitBatchItem[]
}

export interface CreateStockExitBatchResponse {
  message: string
  exits: StockExit[]
}

export async function createStockExitBatch(
  data: CreateStockExitBatchRequest
): Promise<CreateStockExitBatchResponse> {
  const response = await authenticatedFetch("/stock/exits/batch", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function getStockExits(
  productId?: string,
  startDate?: string,
  endDate?: string
): Promise<StockExitsResponse> {
  const params = new URLSearchParams()
  if (productId) params.append("productId", productId)
  if (startDate) params.append("startDate", startDate)
  if (endDate) params.append("endDate", endDate)
  const queryString = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedFetch(`/stock/exits${queryString}`)
  return response.json()
}

export interface UpdateStockExitRequest {
  productId?: string
  quantity?: number
  unitPrice?: number
  projectName?: string
  clientName?: string
  serviceType?: string
  notes?: string
}

export async function getStockExitById(id: string): Promise<{ exit: StockExit }> {
  const response = await authenticatedFetch(`/stock/exits/${id}`)
  return response.json()
}

export async function updateStockExit(
  id: string,
  data: UpdateStockExitRequest
): Promise<CreateStockExitResponse> {
  const response = await authenticatedFetch(`/stock/exits/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteStockExit(id: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`/stock/exits/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

export interface CurrentStockProduct {
  id: string
  name: string
  code?: string | null
  category?: string | null
  currentStock: number
  minStock: number
  unit: string
  averageCost?: string | null
  totalValue?: string | number | null
}

export interface CurrentStockResponse {
  products: CurrentStockProduct[]
  pagination: PaginationInfo
}

export interface LowStockProduct extends CurrentStockProduct {
  deficit: number
}

export interface LowStockResponse {
  products: LowStockProduct[]
  pagination: PaginationInfo
}

export interface GetLowStockParams {
  page?: number
  limit?: number
}

export interface ExpiringProduct {
  id: string
  name: string
  code?: string | null
  sku?: string | null
  category?: string | null
  currentStock: number
  minStock: number
  unit: string
  expirationDate: string
  daysUntilExpiration: number
  isExpired: boolean
}

export interface ExpiringStockResponse {
  products: ExpiringProduct[]
  pagination: PaginationInfo
}

export interface GetExpiringStockParams {
  days?: number
  includeExpired?: boolean
  onlyWithStock?: boolean
  page?: number
  limit?: number
}

export interface DailyUsageExit {
  id: string
  quantity: number
  unitPrice?: string | null
  totalPrice?: string | null
  projectName?: string | null
  clientName?: string | null
  serviceType?: string | null
  notes?: string | null
  createdAt: string
  product?: {
    id: string
    name: string
    unit: string
  }
}

export interface DailyUsageProduct {
  product: {
    id: string
    name: string
    unit: string
    costPrice?: number | null
    averageCost?: number | null
  }
  totalQuantity: number
  exits: DailyUsageExit[]
}

export interface DailyUsageResponse {
  date: string
  products: DailyUsageProduct[]
  totalExits: number
}

export interface WeeklyUsageProduct {
  product: {
    id: string
    name: string
    unit: string
    costPrice?: number | null
    averageCost?: number | null
  }
  totalQuantity: number
  exits: DailyUsageExit[]
}

export interface WeeklyUsageResponse {
  startDate: string
  endDate: string
  products: WeeklyUsageProduct[]
  totalExits?: number
}

export interface TotalValueResponse {
  totalValue: string
  totalProducts: number
  productsWithStock: number
}

export interface GetCurrentStockParams {
  category?: string
  page?: number
  limit?: number
}

export async function getCurrentStock(
  params?: GetCurrentStockParams
): Promise<CurrentStockResponse> {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.append("category", params.category)
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetch(`/stock/current${queryString}`)
  return response.json()
}

export async function getLowStock(params?: GetLowStockParams): Promise<LowStockResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetch(`/stock/low-stock${queryString}`)
  return response.json()
}

export async function getExpiringStock(
  params?: GetExpiringStockParams
): Promise<ExpiringStockResponse> {
  const searchParams = new URLSearchParams()
  if (params?.days !== undefined) searchParams.append("days", params.days.toString())
  if (params?.includeExpired === false) searchParams.append("includeExpired", "false")
  if (params?.onlyWithStock === true) searchParams.append("onlyWithStock", "true")
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetch(`/stock/expiring${queryString}`)
  return response.json()
}

export async function getDailyUsage(date?: string): Promise<DailyUsageResponse> {
  const params = new URLSearchParams()
  if (date) {
    const formattedDate = date.includes("T") ? date.split("T")[0] : date
    params.append("date", formattedDate)
  }
  const queryString = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedFetch(`/stock/daily-usage${queryString}`)
  return response.json()
}

export async function getWeeklyUsage(startDate?: string): Promise<WeeklyUsageResponse> {
  const params = new URLSearchParams()
  if (startDate) {
    const formattedDate = startDate.includes("T") ? startDate.split("T")[0] : startDate
    params.append("startDate", formattedDate)
  }
  const queryString = params.toString() ? `?${params.toString()}` : ""
  const response = await authenticatedFetch(`/stock/weekly-usage${queryString}`)
  return response.json()
}

export async function getTotalValue(): Promise<TotalValueResponse> {
  const response = await authenticatedFetch("/stock/total-value")
  return response.json()
}

export interface StockMovement {
  id: string
  type: "entry" | "exit"
  product: {
    id: string
    name: string
    code?: string | null
  }
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  registeredBy: {
    id: string
    name: string
  }
  notes?: string | null
  supplierName?: string | null
  invoiceNumber?: string | null
  clientName?: string | null
  projectName?: string | null
}

export interface GetStockMovementsParams {
  dateFrom?: string
  dateTo?: string
  productId?: string
  supplier?: string
  client?: string
  type?: "entry" | "exit"
  page?: number
  limit?: number
}

export interface StockMovementsResponse {
  movements: StockMovement[]
  pagination: PaginationInfo
}

export async function getStockMovements(
  params?: GetStockMovementsParams
): Promise<StockMovementsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.dateFrom) searchParams.append("dateFrom", params.dateFrom)
  if (params?.dateTo) searchParams.append("dateTo", params.dateTo)
  if (params?.productId) searchParams.append("productId", params.productId)
  if (params?.supplier) searchParams.append("supplier", params.supplier)
  if (params?.client) searchParams.append("client", params.client)
  if (params?.type) searchParams.append("type", params.type)
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetchWithRetry(`/stock/movements${queryString}`)
  return response.json()
}
