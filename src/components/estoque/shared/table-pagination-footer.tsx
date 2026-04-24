"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PaginationInfo } from "@/lib/api"

export type TablePaginationFooterProps = {
  pagination: PaginationInfo
  pageInputValue: string
  onPageInputChange: (value: string) => void
  onCommitPage: (value: string) => void
  onPrev: () => void
  onNext: () => void
}

export function TablePaginationFooter({
  pagination,
  pageInputValue,
  onPageInputChange,
  onCommitPage,
  onPrev,
  onNext,
}: TablePaginationFooterProps) {
  if (pagination.totalPages <= 1) return null

  const commit = () =>
    onCommitPage(pageInputValue !== "" ? pageInputValue : pagination.page.toString())

  return (
    <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Página</span>
        <Input
          type="number"
          min={1}
          max={pagination.totalPages}
          value={pageInputValue !== "" ? pageInputValue : String(pagination.page)}
          onChange={(e) => onPageInputChange(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit()
          }}
          className="h-8 w-14 rounded-lg px-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span>de {pagination.totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200"
          onClick={onPrev}
          disabled={!pagination.hasPrev}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200"
          onClick={onNext}
          disabled={!pagination.hasNext}
        >
          Próxima
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
