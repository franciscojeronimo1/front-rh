import { authenticatedFetch, authenticatedFetchWithRetry } from "./http"
import type { PaginationInfo } from "./types"

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

export async function updateProduct(
  id: string,
  data: UpdateProductRequest
): Promise<UpdateProductResponse> {
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
