"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  createStockExitBatch,
  getProductById,
  type Product,
} from "@/lib/api"
import { estoqueRelatoriosLayout } from "@/lib/estoque/dashboard-tokens"
import {
  createBatchLineItem,
  getBatchGrandTotal,
  getFilledBatchItems,
  parsePositiveNumber,
  resolveDefaultExitUnitPrice,
  validateExitBatchItems,
  validateExitBatchStock,
  type BatchLineItem,
} from "@/lib/estoque/batch-movement-utils"
import { formatBrl } from "@/lib/estoque/relatorios-utils"
import { StockBatchItemsEditor } from "./stock-batch-items-editor"

export function SaidaBatchForm() {
  const router = useRouter()
  const [items, setItems] = useState<BatchLineItem[]>([createBatchLineItem()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [errorLineId, setErrorLineId] = useState<string | null>(null)
  const [showProjectFields, setShowProjectFields] = useState(false)
  const [projectName, setProjectName] = useState("")
  const [clientName, setClientName] = useState("")
  const [serviceType, setServiceType] = useState("")
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
          unitPrice: resolveDefaultExitUnitPrice(product),
        }
      })
    )
  }

  const resetForm = () => {
    setItems([createBatchLineItem()])
    setShowProjectFields(false)
    setProjectName("")
    setClientName("")
    setServiceType("")
    setNotes("")
    setErrorLineId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setErrorLineId(null)

    const validation = validateExitBatchItems(items)
    if (!validation.ok) {
      setError(validation.message)
      if (validation.lineId) setErrorLineId(validation.lineId)
      return
    }

    const filled = getFilledBatchItems(items)

    try {
      setIsSubmitting(true)

      const uniqueProductIds = [...new Set(filled.map((i) => i.productId))]
      const freshProducts = await Promise.all(
        uniqueProductIds.map((id) => getProductById(id).then((r) => r.product))
      )
      const productsById = new Map(freshProducts.map((p) => [p.id, p]))

      const itemsWithFreshStock = filled.map((item) => ({
        ...item,
        product: productsById.get(item.productId) ?? item.product,
      }))

      const stockValidation = validateExitBatchStock(itemsWithFreshStock, productsById)
      if (!stockValidation.ok) {
        setError(stockValidation.message)
        setIsSubmitting(false)
        return
      }

      const response = await createStockExitBatch({
        projectName: projectName.trim() || undefined,
        clientName: clientName.trim() || undefined,
        serviceType: serviceType.trim() || undefined,
        notes: notes.trim() || undefined,
        items: filled.map((item) => {
          const quantity = parsePositiveNumber(item.quantity)!
          const unitPriceRaw = item.unitPrice.trim()
          const unitPriceNum = unitPriceRaw ? parsePositiveNumber(unitPriceRaw) : null
          return {
            productId: item.productId,
            quantity,
            ...(unitPriceNum != null && { unitPrice: unitPriceNum }),
          }
        }),
      })

      toast.success(response.message || `${filled.length} saída(s) registrada(s) com sucesso.`)
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar saídas em lote")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={estoqueRelatoriosLayout.card}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <ArrowUp className="h-5 w-5 text-blue-600" />
          Saída em lote
        </CardTitle>
        <CardDescription>
          Registre o consumo de vários produtos de uma vez ({filledCount} item
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
            variant="exit"
            disabled={isSubmitting}
            errorLineId={errorLineId}
            onProductSelect={handleProductSelect}
          />

          <div className="bg-muted p-4 rounded-lg flex flex-wrap justify-between items-center gap-4">
            <span className="text-sm font-medium">
              Total estimado ({filledCount} {filledCount === 1 ? "item" : "itens"}):
            </span>
            <span className="text-2xl font-bold tabular-nums">{formatBrl(grandTotal)}</span>
          </div>

          <Checkbox
            id="batch-show-project-fields"
            checked={showProjectFields}
            onCheckedChange={(checked) => {
              setShowProjectFields(!!checked)
              if (!checked) {
                setProjectName("")
                setClientName("")
                setServiceType("")
              }
            }}
          >
            <span className="text-sm font-medium leading-none">
              Deseja informar projeto, cliente ou tipo de serviço?
            </span>
          </Checkbox>

          {showProjectFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="batch-project">
                  Nome do Projeto
                </label>
                <Input
                  id="batch-project"
                  placeholder="Ex: Instalação Residencial"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="batch-client">
                  Nome do Cliente
                </label>
                <Input
                  id="batch-client"
                  placeholder="Ex: João Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="batch-service">
                  Tipo de Serviço
                </label>
                <Input
                  id="batch-service"
                  placeholder="Ex: Instalação Elétrica"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="batch-exit-notes">
              Observações
            </label>
            <Input
              id="batch-exit-notes"
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
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Registrar {filledCount > 0 ? `${filledCount} ` : ""}saída
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
