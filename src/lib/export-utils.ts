import * as XLSX from "xlsx"
import type {
  LowStockResponse,
  DailyUsageResponse,
  WeeklyUsageResponse,
  CurrentStockResponse,
  TotalValueResponse,
} from "@/lib/api"

export type ExportRow = Record<string, unknown>

/** Escapa valor para CSV (vírgulas, aspas, quebras de linha) */
function escapeCsvValue(value: unknown): string {
  if (value == null) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** Converte array de objetos em CSV e dispara download */
export function downloadCsv(
  rows: ExportRow[],
  filename: string,
  columns?: string[]
) {
  if (rows.length === 0) return
  const cols = columns ?? Object.keys(rows[0] ?? {})
  const header = cols.map(escapeCsvValue).join(";")
  const body = rows
    .map((row) => cols.map((col) => escapeCsvValue(row[col])).join(";"))
    .join("\n")
  const csv = `${header}\n${body}`
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Converte array de objetos em Excel e dispara download */
export function downloadExcel(
  rows: ExportRow[],
  filename: string,
  sheetName = "Relatório"
) {
  if (rows.length === 0) return
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`)
}

// ========== Builders para cada tipo de relatório ==========

export function buildLowStockRows(data: LowStockResponse): ExportRow[] {
  return data.products.map((p) => ({
    Produto: p.name,
    Categoria: p.category || "-",
    "Estoque Atual": p.currentStock,
    "Estoque Mínimo": p.minStock,
    Unidade: p.unit,
    Déficit: -(p.deficit ?? p.minStock - p.currentStock),
  }))
}

function exportMoneyOptional(value: number | string | null | undefined): string {
  if (value == null || value === "") return "-"
  const n = typeof value === "number" ? value : parseFloat(String(value))
  if (Number.isNaN(n)) return "-"
  return n.toFixed(2)
}

export function buildDailyUsageRows(data: DailyUsageResponse): ExportRow[] {
  return data.products.flatMap((p) =>
    p.exits.map((e) => ({
      Produto: p.product.name,
      Quantidade: e.quantity,
      Unidade: p.product.unit,
      "Preço de custo": exportMoneyOptional(p.product.costPrice),
      "Custo médio": exportMoneyOptional(p.product.averageCost),
      "Preço Unit.": e.unitPrice ? parseFloat(e.unitPrice).toFixed(2) : "-",
      "Valor Total": e.totalPrice ? parseFloat(e.totalPrice).toFixed(2) : "-",
      Cliente: e.clientName || "-",
      Projeto: e.projectName || "-",
      "Tipo Serviço": e.serviceType || "-",
      Observações: e.notes || "-",
    }))
  )
}

export function buildWeeklyUsageRows(data: WeeklyUsageResponse): ExportRow[] {
  return data.products.flatMap((p) =>
    (p.exits || []).map((e) => ({
      Produto: p.product.name,
      Quantidade: e.quantity,
      Unidade: p.product.unit,
      "Preço de custo": exportMoneyOptional(p.product.costPrice),
      "Custo médio": exportMoneyOptional(p.product.averageCost),
      "Preço Unit.": e.unitPrice ? parseFloat(e.unitPrice).toFixed(2) : "-",
      "Valor Total": e.totalPrice ? parseFloat(e.totalPrice).toFixed(2) : "-",
      Cliente: e.clientName || "-",
      Projeto: e.projectName || "-",
      "Tipo Serviço": e.serviceType || "-",
      Observações: e.notes || "-",
    }))
  )
}

export function buildCurrentStockRows(data: CurrentStockResponse): ExportRow[] {
  return data.products.map((p) => ({
    Produto: p.name,
    Categoria: p.category || "-",
    Estoque: p.currentStock,
    Mínimo: p.minStock,
    Unidade: p.unit,
    "Custo Médio": p.averageCost
      ? parseFloat(String(p.averageCost)).toFixed(2)
      : "-",
    "Valor Total":
      p.totalValue != null
        ? (
            typeof p.totalValue === "number"
              ? p.totalValue
              : parseFloat(String(p.totalValue))
          ).toFixed(2)
        : "-",
  }))
}

export function buildTotalValueRows(data: TotalValueResponse): ExportRow[] {
  return [
    { Indicador: "Valor Total", Valor: data.totalValue },
    { Indicador: "Total de Produtos", Valor: data.totalProducts },
    { Indicador: "Produtos com Valor", Valor: data.productsWithStock },
  ]
}
