"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import {
  importProducts,
  type ProductImportMapping,
  type ProductImportResponse,
} from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

const MAPPING_FIELDS: { key: keyof ProductImportMapping; label: string; required?: boolean }[] = [
  { key: "name", label: "Nome do produto", required: true },
  { key: "quantity", label: "Quantidade (estoque)", required: true },
  { key: "unitPrice", label: "Preço unitário", required: true },
  { key: "code", label: "Código" },
  { key: "category", label: "Categoria" },
  { key: "sku", label: "SKU" },
  { key: "minStock", label: "Estoque mínimo" },
  { key: "unit", label: "Unidade" },
  { key: "costPrice", label: "Preço de custo" },
  { key: "salePrice", label: "Preço de venda" },
  { key: "supplierName", label: "Fornecedor" },
  { key: "supplierDoc", label: "Documento do fornecedor" },
  { key: "invoiceNumber", label: "Número da nota" },
  { key: "notes", label: "Observações" },
]

export default function ImportarProdutosPage() {
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "mapping" | "result">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [mapping, setMapping] = useState<ProductImportMapping>({
    name: "",
    quantity: "",
    unitPrice: "",
  })
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<ProductImportResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const ext = f.name.split(".").pop()?.toLowerCase()
      if (!["csv", "xls", "xlsx"].includes(ext || "")) {
        setError("Arquivo deve ser CSV ou Excel (.xls, .xlsx)")
        setFile(null)
        return
      }
      setFile(f)
      setError("")
    }
  }

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.includes(",") ? result.split(",")[1]! : result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(f)
    })

  const handleSubmitImport = async () => {
    if (!file) return
    const hasRequired =
      mapping.name.trim() && mapping.quantity.trim() && mapping.unitPrice.trim()
    if (!hasRequired) {
      setError("Preencha os campos obrigatórios: Nome, Quantidade e Preço unitário")
      return
    }

    try {
      setIsImporting(true)
      setError("")
      const base64 = await fileToBase64(file)
      const cleanMapping: ProductImportMapping = {
        name: mapping.name.trim(),
        quantity: mapping.quantity.trim(),
        unitPrice: mapping.unitPrice.trim(),
      }
      MAPPING_FIELDS.forEach(({ key }) => {
        if (key !== "name" && key !== "quantity" && key !== "unitPrice") {
          const val = mapping[key]
          if (val && typeof val === "string" && val.trim()) {
            cleanMapping[key as keyof ProductImportMapping] = val.trim()
          }
        }
      })
      const res = await importProducts(base64, cleanMapping)
      setResult(res)
      setStep("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar produtos")
    } finally {
      setIsImporting(false)
    }
  }

  const handleNewImport = () => {
    setStep("upload")
    setFile(null)
    setResult(null)
    setError("")
    setMapping({ name: "", quantity: "", unitPrice: "" })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Importar Produtos com Estoque
            </h1>
            <p className="text-muted-foreground">
              Importe produtos em lote a partir de planilha CSV ou Excel
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "upload" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Enviar o arquivo
                </CardTitle>
                <CardDescription>
                  Selecione o arquivo CSV ou Excel (.xls, .xlsx) com seus produtos e configure o
                  mapeamento das colunas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="max-w-sm"
                  />
                  {file && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {file.name}
                    </span>
                  )}
                </div>
                {file && (
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Mapeamento das colunas</CardTitle>
                      <CardDescription>
                        Informe o nome exato de cada coluna na sua planilha. Campos com * são
                        obrigatórios.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        {MAPPING_FIELDS.map(({ key, label, required }) => (
                          <div key={key} className="space-y-2">
                            <Label htmlFor={key}>
                              {label}
                              {required && " *"}
                            </Label>
                            <Input
                              id={key}
                              placeholder={`Ex: ${key === "name" ? "nome" : key === "quantity" ? "quantidade" : key === "unitPrice" ? "preco_unitario" : key}`}
                              value={mapping[key] || ""}
                              onChange={(e) =>
                                setMapping((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleSubmitImport} disabled={isImporting}>
                        {isImporting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Importar produtos
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === "result" && result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Importação concluída
              </CardTitle>
              <CardDescription>{result.message}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{result.summary.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border p-4 text-center border-success/50 bg-success/5">
                  <p className="text-2xl font-bold text-success">{result.summary.success}</p>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                </div>
                <div className="rounded-lg border p-4 text-center border-destructive/50 bg-destructive/5">
                  <p className="text-2xl font-bold text-destructive">{result.summary.errors}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    Erros ({result.errors.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded border p-3 space-y-1 text-sm">
                    {result.errors.map((err, i) => (
                      <div key={i} className="text-destructive">
                        Linha {err.line}: {err.message}
                        {err.field && ` (campo: ${err.field})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={handleNewImport} variant="outline">
                  Nova importação
                </Button>
                <Button onClick={() => router.push("/estoque/produtos")}>
                  Ir para lista de produtos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
