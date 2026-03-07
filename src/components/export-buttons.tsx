"use client"

import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import { downloadCsv, downloadExcel, type ExportRow } from "@/lib/export-utils"

interface ExportButtonsProps {
  /** Dados a exportar (linhas do relatório) */
  rows: ExportRow[]
  /** Nome base do arquivo (sem extensão). Ex: "estoque-baixo" ou "uso-diario-2025-03-07" */
  filename: string
  /** Nome da aba no Excel */
  sheetName?: string
  /** Desabilitar botões quando não há dados (padrão: true) */
  hideWhenEmpty?: boolean
}

export function ExportButtons({
  rows,
  filename,
  sheetName = "Relatório",
  hideWhenEmpty = true,
}: ExportButtonsProps) {
  if (hideWhenEmpty && rows.length === 0) return null

  const csvFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`
  const xlsxFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadCsv(rows, csvFilename)}
      >
        <FileDown className="h-4 w-4 mr-1" />
        Exportar CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadExcel(rows, xlsxFilename, sheetName)}
      >
        <FileDown className="h-4 w-4 mr-1" />
        Exportar Excel
      </Button>
    </div>
  )
}
