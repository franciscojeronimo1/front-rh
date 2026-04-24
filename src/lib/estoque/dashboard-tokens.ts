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

/** Relatórios de estoque: alinhado ao dashboard, com ritmo um pouco mais compacto. */
export const estoqueRelatoriosLayout = {
  page: estoqueDashboardLayout.page,
  container: "mx-auto max-w-7xl space-y-6",
  card: estoqueDashboardLayout.card,
  /** Mini-KPIs dentro dos relatórios (uso diário / semanal). */
  statTile: "rounded-xl border border-slate-100 bg-white p-4 shadow-sm",
  /** Blocos maiores (ex.: valor total do relatório). */
  statBlock: "rounded-xl border border-slate-100 bg-white p-6 shadow-sm",
  statBlockPrimary: "rounded-xl border border-blue-100 bg-blue-50/90 p-6 shadow-sm",
  tabGrid: "grid grid-cols-2 gap-3 md:grid-cols-5",
} as const

/** Formulários estreitos (entrada / saída / edição). */
export const estoqueFormLayout = {
  page: estoqueRelatoriosLayout.page,
  narrow: "mx-auto w-full max-w-3xl space-y-6",
  loadingCenter: "flex min-h-[50vh] items-center justify-center",
} as const
