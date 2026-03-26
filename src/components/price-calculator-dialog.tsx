"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  calculatePriceResult,
  formatInitialBasePtBr,
  parseLocaleNumber,
  type PriceCalculatorVariant,
} from "@/lib/price-calculator-utils"

export type PriceCalculatorDialogProps = {
  variant: PriceCalculatorVariant
  onApply: (value: string) => void
  trigger: React.ReactNode
  /** Valor inicial do campo base (percentOfValue) ou fallback para margem */
  defaultBase?: string
  /** Custo atual do formulário; em marginOnCost preenche a base ao abrir */
  costPriceHint?: string
}

export function PriceCalculatorDialog({
  variant,
  onApply,
  trigger,
  defaultBase = "",
  costPriceHint = "",
}: PriceCalculatorDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [base, setBase] = React.useState("")
  const [percent, setPercent] = React.useState("")

  const initialBase = React.useCallback(() => {
    if (variant === "marginOnCost") {
      const hint = parseLocaleNumber(costPriceHint)
      if (!Number.isNaN(hint)) return costPriceHint.trim()
      return defaultBase.trim()
    }
    return defaultBase.trim()
  }, [variant, costPriceHint, defaultBase])

  React.useEffect(() => {
    if (open) {
      setBase(formatInitialBasePtBr(initialBase()))
      setPercent("")
    }
  }, [open, initialBase])

  const result = calculatePriceResult(variant, base, percent)

  const handleApply = () => {
    if (Number.isNaN(result)) return
    onApply(result.toFixed(2))
    setOpen(false)
  }

  const title =
    variant === "percentOfValue"
      ? "Percentual de um valor"
      : "Preço de venda com margem"

  const description =
    variant === "percentOfValue"
      ? "Informe o valor base e o percentual. O resultado é o percentual aplicado sobre a base (ex.: 10% de 100 = 10)."
      : "Informe o custo e a margem desejada em %. O resultado é custo × (1 + margem/100)."

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="calc-base">
              {variant === "marginOnCost" ? "Custo (base)" : "Valor base"}
            </Label>
            <Input
              id="calc-base"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="calc-percent">
              {variant === "marginOnCost" ? "Margem (%)" : "Percentual (%)"}
            </Label>
            <Input
              id="calc-percent"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              autoComplete="off"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Resultado:{" "}
            <span className="text-foreground font-medium tabular-nums">
              {Number.isNaN(result)
                ? "—"
                : result.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
            </span>
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply} disabled={Number.isNaN(result)}>
            Aplicar ao campo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
