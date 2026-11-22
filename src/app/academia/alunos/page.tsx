"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createCheckIn,
  deactivateGymMember,
  getGymMembers,
  reactivateGymMember,
  type GymMember,
  type MemberFilter,
  type PaginationInfo,
} from "@/lib/api"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { MemberStatusBadge, ToneText } from "@/components/academia/member-status-badge"
import { MemberFormDialog } from "@/components/academia/member-form-dialog"
import { MembershipDialog } from "@/components/academia/membership-dialog"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import {
  effectiveStatus,
  formatDateBR,
  lastCheckInLabel,
  planLabel,
  whatsappLink,
} from "@/lib/academia/format"
import { formatPhone } from "@/lib/schemas/client"
import { cn } from "@/lib/utils"

const FILTERS: { value: MemberFilter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "ACTIVE", label: "Ativos" },
  { value: "AT_RISK", label: "Em risco" },
  { value: "INACTIVE", label: "Inativos" },
  { value: "PLAN_EXPIRING", label: "Plano vencendo" },
  { value: "PLAN_EXPIRED", label: "Plano vencido" },
  { value: "NO_PLAN", label: "Sem plano" },
]

const LIMIT = 30

export default function AlunosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background p-8">
          <div className="mx-auto max-w-7xl">
            <TableSkeleton rows={8} columns={5} />
          </div>
        </div>
      }
    >
      <AlunosContent />
    </Suspense>
  )
}

function AlunosContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAdmin = useIsAdmin()

  const statusParam = (searchParams.get("status") ?? "ALL").toUpperCase() as MemberFilter
  const status = FILTERS.some((f) => f.value === statusParam) ? statusParam : "ALL"
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const q = searchParams.get("q") ?? ""

  const [members, setMembers] = useState<GymMember[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState(q)
  const [planFor, setPlanFor] = useState<GymMember | null>(null)
  const [creating, setCreating] = useState(searchParams.get("novo") === "1")

  const setUrl = useCallback(
    (u: { status?: MemberFilter; page?: number; q?: string }) => {
      const sp = new URLSearchParams()
      const s = u.status ?? status
      const p = u.page ?? page
      const query = u.q ?? q
      if (s !== "ALL") sp.set("status", s)
      if (p > 1) sp.set("page", String(p))
      if (query.trim()) sp.set("q", query.trim())
      const qs = sp.toString()
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
    },
    [router, pathname, status, page, q]
  )

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const res = await getGymMembers({ status, search: q, page, limit: LIMIT })
      setMembers(res.members)
      setPagination(res.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos")
    } finally {
      setLoading(false)
    }
  }, [status, q, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== q) setUrl({ q: searchTerm, page: 1 })
    }, 400)
    return () => clearTimeout(t)
  }, [searchTerm, q, setUrl])

  const replaceMember = (m: GymMember) => setMembers((prev) => prev.map((x) => (x.id === m.id ? m : x)))

  const act = async (fn: () => Promise<{ member: GymMember }>, okMsg: string) => {
    try {
      const res = await fn()
      replaceMember(res.member)
      toast.success(okMsg)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  const quickCheckIn = async (m: GymMember) => {
    try {
      const res = await createCheckIn(m.id)
      replaceMember(res.member)
      toast.success(res.alreadyCheckedIn ? `${m.name} já tinha presença há pouco` : `Presença de ${m.name} registrada ✅`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar presença")
    }
  }

  const actions = (m: GymMember) => {
    const st = effectiveStatus(m)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ações">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => quickCheckIn(m)}>
            <UserCheck className="h-4 w-4" /> Registrar presença
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPlanFor(m)}>
            <CalendarClock className="h-4 w-4" /> Matricular / renovar
          </DropdownMenuItem>
          {whatsappLink(m.phone, m.name) && (
            <DropdownMenuItem asChild>
              <a href={whatsappLink(m.phone, m.name, m.daysToPlanExpiry !== null && m.daysToPlanExpiry <= 5 ? "plan" : "miss") ?? undefined} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={`/academia/alunos/${m.id}`}>
              <Pencil className="h-4 w-4" /> Ver ficha / editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {st === "INACTIVE" ? (
            <DropdownMenuItem onClick={() => act(() => reactivateGymMember(m.id), `${m.name} reativado`)}>
              <RotateCcw className="h-4 w-4" /> Reativar aluno
            </DropdownMenuItem>
          ) : (
            isAdmin && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => act(() => deactivateGymMember(m.id), `${m.name} desativado`)}
              >
                <UserX className="h-4 w-4" /> Desativar aluno
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AcademiaPageHeader
          title="Alunos"
          subtitle="Status atualizado automaticamente pela frequência de cada aluno."
          actions={
            <Button onClick={() => setCreating(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Novo aluno
            </Button>
          }
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setUrl({ status: f.value, page: 1 })}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  status === f.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF ou telefone"
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : members.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum aluno encontrado neste filtro.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop */}
            <Card className="hidden overflow-hidden rounded-2xl shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const st = effectiveStatus(m)
                    const plan = planLabel(m)
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Link href={`/academia/alunos/${m.id}`} className="font-medium hover:underline">{m.name}</Link>
                          <p className="text-xs text-muted-foreground">{m.phone ? formatPhone(m.phone) : "Sem telefone"}</p>
                        </TableCell>
                        <TableCell>
                          <MemberStatusBadge status={st} />
                          {st === "INACTIVE" && m.deactivatedAt && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {m.deactivationReason === "MANUAL" ? "Manual" : "Automático"} em {formatDateBR(m.deactivatedAt)}
                            </p>
                          )}
                          {!m.autoControl && <p className="mt-1 text-[11px] text-muted-foreground">Sem controle automático</p>}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-sm", st === "AT_RISK" && "font-medium text-amber-700")}>
                            {lastCheckInLabel(m)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{m.planName ?? "—"}</p>
                          <ToneText tone={plan.tone}>{plan.text}</ToneText>
                        </TableCell>
                        <TableCell>{actions(m)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile */}
            <div className="space-y-3 md:hidden">
              {members.map((m) => {
                const st = effectiveStatus(m)
                const plan = planLabel(m)
                return (
                  <Card key={m.id} className="rounded-xl shadow-sm">
                    <CardContent className="flex items-start gap-3 p-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">{m.name}</p>
                          <MemberStatusBadge status={st} />
                        </div>
                        <p className="text-xs text-muted-foreground">{lastCheckInLabel(m)}</p>
                        <p className="text-xs">
                          {m.planName ? `${m.planName} · ` : ""}
                          <ToneText tone={plan.tone}>{plan.text}</ToneText>
                        </p>
                      </div>
                      {actions(m)}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {pagination.total} aluno(s) · página {pagination.page} de {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!pagination.hasPrev} onClick={() => setUrl({ page: page - 1 })}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={!pagination.hasNext} onClick={() => setUrl({ page: page + 1 })}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <MembershipDialog
        member={planFor}
        open={planFor !== null}
        onOpenChange={(o) => !o && setPlanFor(null)}
        onSaved={replaceMember}
      />
      <MemberFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSaved={(m) => router.push(`/academia/alunos/${m.id}`)}
      />
    </div>
  )
}
