import { getAuthToken, redirectToLogin } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333"

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

async function authenticatedFetch(
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
    const message = error?.message && typeof error.message === "string"
      ? error.message
      : statusMessage
    throw new ApiError(message, response.status, code)
  }

  return response
}

/** Requisição autenticada com timeout e retry (rede/timeout/5xx). Para produtos e ponto. */
async function authenticatedFetchWithRetry(
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
  startDate?: string
  endDate?: string
  periods: TimePeriod[]
  totalMinutes: number
  totalHours: string
  status: "started" | "stopped"
}

export interface GetTimeSummaryParams {
  date?: string
  userId?: string
  periodDays?: number
  /** Mês no formato YYYY-MM (ex.: 2025-03). Não usar junto com date ou periodDays. */
  month?: string
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

/** Resumo de um dia local (vem em `byDay` quando a lista usa `month` ou `periodDays`). */
export interface TimeRecordDaySummary {
  date: string
  periods: TimePeriod[]
  totalMinutes: number
  totalHours: string
  status: "started" | "stopped"
}

export interface TimeRecordsResponse {
  records: TimeRecord[]
  summary: TimeSummary
  /** Presente quando a consulta usa `month` ou `periodDays` (não com `date` único). */
  byDay?: TimeRecordDaySummary[]
}

// Iniciar trabalho
export async function startTimeRecord(): Promise<StartTimeRecordResponse> {
  const response = await authenticatedFetchWithRetry("/time-records/start", {
    method: "POST",
  })
  return response.json()
}

// Parar trabalho
export async function stopTimeRecord(): Promise<StopTimeRecordResponse> {
  const response = await authenticatedFetchWithRetry("/time-records/stop", {
    method: "POST",
  })
  return response.json()
}


/**
 * Lista batidas e resumo do período. Mesmos filtros que `/time-records/summary`:
 * sem params = dia atual; `date` = um dia; `month` / `periodDays` = intervalo (com `byDay` no backend).
 */
export async function getTimeRecords(
  paramsOrDate?: GetTimeSummaryParams | string,
  userId?: string
): Promise<TimeRecordsResponse> {
  const opts = normalizeTimeSummaryParams(paramsOrDate, userId)
  const queryString = buildTimeSummaryQueryString(opts)
  const response = await authenticatedFetchWithRetry(`/time-records${queryString}`)
  return response.json()
}

function normalizeTimeSummaryParams(
  paramsOrDate?: GetTimeSummaryParams | string,
  userId?: string
): GetTimeSummaryParams {
  if (typeof paramsOrDate === "string") {
    return { date: paramsOrDate, userId }
  }
  return { ...paramsOrDate, ...(userId && { userId }) }
}

function buildTimeSummaryQueryString(opts: GetTimeSummaryParams): string {
  const q = new URLSearchParams()

  if (opts.date) {
    const date = opts.date.includes("T") ? opts.date.split("T")[0] : opts.date
    q.set("date", date.split("+")[0].split("Z")[0])
  } else if (opts.periodDays != null) {
    q.set("periodDays", String(opts.periodDays))
  } else if (opts.month) {
    q.set("month", opts.month.slice(0, 7))
  }

  if (opts.userId) q.set("userId", opts.userId)
  const query = q.toString()
  return query ? `?${query}` : ""
}

export async function getTimeSummary(
  paramsOrDate?: GetTimeSummaryParams | string,
  userId?: string
): Promise<{ summary: TimeSummary }> {
  const opts = normalizeTimeSummaryParams(paramsOrDate, userId)
  const queryString = buildTimeSummaryQueryString(opts)
  const response = await authenticatedFetchWithRetry(`/time-records/summary${queryString}`)
  return response.json()
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

// ========== ASSINATURA / PREMIUM ==========

export type Plan = "FREE" | "PREMIUM"
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "TRIAL"

export interface Subscription {
  id?: string
  plan: Plan
  status: SubscriptionStatus
  isPremium: boolean
  /** true apenas durante o trial (espelha status TRIAL). */
  isTrialing?: boolean
  message?: string
  startedAt?: string
  expiresAt?: string
  trialEndsAt?: string | null
  cancelAtPeriodEnd?: boolean
}

/** Deduplica GET /subscription em paralelo (dois sidebars no shell + guards premium). */
let subscriptionRequestInFlight: Promise<Subscription> | null = null

export async function getSubscription(): Promise<Subscription> {
  if (subscriptionRequestInFlight) {
    return subscriptionRequestInFlight
  }
  const started = (async () => {
    const response = await authenticatedFetch("/subscription")
    return response.json() as Promise<Subscription>
  })()
  subscriptionRequestInFlight = started.finally(() => {
    subscriptionRequestInFlight = null
  })
  return subscriptionRequestInFlight
}

export interface CreateCheckoutSessionResponse {
  url: string
  sessionId: string
}

export async function createCheckoutSession(): Promise<CreateCheckoutSessionResponse> {
  const response = await authenticatedFetch("/subscription/checkout", {
    method: "POST",
  })
  return response.json()
}

export interface CreatePortalSessionResponse {
  url: string
}

/** Retorna URL do Portal do Stripe (cancelar, atualizar cartão, etc.). Redirecione o usuário com window.location.href = url */
export async function createPortalSession(): Promise<CreatePortalSessionResponse> {
  const response = await authenticatedFetch("/subscription/portal", {
    method: "POST",
  })
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
  salePrice?: string | null
  averageCost?: string | null
  supplierName?: string | null
  supplierDoc?: string | null
  active: boolean
  /** ISO date ou datetime; ausente ou null = sem validade */
  expirationDate?: string | null
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
  salePrice?: number
  supplierName?: string
  supplierDoc?: string
  active?: boolean
  /** YYYY-MM-DD ou ISO datetime; omitir = sem validade no banco */
  expirationDate?: string
  initialStock?: number
  initialStockUnitPrice?: number
}

export interface UpdateProductRequest {
  name?: string
  code?: string
  sku?: string
  category?: string
  minStock?: number
  currentStock?: number
  unit?: string
  costPrice?: number
  salePrice?: number
  supplierName?: string | null
  supplierDoc?: string | null
  active?: boolean
  /** Data para alterar; null remove a validade */
  expirationDate?: string | null
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
  /** Apenas produtos com estoque baixo (currentStock <= minStock). Ordenação por currentStock ascendente no backend. */
  lowStock?: boolean
  /** Busca por nome, código ou SKU (case insensitive) */
  search?: string
  supplier?: string
  page?: number
  limit?: number
}

export async function getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.category) searchParams.append("category", params.category)
  if (params?.includeInactive === true) searchParams.append("includeInactive", "true")
  if (params?.lowStock === true) searchParams.append("lowStock", "true")
  if (params?.search) searchParams.append("search", params.search)
  if (params?.supplier?.trim()) searchParams.append("supplier", params.supplier.trim())
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetchWithRetry(`/products${queryString}`)
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

// ========== IMPORTAÇÃO DE PRODUTOS ==========

export interface ProductImportMapping {
  name: string
  quantity: string
  unitPrice: string
  code?: string
  category?: string
  sku?: string
  minStock?: string
  unit?: string
  costPrice?: string
  salePrice?: string
  supplierName?: string
  supplierDoc?: string
  invoiceNumber?: string
  notes?: string
}

export interface ProductImportSuccessItem {
  line: number
  productId: string
  name: string
  quantity: number
}

export interface ProductImportErrorItem {
  line: number
  field?: string
  message: string
}

export interface ProductImportResponse {
  message: string
  summary: { total: number; success: number; errors: number }
  success: ProductImportSuccessItem[]
  errors: ProductImportErrorItem[]
}

/** Importa produtos + estoque a partir de arquivo CSV ou Excel (base64) */
export async function importProducts(
  fileBase64: string,
  mapping: ProductImportMapping
): Promise<ProductImportResponse> {
  const response = await authenticatedFetch("/products/import", {
    method: "POST",
    body: JSON.stringify({ file: fileBase64, mapping }),
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

export async function getLowStock(
  params?: GetLowStockParams
): Promise<LowStockResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page !== undefined) searchParams.append("page", params.page.toString())
  if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString())
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await authenticatedFetch(`/stock/low-stock${queryString}`)
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

// ========== MOVIMENTAÇÕES DE ESTOQUE ==========

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

