"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  CalendarClock,
  Check,
  KeyRound,
  MessageCircle,
  Pencil,
  RotateCcw,
  UserCheck,
  UserX,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  cancelGymPayment,
  cancelMembership,
  createCheckIn,
  deactivateGymMember,
  getGymMember,
  getMemberPayments,
  getMemberships,
  payGymPayment,
  reactivateGymMember,
  type GymCheckIn,
  type GymMember,
  type GymPayment,
  type Membership,
  type PaymentMethod,
} from "@/lib/api"
import { MemberStatusBadge, ToneText } from "@/components/academia/member-status-badge"
import { MemberFormDialog } from "@/components/academia/member-form-dialog"
import { MembershipDialog } from "@/components/academia/membership-dialog"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import {
  ACCESS_METHOD_LABEL,
  formatDateBR,
  formatMoney,
  formatTimeBR,
  lastCheckInLabel,
  PAYMENT_METHOD_LABEL,
  planLabel,
  whatsappLink,
} from "@/lib/academia/format"
import { formatCpf, formatPhone } from "@/lib/schemas/client"

type RecentCheckIn = Pick<GymCheckIn, "id" | "occurredAt" | "method" | "direction" | "result" | "reason">

const PAYMENT_STATUS: Record<GymPayment["status"], { label: string; tone: "ok" | "warn" | "danger" | "none" }> = {
  PAID: { label: "Pago", tone: "ok" },
  PENDING: { label: "Pendente", tone: "warn" },
  CANCELLED: { label: "Cancelado", tone: "none" },
}

export default function AlunoDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const isAdmin = useIsAdmin()

  const [member, setMember] = useState<GymMember | null>(null)
  const [checkIns, setCheckIns] = useState<RecentCheckIn[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [payments, setPayments] = useState<GymPayment[]>([])
  const [error, setError] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [detail, ms, ps] = await Promise.all([getGymMember(id), getMemberships(id), getMemberPayments(id)])
      setError("")
      setMember(detail.member)
      setCheckIns(detail.recentCheckIns)
      setMemberships(ms.memberships)
      setPayments(ps.payments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar aluno")
    }
  }, [id])

  useEffect(() => {
    const t = setTimeout(() => void load(), 0)
    return () => clearTimeout(t)
  }, [load])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn()
      toast.success(ok)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro")
    }
  }

  if (error && !member) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/academia/alunos">Voltar</Link>
        </Button>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  const plan = planLabel(member)
  const wa = whatsappLink(member.phone, member.name, member.daysToPlanExpiry !== null && member.daysToPlanExpiry <= 5 ? "plan" : "miss")

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <Link href="/academia/alunos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Alunos
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{member.name}</h1>
              <MemberStatusBadge status={member.memberStatus} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lastCheckInLabel(member)}
              {member.memberStatus === "INACTIVE" && member.deactivatedAt
                ? ` · desativado ${member.deactivationReason === "MANUAL" ? "manualmente" : "automaticamente"} em ${formatDateBR(member.deactivatedAt)}`
                : ""}
              {!member.autoControl ? " · sem controle automático" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run(() => createCheckIn(member.id), "Presença registrada")}>
              <UserCheck className="mr-2 h-4 w-4" /> Registrar presença
            </Button>
            <Button variant="outline" onClick={() => setPlanOpen(true)}>
              <CalendarClock className="mr-2 h-4 w-4" /> Matricular / renovar
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
            {wa && (
              <Button variant="outline" asChild className="border-emerald-300 text-emerald-700">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
            )}
            {member.memberStatus === "INACTIVE" ? (
              <Button variant="outline" onClick={() => run(() => reactivateGymMember(member.id), "Aluno reativado")}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reativar
              </Button>
            ) : (
              isAdmin && (
                <Button variant="outline" className="text-red-600" onClick={() => run(() => deactivateGymMember(member.id), "Aluno desativado")}>
                  <UserX className="mr-2 h-4 w-4" /> Desativar
                </Button>
              )
            )}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Cadastro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                <KeyRound className="h-4 w-4" /> Senha da catraca:{" "}
                <span className="font-mono text-base font-semibold">{member.accessCode ?? "—"}</span>
              </p>
              <p>WhatsApp: {member.phone ? formatPhone(member.phone) : "—"}</p>
              <p>CPF: {member.cpf ? formatCpf(member.cpf) : "—"}</p>
              <p>Email: {member.email || "—"}</p>
              <p>Nascimento: {formatDateBR(member.birthDate)}</p>
              {member.notes && <p className="text-muted-foreground">Obs.: {member.notes}</p>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Plano</CardTitle>
              <CardDescription>
                {member.planName ? `${member.planName} · ` : ""}
                <ToneText tone={plan.tone}>{plan.text}</ToneText>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma matrícula ainda.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {memberships.map((ms) => (
                    <li key={ms.id} className="flex items-center gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className={ms.status === "CANCELLED" ? "line-through text-muted-foreground" : "font-medium"}>
                          {ms.planName} · {formatMoney(ms.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateBR(ms.startDate)} até {formatDateBR(ms.endDate)}
                          {ms.status === "CANCELLED" ? " · cancelada" : ""}
                        </p>
                      </div>
                      {isAdmin && ms.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => window.confirm("Cancelar esta matrícula?") && run(() => cancelMembership(ms.id), "Matrícula cancelada")}
                        >
                          <X className="mr-1 h-4 w-4" /> Cancelar
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Mensalidades</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma mensalidade.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {payments.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {formatMoney(p.amount)} · vence {formatDateBR(p.dueDate)}
                        </p>
                        <p className="text-xs">
                          <ToneText tone={PAYMENT_STATUS[p.status].tone}>{PAYMENT_STATUS[p.status].label}</ToneText>
                          {p.status === "PAID" && p.paidAt
                            ? ` em ${formatDateBR(p.paidAt)}${p.method ? ` · ${PAYMENT_METHOD_LABEL[p.method]}` : ""}${p.receivedBy ? ` · ${p.receivedBy.name}` : ""}`
                            : ""}
                        </p>
                      </div>
                      {p.status === "PENDING" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm">
                              <Check className="mr-1 h-4 w-4" /> Dar baixa
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {Object.entries(PAYMENT_METHOD_LABEL).map(([k, label]) => (
                              <DropdownMenuItem
                                key={k}
                                onClick={() => run(() => payGymPayment(p.id, { method: k as PaymentMethod }), "Pagamento registrado")}
                              >
                                {label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {isAdmin && p.status !== "CANCELLED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => window.confirm("Cancelar esta mensalidade?") && run(() => cancelGymPayment(p.id), "Mensalidade cancelada")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Últimas passagens</CardTitle>
            </CardHeader>
            <CardContent>
              {checkIns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma presença registrada.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {checkIns.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                      <span>
                        {formatDateBR(c.occurredAt)} {formatTimeBR(c.occurredAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ACCESS_METHOD_LABEL[c.method] ?? c.method}
                        {c.result === "DENIED" ? " · negado" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MemberFormDialog member={member} open={editOpen} onOpenChange={setEditOpen} onSaved={() => void load()} />
      <MembershipDialog member={member} open={planOpen} onOpenChange={setPlanOpen} onSaved={() => void load()} />
    </div>
  )
}
