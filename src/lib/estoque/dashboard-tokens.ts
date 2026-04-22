/**
 * Paleta e classes reutilizáveis do dashboard de estoque.
 * Use estes tokens em outras telas (relatórios, gráficos) para manter consistência visual.
 */
export const estoqueChartColors = {
  entradas: "#22c55e",
  saidas: "#3b82f6",
} as const

export const estoqueKpiColors = {
  valor: "#3b82f6",
  produtos: "#22c55e",
  estoqueBaixo: "#ef4444",
  uso: "#f59e0b",
} as const

/** Fundo de ícone KPI (Tailwind) */
export const estoqueKpiIconSurface = {
  valor: "bg-blue-500/10 text-blue-600",
  produtos: "bg-emerald-500/10 text-emerald-600",
  estoqueBaixo: "bg-red-500/10 text-red-600",
  uso: "bg-amber-500/10 text-amber-600",
} as const

/** Ações rápidas: círculo de ícone */
export const estoqueQuickActionTone = {
  emerald: { circle: "bg-emerald-500/15 text-emerald-600" },
  blue: { circle: "bg-blue-500/15 text-blue-600" },
  amber: { circle: "bg-amber-500/15 text-amber-600" },
} as const

export type EstoqueQuickActionTone = keyof typeof estoqueQuickActionTone

export const estoqueDashboardLayout = {
  page: "min-h-screen bg-slate-50/90 p-6 md:p-8",
  container: "mx-auto max-w-7xl space-y-8",
  card: "rounded-2xl border-0 bg-white shadow-md shadow-slate-200/60",
  cardInteractive: "rounded-2xl border-0 bg-white shadow-md shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-lg",
} as const
