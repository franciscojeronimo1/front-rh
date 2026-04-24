"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export type EstoqueSubpageHeaderProps = {
  title: string
  subtitle: string
  onBack: () => void
}

export function EstoqueSubpageHeader({ title, subtitle, onBack }: EstoqueSubpageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onBack}
        className="mt-0.5 h-10 w-10 shrink-0 rounded-xl border-slate-200 bg-white shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 md:text-base">{subtitle}</p>
      </div>
    </div>
  )
}
