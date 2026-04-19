/**
 * Datas que o backend/BD costumam devolver no lugar de "sem validade"
 * (epoch Unix em formato data, ou zero date do MySQL).
 */
export function isPlaceholderExpirationDate(iso?: string | null): boolean {
  if (iso == null || iso === "") return true
  const part = iso.split("T")[0]
  return part === "1970-01-01" || part === "0000-00-00"
}

/** Valor para `<input type="date">` (YYYY-MM-DD) ou vazio. */
export function expirationDateToInputValue(iso?: string | null): string {
  if (isPlaceholderExpirationDate(iso)) return ""
  return iso!.split("T")[0]
}

/** Corpo PUT/PATCH: data válida (YYYY-MM-DD) ou null para limpar; nunca número 0 nem sentinela. */
export function expirationDateToApiValue(formValue: string | undefined | null): string | null {
  const t = formValue?.trim() ?? ""
  if (t === "" || t === "0" || isPlaceholderExpirationDate(t)) return null
  return t
}

/** Valor canônico vindo da API para comparar com o formulário (null = sem validade). */
export function normalizedExpirationFromApi(iso?: string | null): string | null {
  return expirationDateToApiValue(expirationDateToInputValue(iso))
}
