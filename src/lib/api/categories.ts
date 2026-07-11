import { authenticatedFetch } from "./http"

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
