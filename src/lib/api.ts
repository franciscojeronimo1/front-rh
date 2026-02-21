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

// ========== SISTEMA DE ESTOQUE ==========

// Produtos
export interface Product {
  id: string
  name: string
  code?: string | null
  sku?: string | null
  category?: string | null
  currentStock: number
  minStock: number
  unit: string
  costPrice?: string | null
  averageCost?: string | null
  active: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  name: string
  code?: string
  sku?: string
  category?: string
  minStock?: number
  unit?: string
  costPrice?: number
}

export interface UpdateProductRequest {
  name?: string
  code?: string
  sku?: string
  category?: string
  minStock?: number
  unit?: string
  costPrice?: number
  active?: boolean
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface ProductsResponse {
  products: Product[]
  pagination: PaginationInfo
}

export interface ProductResponse {
  product: Product
}

export interface CreateProductResponse {
  message: string
  product: Product
}

export interface UpdateProductResponse {
  message: string
  product: Product
}

export interface DeleteProductResponse {
  message: string
}

export interface GetProductsParams {
  category?: string
  /** Incluir produtos inativos. O backend usa includeInactive: true=ativos+inativos, false/omitido=apenas ativos */
  includeInactive?: boolean
  page?: number
  limit?: number
}

export async function getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.append("category", params.category)
  if (params?.includeInactive === true) searchParams.append("includeInactive", "true")
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetch(`/products${queryString}`)
  return response.json()
}

export async function getProductById(id: string): Promise<ProductResponse> {
  const response = await authenticatedFetch(`/products/${id}`)
  return response.json()
}


export async function createProduct(data: CreateProductRequest): Promise<CreateProductResponse> {
  const response = await authenticatedFetch("/products", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function updateProduct(id: string, data: UpdateProductRequest): Promise<UpdateProductResponse> {
  const response = await authenticatedFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function deleteProduct(id: string): Promise<DeleteProductResponse> {
  const response = await authenticatedFetch(`/products/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

// ========== CATEGORIAS ==========

export interface Category {
  id: string
  name: string
}

export interface CategoriesResponse {
  categories: Category[]
}

export interface CreateCategoryResponse {
  category: Category
}

export async function getCategories(): Promise<CategoriesResponse> {
  const response = await authenticatedFetch("/categories")
  return response.json()
}

export async function createCategory(name: string): Promise<CreateCategoryResponse> {
  const response = await authenticatedFetch("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
  return response.json()
}

export async function updateCategory(id: string, name: string): Promise<CreateCategoryResponse> {
  const response = await authenticatedFetch(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
  return response.json()
}

export async function deleteCategory(id: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`/categories/${id}`, {
    method: "DELETE",
  })
  return response.json()
}

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


export async function createStockEntry(data: CreateStockEntryRequest): Promise<CreateStockEntryResponse> {
  const response = await authenticatedFetch("/stock/entries", {
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

export async function getLowStock(): Promise<LowStockResponse> {
  const response = await authenticatedFetch("/stock/low-stock")
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

