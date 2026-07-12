"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBooklet, getClientById, type Client } from "@/lib/api"
import {
  bookletCreateSchema,
  type BookletCreateFormValues,
} from "@/lib/schemas/booklet"
import { ArrowLeft, Loader2, Receipt } from "lucide-react"

export default function NovoCarnePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<BookletCreateFormValues>({
    resolver: zodResolver(bookletCreateSchema),
    defaultValues: {
      description: "",
      notes: "",
      installmentCount: "12",
      installmentAmount: "",
      firstDueDate: "",
    },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getClientById(clientId)
        setClient(res.client)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar cliente")
      }
    }
    if (clientId) load()
  }, [clientId])

  const onSubmit = async (data: BookletCreateFormValues) => {
    try {
      setIsLoading(true)
      setError("")
      const res = await createBooklet({
        clientId,
        description: data.description?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        installmentCount: parseInt(data.installmentCount, 10),
        installmentAmount: parseFloat(data.installmentAmount.replace(",", ".")),
        firstDueDate: data.firstDueDate,
      })
      router.push(`/clientes/${clientId}/carnes/${res.booklet.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar carnê")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/clientes/${clientId}/carnes`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="mb-1 text-3xl font-bold text-foreground">Novo carnê</h1>
            <p className="text-muted-foreground">
              {client ? `Cliente: ${client.name}` : "Carregando..."}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados do carnê</CardTitle>
            <CardDescription>
              Informe valor, quantidade de parcelas e o primeiro vencimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano / descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Internet 100MB" {...field} />
                      </FormControl>
                      <FormDescription>Aparece no PDF do carnê</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="installmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da parcela (R$) *</FormLabel>
                        <FormControl>
                          <Input placeholder="89.90" inputMode="decimal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installmentCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qtd. de parcelas *</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={48} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="firstDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primeiro vencimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        As demais parcelas seguem mês a mês a partir desta data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder="Opcional"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/clientes/${clientId}/carnes`)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Receipt className="mr-2 h-4 w-4" />
                    )}
                    Gerar carnê
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
