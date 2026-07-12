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
import { ArrowLeft, FileText, Loader2, Save } from "lucide-react"
import { getClientById, updateClient, type UpdateClientRequest } from "@/lib/api"
import {
  clientFormSchema,
  digitsOnly,
  formatCpf,
  formatPhone,
  formatZipCode,
  type ClientFormValues,
} from "@/lib/schemas/client"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CardSkeleton } from "@/components/ui/card-skeleton"

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      cpf: "",
      phone: "",
      email: "",
      street: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      addressReference: "",
      notes: "",
      active: true,
    },
  })

  useEffect(() => {
    const loadClient = async () => {
      try {
        setIsLoading(true)
        setError("")
        const response = await getClientById(clientId)
        const c = response.client
        form.reset({
          name: c.name,
          cpf: formatCpf(c.cpf),
          phone: formatPhone(c.phone),
          email: c.email || "",
          street: c.street || "",
          neighborhood: c.neighborhood || "",
          city: c.city || "",
          state: c.state || "",
          zipCode: c.zipCode ? formatZipCode(c.zipCode) : "",
          addressReference: c.addressReference || "",
          notes: c.notes || "",
          active: c.active,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar cliente")
      } finally {
        setIsLoading(false)
      }
    }

    if (clientId) loadClient()
  }, [clientId, form])

  const onSubmit = async (data: ClientFormValues) => {
    try {
      setIsSaving(true)
      setError("")

      const requestData: UpdateClientRequest = {
        name: data.name.trim(),
        cpf: digitsOnly(data.cpf),
        phone: digitsOnly(data.phone),
        email: data.email?.trim() || null,
        street: data.street?.trim() || null,
        neighborhood: data.neighborhood?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim().toUpperCase() || null,
        zipCode: data.zipCode ? digitsOnly(data.zipCode) : null,
        addressReference: data.addressReference?.trim() || null,
        notes: data.notes?.trim() || null,
        active: data.active ?? true,
      }

      await updateClient(clientId, requestData)
      router.push("/clientes")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar cliente")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-3xl">
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/clientes")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Editar cliente</h1>
              <p className="text-muted-foreground">Atualize os dados do cadastro</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/clientes/${clientId}/carnes`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Carnês
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados do cliente</CardTitle>
            <CardDescription>Altere as informações necessárias</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Nome completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Maria Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            value={field.value}
                            onChange={(e) => field.onChange(formatCpf(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone / WhatsApp *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            value={field.value}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="opcional@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <p className="text-sm font-medium text-foreground">Endereço / local</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Rua / logradouro</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Estrada Municipal, km 12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="neighborhood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro / comunidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Comunidade Boa Vista" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              maxLength={2}
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase().slice(0, 2))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-000"
                              value={field.value}
                              onChange={(e) => field.onChange(formatZipCode(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="addressReference"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Ponto de referência</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Próximo ao posto de saúde da comunidade"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Útil para localização em zona rural
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Anotações internas"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Cliente ativo</FormLabel>
                        <FormDescription>
                          Clientes inativos ficam inativos na listagem
                        </FormDescription>
                      </div>
                      <FormControl>
                        <ActiveToggle
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/clientes")}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar alterações
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
