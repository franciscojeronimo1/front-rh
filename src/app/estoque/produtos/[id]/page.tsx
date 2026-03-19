"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
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
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { getProductById, updateProduct, type Product, type UpdateProductRequest } from "@/lib/api"
import { productUpdateSchema, type ProductUpdateFormValues } from "@/lib/schemas/product"
import { CategorySelect } from "@/components/category-select"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function EditarProdutoPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const productId = params.id as string
  const returnUrl = searchParams.get("from") || "/estoque/produtos"

  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [showSupplierFields, setShowSupplierFields] = useState(false)

  const form = useForm<ProductUpdateFormValues>({
    resolver: zodResolver(productUpdateSchema),
  })

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true)
        const response = await getProductById(productId)
        setProduct(response.product)
        form.reset({
          name: response.product.name,
          code: response.product.code || "",
          sku: response.product.sku || "",
          category: response.product.category || "",
          minStock: response.product.minStock.toString(),
          currentStock: response.product.currentStock.toString(),
          unit: response.product.unit,
          costPrice: response.product.costPrice || "",
          salePrice: response.product.salePrice || "",
          supplierName: response.product.supplierName || "",
          supplierDoc: response.product.supplierDoc || "",
          active: response.product.active,
        })
        setShowSupplierFields(!!(response.product.supplierName || response.product.supplierDoc))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar produto")
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      loadProduct()
    }
  }, [productId, form])

  const onSubmit = async (data: ProductUpdateFormValues) => {
    try {
      setIsSaving(true)
      setError("")

      const requestData: UpdateProductRequest = {
        name: data.name,
        code: data.code || undefined,
        sku: data.sku || undefined,
        category: data.category || undefined,
        minStock: data.minStock ? parseFloat(data.minStock) : undefined,
        currentStock: data.currentStock ? parseInt(data.currentStock, 10) : undefined,
        unit: data.unit,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : undefined,
        salePrice: data.salePrice ? parseFloat(data.salePrice) : undefined,
        supplierName: showSupplierFields ? (data.supplierName || null) : null,
        supplierDoc: showSupplierFields ? (data.supplierDoc || null) : null,
        active: data.active,
      }

      await updateProduct(productId, requestData)
      router.push(returnUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar produto")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>Produto não encontrado</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(returnUrl)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Editar Produto</h1>
            <p className="text-muted-foreground">Atualize as informações do produto</p>
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
            <CardDescription>Atualize os dados do produto</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <fieldset className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
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
                    name="active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto Ativo</FormLabel>
                        <FormControl>
                          <ActiveToggle
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormDescription>Produtos inativos não aparecem nas listagens</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Atual</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            {...field}
                            />
                        </FormControl>
                        <FormDescription>Quantidade atual</FormDescription>
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
                          <Input
                            type="number"
                            step="0,01"
                            placeholder="0,00 "
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Custo unitário</FormDescription>
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
                          <Input
                            type="number"
                            step="0,01"
                            placeholder="0,00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Venda unitário</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Informações Adicionais</p>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Custo Médio:</span>
                    <p className="font-bold">
                      {product.averageCost
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(parseFloat(product.averageCost))
                        : "-"}
                    </p>
                  </div>
                </div>

                </fieldset>
                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(returnUrl)}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
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

