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
import { ArrowLeft, Loader2, PackagePlus } from "lucide-react"
import { createProduct, type CreateProductRequest } from "@/lib/api"
import { productCreateSchema, type ProductCreateFormValues } from "@/lib/schemas/product"
import { CategorySelect } from "@/components/category-select"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

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
      costPrice: "",
      salePrice: "",
      supplierName: "",
      supplierDoc: "",
      active: true,
    },
  })

  const onSubmit = async (data: ProductCreateFormValues) => {
    try {
      setIsLoading(true)
      setError("")

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
                          <Input
                            type="number"
                            step="0,01"
                            placeholder="0,00"
                            {...field}
                            value={field.value || ""}
                          />
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
                          <Input
                            type="number"
                            step="0,01"
                            placeholder="0,00"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Preço de venda unitário</FormDescription>
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

