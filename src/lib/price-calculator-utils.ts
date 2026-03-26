export type PriceCalculatorVariant = "percentOfValue" | "marginOnCost"

/**
 * Aceita número com vírgula decimal (pt-BR) ou ponto decimal (en).
 * Se houver vírgulos e pontos, os pontos são tratados como separador de milhar.
 */
export function parseLocaleNumber(s: string): number {
  if (!s || !String(s).trim()) return NaN
  const t = String(s).trim()
  if (t.includes(",")) {
    const normalized = t.replace(/\./g, "").replace(",", ".")
    return parseFloat(normalized)
  }
  return parseFloat(t)
}

export function formatInitialBasePtBr(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  const n = parseLocaleNumber(trimmed)
  if (Number.isNaN(n)) return trimmed
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function calculatePriceResult(
  variant: PriceCalculatorVariant,
  base: string,
  percent: string
): number {
  const baseNum = parseLocaleNumber(base)
  const percentNum = parseLocaleNumber(percent)

  return variant === "percentOfValue"
    ? !Number.isNaN(baseNum) && !Number.isNaN(percentNum)
      ? baseNum * (percentNum / 100)
      : NaN
    : !Number.isNaN(baseNum) && !Number.isNaN(percentNum)
      ? baseNum * (1 + percentNum / 100)
      : NaN
}

