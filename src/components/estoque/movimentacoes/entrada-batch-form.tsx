"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { createStockEntryBatch, type Product } from "@/lib/api"
import { estoqueRelatoriosLayout } from "@/lib/estoque/dashboard-tokens"
import {
  createBatchLineItem,
  getBatchGrandTotal,
  getFilledBatchItems,
  parsePositiveNumber,
  resolveDefaultEntryUnitPrice,
  validateEntryBatchItems,
  type BatchLineItem,
} from "@/lib/estoque/batch-movement-utils"
import { formatBrl } from "@/lib/estoque/relatorios-utils"
import { StockBatchItemsEditor } from "./stock-batch-items-editor"

export function EntradaBatchForm() {
  const router = useRouter()
  const [items, setItems] = useState<BatchLineItem[]>([createBatchLineItem()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [errorLineId, setErrorLineId] = useState<string | null>(null)
  const [showSupplierFields, setShowSupplierFields] = useState(false)
  const [supplierName, setSupplierName] = useState("")
  const [supplierDoc, setSupplierDoc] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")

  const grandTotal = getBatchGrandTotal(items)
  const filledCount = getFilledBatchItems(items).length

  const handleProductSelect = (lineId: string, product: Product | null) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item
        if (!product) {
          return { ...item, product: null, productId: "", unitPrice: "" }
        }
        return {
          ...item,
          product,
          productId: product.id,
          unitPrice: resolveDefaultEntryUnitPrice(product),
        }
      })
    )
  }

  const resetForm = () => {
    setItems([createBatchLineItem()])
    setShowSupplierFields(false)
    setSupplierName("")
    setSupplierDoc("")
    setInvoiceNumber("")
    setNotes("")
    setErrorLineId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setErrorLineId(null)

    const validation = validateEntryBatchItems(items)
    if (!validation.ok) {
      setError(validation.message)
      if (validation.lineId) setErrorLineId(validation.lineId)
      return
    }

    const filled = getFilledBatchItems(items)

    try {
      setIsSubmitting(true)
      const response = await createStockEntryBatch({
        supplierName: supplierName.trim() || undefined,
        supplierDoc: supplierDoc.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: filled.map((item) => ({
          productId: item.productId,
          quantity: parsePositiveNumber(item.quantity)!,
          unitPrice: parsePositiveNumber(item.unitPrice)!,
        })),
      })
      toast.success(response.message || `${filled.length} entrada(s) registrada(s) com sucesso.`)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar entradas em lote")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={estoqueRelatoriosLayout.card}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <ArrowDown className="h-5 w-5 text-emerald-600" />
          Entrada em lote
        </CardTitle>
        <CardDescription>
          Registre vários produtos na mesma nota ou recebimento ({filledCount} item
          {filledCount !== 1 ? "s" : ""} preenchido{filledCount !== 1 ? "s" : ""})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <StockBatchItemsEditor
            items={items}
            onChange={setItems}
            variant="entry"
            disabled={isSubmitting}
            errorLineId={errorLineId}
            onProductSelect={handleProductSelect}
          />

          <div className="bg-muted p-4 rounded-lg flex flex-wrap justify-between items-center gap-4">
            <span className="text-sm font-medium">
              Total do lote ({filledCount} {filledCount === 1 ? "item" : "itens"}):
            </span>
            <span className="text-2xl font-bold tabular-nums">{formatBrl(grandTotal)}</span>
          </div>

          <Checkbox
            id="batch-show-supplier-fields"
            checked={showSupplierFields}
            onCheckedChange={(checked) => {
              setShowSupplierFields(!!checked)
              if (!checked) {
                setSupplierName("")
                setSupplierDoc("")
                setInvoiceNumber("")
              }
            }}
          >
            <span className="text-sm font-medium leading-none">
              Informar fornecedor/CNPJ ou Nota fiscal
            </span>
          </Checkbox>

          {showSupplierFields && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="batch-supplier-name">
                  Nome do Fornecedor
                </label>
                <Input
                  id="batch-supplier-name"
                  placeholder="Ex: Casa Elétrica Silva"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="batch-supplier-doc">
                  CNPJ/CPF do Fornecedor
                </label>
                <Input
                  id="batch-supplier-doc"
                  placeholder="12.345.678/0001-90"
                  value={supplierDoc}
                  onChange={(e) => setSupplierDoc(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="batch-invoice">
                  Número da Nota Fiscal
                </label>
                <Input
                  id="batch-invoice"
                  placeholder="NF-001234"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="batch-notes">
              Observações
            </label>
            <Input
              id="batch-notes"
              placeholder="Observações adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => router.push("/estoque")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || filledCount < 1}
              className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Registrar {filledCount > 0 ? `${filledCount} ` : ""}entrada
                  {filledCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
