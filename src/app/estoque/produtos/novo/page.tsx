"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ArrowLeft, Calculator, Loader2, PackagePlus } from "lucide-react"
import { createProduct, type CreateProductRequest } from "@/lib/api"
import { productCreateSchema, type ProductCreateFormValues } from "@/lib/schemas/product"
import { CategorySelect } from "@/components/category-select"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { PriceCalculatorDialog } from "@/components/price-calculator-dialog"

export default function NovoProdutoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showSupplierFields, setShowSupplierFields] = useState(false)

  const form = useForm<ProductCreateFormValues>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: "",
      code: "",
      sku: "",
      category: "",
      minStock: "0",
      unit: "UN",
      initialStock: "",
      initialStockUnitPrice: "",
      costPrice: "",
      salePrice: "",
      supplierName: "",
      supplierDoc: "",
      active: true,
      expirationDate: "",
    },
  })

  const onSubmit = async (data: ProductCreateFormValues) => {
    try {
      setIsLoading(true)
      setError("")

      const exp = data.expirationDate?.trim()
      const initialStockRaw = data.initialStock?.trim()
      const initialStock =
        initialStockRaw !== undefined && initialStockRaw !== ""
          ? parseInt(initialStockRaw, 10)
          : 0
      const entryPriceRaw = data.initialStockUnitPrice?.trim()
      const hasEntryPrice = Boolean(entryPriceRaw)
      const requestData: CreateProductRequest = {
        name: data.name,
        code: data.code || undefined,
        sku: data.sku || undefined,
        category: data.category || undefined,
        minStock: parseFloat(data.minStock) || 0,
        unit: data.unit,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
        supplierName: data.supplierName || undefined,
        supplierDoc: data.supplierDoc || undefined,
        active: data.active ?? true,
        ...(exp ? { expirationDate: exp } : {}),
        ...(initialStock > 0 ? { initialStock } : {}),
        ...(initialStock > 0 && hasEntryPrice
          ? { initialStockUnitPrice: parseFloat(entryPriceRaw!) }
          : {}),
      }

      await createProduct(requestData)
      router.push("/estoque/produtos")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/estoque/produtos")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Novo Produto</h1>
            <p className="text-muted-foreground">Cadastre um novo produto no estoque</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
            <CardDescription>Preencha os dados do produto</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cabo Elétrico 2.5mm" {...field} />
                        </FormControl>
                        <FormDescription>Nome do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: CAB-001" {...field} />
                        </FormControl>
                        <FormDescription>Código interno do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SKU-001" {...field} />
                        </FormControl>
                        <FormDescription>Código SKU do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_11rem_auto] gap-x-4 gap-y-4 items-start">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <CategorySelect
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecione uma categoria"
                          />
                        </FormControl>
                        <FormDescription>Categoria do produto. Clique em + para criar uma nova</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expirationDate"
                    render={({ field }) => (
                      <FormItem className="w-full max-w-[11rem] md:max-w-none">
                        <FormLabel>Validade</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="w-full max-w-[11rem]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Opcional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="min-w-0 md:min-w-[12rem]">
                        <FormLabel>Produto Ativo</FormLabel>
                        <FormControl>
                          <ActiveToggle
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormDescription>Quantidade mínima</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <FormControl>
                          <Input placeholder="UN, MT, KG..." {...field} />
                        </FormControl>
                        <FormDescription>Unidade de medida</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              className="flex-1 min-w-0"
                              type="number"
                              step="0,01"
                              placeholder="0,00"
                              {...field}
                              value={field.value || ""}
                            />
                            <PriceCalculatorDialog
                              variant="percentOfValue"
                              defaultBase={field.value ?? ""}
                              onApply={(v) => form.setValue("costPrice", v)}
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="shrink-0"
                                  aria-label="Calculadora: percentual de um valor"
                                >
                                  <Calculator />
                                </Button>
                              }
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Preço de custo unitário</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              className="flex-1 min-w-0"
                              type="number"
                              step="0,01"
                              placeholder="0,00"
                              {...field}
                              value={field.value || ""}
                            />
                            <PriceCalculatorDialog
                              variant="marginOnCost"
                              costPriceHint={form.watch("costPrice") ?? ""}
                              onApply={(v) => form.setValue("salePrice", v)}
                              trigger={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="shrink-0"
                                  aria-label="Calculadora: margem sobre o custo"
                                >
                                  <Calculator />
                                </Button>
                              }
                            />
                          </div>
                        </FormControl>
                        <FormDescription>Preço de venda unitário</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">Estoque na criação</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Opcional. Se informar quantidade maior que zero, o sistema registra uma entrada. O preço unitário da entrada pode ser
                      o custo cadastral ou o valor abaixo. 
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initialStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque inicial</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="0"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>Deixe vazio ou 0 para começar sem estoque</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="initialStockUnitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço unitário da entrada</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              placeholder="Usa preço de custo se vazio"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Só se aplica com estoque inicial maior que zero.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Checkbox
                  id="show-supplier-fields"
                  checked={showSupplierFields}
                  onCheckedChange={(checked) => {
                    setShowSupplierFields(!!checked)
                    if (!checked) {
                      form.setValue("supplierName", "")
                      form.setValue("supplierDoc", "")
                    }
                  }}
                >
                  <span className="text-sm font-medium leading-none">
                    Informar fornecedor
                  </span>
                </Checkbox>

                {showSupplierFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Fornecedor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Distribuidora XYZ" {...field} />
                          </FormControl>
                          <FormDescription>Nome do fornecedor</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplierDoc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ/CPF do Fornecedor</FormLabel>
                          <FormControl>
                            <Input placeholder="12.345.678/0001-90" {...field} />
                          </FormControl>
                          <FormDescription>Documento do fornecedor</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/estoque/produtos")}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="h-4 w-4 mr-2" />
                        Criar Produto
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

