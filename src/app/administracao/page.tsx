"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Building2,
  ArrowLeft,
  UserPlus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Users,
  Crown,
  Sparkles,
  Settings,
} from "lucide-react"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  getUsers,
  createStaff,
  updateUser,
  deleteUser,
  createCheckoutSession,
  createPortalSession,
  ApiError,
  type User,
  type CreateStaffRequest,
} from "@/lib/api"
import { useSubscription } from "@/hooks/useSubscription"
import { formatSubscriptionDate, formatTrialEndsAt } from "@/lib/subscription-format"

const MAX_STAFF = 5

function AdministracaoContent() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const [createForm, setCreateForm] = useState<CreateStaffRequest>({
    name: "",
    email: "",
    password: "",
  })
  const [editForm, setEditForm] = useState<{ name: string; email: string; password: string }>({
    name: "",
    email: "",
    password: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  const searchParams = useSearchParams()
  const {
    subscription,
    isPremium,
    isTrialing,
    needsPayment,
    isLoading: isLoadingSubscription,
    refetch: refetchSubscription,
  } = useSubscription()

  const showSuccessMessage = searchParams.get("success") === "1"

  useEffect(() => {
    if (showSuccessMessage) {
      refetchSubscription()
    }
  }, [showSuccessMessage, refetchSubscription])

  const handleUpgrade = async () => {
    setError("")
    try {
      setIsCheckoutLoading(true)
      const { url } = await createCheckoutSession()
      if (url) {
        window.location.href = url
      } else {
        setError("Não foi possível iniciar o checkout. Tente novamente.")
      }
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return
      setError(err instanceof Error ? err.message : "Erro ao iniciar checkout")
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  const handleOpenPortal = async () => {
    setError("")
    try {
      setIsPortalLoading(true)
      const { url } = await createPortalSession()
      if (url) {
        window.location.href = url
      } else {
        setError("Não foi possível abrir o portal. Tente novamente.")
      }
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return
      setError(err instanceof Error ? err.message : "Erro ao abrir portal")
    } finally {
      setIsPortalLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getUsers()
      const staffUsers = response.users.filter((u) => u.role === "STAFF")
      setUsers(staffUsers)
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return
      setError(err instanceof Error ? err.message : "Erro ao carregar colaboradores")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const userStr = localStorage.getItem("user")

      if (!token) {
        router.push("/login")
        return
      }

      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role !== "ADMIN") {
          router.push("/dashboard")
          return
        }
      }
    }
    loadUsers()
  }, [router])

  const staffCount = users.length
  const canCreateMore = staffCount < MAX_STAFF

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (createForm.name.length < 3) {
      setError("Nome deve ter no mínimo 3 caracteres")
      return
    }
    if (createForm.password.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres")
      return
    }

    try {
      setIsSubmitting(true)
      await createStaff(createForm)
      setSuccess("Colaborador criado com sucesso!")
      setCreateForm({ name: "", email: "", password: "" })
      setCreateDialogOpen(false)
      await loadUsers()
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return
      setError(err instanceof Error ? err.message : "Erro ao criar colaborador")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (user: User) => {
    setUserToEdit(user)
    setEditForm({ name: user.name, email: user.email, password: "" })
    setEditDialogOpen(true)
    setError("")
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToEdit) return
    setError("")
    setSuccess("")

    if (editForm.name.length < 3) {
      setError("Nome deve ter no mínimo 3 caracteres")
      return
    }
    if (editForm.password && editForm.password.length < 6) {
      setError("Senha deve ter no mínimo 6 caracteres (deixe em branco para não alterar)")
      return
    }

    try {
      setIsSubmitting(true)
      const payload: { name?: string; email?: string; password?: string } = {
        name: editForm.name,
        email: editForm.email,
      }
      if (editForm.password.trim()) {
        payload.password = editForm.password
      }
      await updateUser(userToEdit.id, payload)
      setSuccess("Colaborador atualizado com sucesso!")
      setEditDialogOpen(false)
      setUserToEdit(null)
      await loadUsers()
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return
      setError(err instanceof Error ? err.message : "Erro ao atualizar colaborador")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
    setError("")
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setError("")
    setSuccess("")

    try {
      setIsSubmitting(true)
      await deleteUser(userToDelete.id)
      setSuccess("Colaborador removido com sucesso!")
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      await loadUsers()
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return
      setError(err instanceof Error ? err.message : "Erro ao remover colaborador")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard" className="block">
          <Button
            variant="default"
            size="lg"
            className="gap-3 h-14 px-8 text-lg font-bold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto hover:cursor-pointer"
          >
            <ArrowLeft className="h-6 w-6" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Administração
          </h1>
          <p className="text-muted-foreground">
            Gerencie os colaboradores do sistema (máximo de {MAX_STAFF} por conta admin)
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

     

        {/* Card de Assinatura */}
        <Card
          className={
            isPremium || needsPayment ? "border-amber-500/50 bg-amber-500/5" : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPremium || needsPayment ? (
                  <Crown className="w-5 h-5 text-amber-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary" />
                )}
                Assinatura
              </CardTitle>
              <CardDescription>
                {isLoadingSubscription ? (
                  "Carregando..."
                ) : needsPayment ? (
                  "Regularize o pagamento para manter o acesso Premium."
                ) : isPremium && isTrialing ? (
                  "Teste Premium — acesso completo durante o período de avaliação"
                ) : isPremium ? (
                  "Plano Premium ativo — acesso completo ao sistema"
                ) : (
                  "Plano gratuito — upgrade para desbloquear todas as funcionalidades"
                )}
              </CardDescription>
            </div>
            {!isLoadingSubscription && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    isPremium || needsPayment
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {subscription?.plan === "PREMIUM"
                    ? needsPayment
                      ? "Premium — pagamento"
                      : isTrialing
                        ? "Teste Premium"
                        : "Premium"
                    : "Gratuito"}
                </span>
                {needsPayment && (
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={handleOpenPortal}
                    disabled={isPortalLoading}
                  >
                    {isPortalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecionando...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        Gerenciar pagamento
                      </>
                    )}
                  </Button>
                )}
                {!isPremium && !needsPayment && (
                  <Button
                    variant="default"
                    className="gap-2"
                    onClick={handleUpgrade}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecionando...
                      </>
                    ) : (
                      <>
                        <Crown className="h-4 w-4" />
                        Fazer upgrade
                      </>
                    )}
                  </Button>
                )}
                {isPremium && !needsPayment && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleOpenPortal}
                    disabled={isPortalLoading}
                  >
                    {isPortalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecionando...
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4" />
                        Gerenciar assinatura
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          {!isLoadingSubscription && isPremium && (isTrialing || subscription?.expiresAt) && (
            <CardContent className="space-y-2">
              {isTrialing && subscription?.trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  Seu Teste Premium termina em {formatTrialEndsAt(subscription.trialEndsAt)}.
                </p>
              )}
              {isTrialing && !subscription?.trialEndsAt && (
                <p className="text-sm text-muted-foreground">
                  Seu Teste Premium está ativo.
                </p>
              )}
              {!isTrialing && subscription?.expiresAt && (
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? `Seu Premium expira em ${formatSubscriptionDate(subscription.expiresAt)} e não será renovado.`
                    : `Próxima renovação em ${formatSubscriptionDate(subscription.expiresAt)}.`}
                </p>
              )}
            </CardContent>
          )}
          {!isLoadingSubscription && needsPayment && subscription?.message && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{subscription.message}</p>
            </CardContent>
          )}
          {!isLoadingSubscription && !isPremium && !needsPayment && (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Com o plano Premium você terá acesso a: ponto eletrônico, colaboradores, estoque, categorias, produtos e todas as demais funcionalidades.
              </p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Colaboradores
              </CardTitle>
              <CardDescription>
                {isLoading ? "Carregando..." : `${staffCount} de ${MAX_STAFF} colaboradores cadastrados`}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setCreateForm({ name: "", email: "", password: "" })
                setError("")
                setCreateDialogOpen(true)
              }}
              disabled={!canCreateMore || isLoading}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </CardHeader>
          <CardContent>
            {!canCreateMore && !isLoading && (
              <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Limite de colaboradores atingido. Máximo de {MAX_STAFF} por conta admin.
                </AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <TableSkeleton rows={5} columns={3} />
            ) : users.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-lg mb-2">Nenhum colaborador cadastrado</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Clique em &quot;Novo Colaborador&quot; para adicionar o primeiro
                </p>
                <Button
                  onClick={() => {
                    setCreateForm({ name: "", email: "", password: "" })
                    setCreateDialogOpen(true)
                  }}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Novo Colaborador
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                            title="Excluir"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Criar */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Colaborador</DialogTitle>
            <DialogDescription>
              Preencha os dados. O colaborador poderá fazer login com o email e senha informados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome completo"
                minLength={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Senha</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  "Criar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Colaborador</DialogTitle>
            <DialogDescription>
              Altere os dados. Deixe a senha em branco para não alterá-la.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nome completo"
                minLength={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nova senha (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Deixe em branco para não alterar"
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Colaborador</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{userToDelete?.name}</strong> (
              {userToDelete?.email})? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdministracaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }
    >
      <AdministracaoContent />
    </Suspense>
  )
}
