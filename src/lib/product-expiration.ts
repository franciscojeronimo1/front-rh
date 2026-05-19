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

/** Exibe validade em dd/mm/aaaa sem deslocar fuso (YYYY-MM-DD do backend). */
export function formatProductExpirationBr(iso?: string | null): string {
  if (isPlaceholderExpirationDate(iso)) return "—"
  const datePart = iso!.split("T")[0]
  const [y, m, d] = datePart.split("-").map(Number)
  if (!y || !m || !d) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d))
}

/**
 * Calcula dias até a validade só pelo dia civil (YYYY-MM-DD da API),
 * alinhado ao que o usuário vê na coluna Validade.
 */
export function getExpirationCalendarMetrics(iso?: string | null): {
  daysUntilExpiration: number
  isExpired: boolean
} | null {
  if (isPlaceholderExpirationDate(iso)) return null
  const part = iso!.split("T")[0]
  const [ey, em, ed] = part.split("-").map(Number)
  if (!ey || !em || !ed) return null

  const today = new Date()
  const expOrdinal = Date.UTC(ey, em - 1, ed)
  const todayOrdinal = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const daysUntilExpiration = Math.round((expOrdinal - todayOrdinal) / 86_400_000)

  return {
    daysUntilExpiration,
    isExpired: daysUntilExpiration < 0,
  }
}

export function formatDaysUntilExpirationLabel(
  daysUntilExpiration: number,
  isExpired: boolean
): string {
  if (isExpired || daysUntilExpiration < 0) {
    const abs = Math.abs(daysUntilExpiration)
    return abs === 0 ? "Vence hoje" : `Vencido há ${abs} dia${abs === 1 ? "" : "s"}`
  }
  if (daysUntilExpiration === 0) return "Vence hoje"
  if (daysUntilExpiration === 1) return "Vence amanhã"
  return `Vence em ${daysUntilExpiration} dias`
}

export function formatExpirationSituationFromIso(iso?: string | null): string {
  const metrics = getExpirationCalendarMetrics(iso)
  if (!metrics) return "—"
  return formatDaysUntilExpirationLabel(
    metrics.daysUntilExpiration,
    metrics.isExpired
  )
}
