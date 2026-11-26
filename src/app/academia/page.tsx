"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Settings2,
  Sparkles,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getGymDashboard,
  markNotificationRead,
  runGymEvaluation,
  type GymDashboard,
} from "@/lib/api"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { NotificationItem } from "@/components/academia/notification-item"
import { NOTIFICATIONS_CHANGED_EVENT } from "@/components/academia/notification-bell"
import { formatDateBR, formatRelative, lastCheckInLabel, whatsappLink } from "@/lib/academia/format"
import { cn } from "@/lib/utils"

const WEEKDAY = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function Kpi({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  href,
}: {
  label: string
  value: number
  caption: string
  icon: typeof Activity
  tone: "emerald" | "amber" | "slate" | "blue" | "red"
  href?: string
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  }
  const content = (
    <Card className="h-full rounded-2xl border-slate-200/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{caption}</p>
      </CardContent>
    </Card>
  )
  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  )
}

export default function AcademiaPainelPage() {
  const isAdmin = useIsAdmin()
  const [data, setData] = useState<GymDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [evaluating, setEvaluating] = useState(false)

  const load = useCallback(async () => {
    try {
      setError("")
      const res = await getGymDashboard()
      setData(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o painel")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleEvaluate = async () => {
    try {
      setEvaluating(true)
      const { summary } = await runGymEvaluation()
      const parts = [
        summary.becameAtRisk ? `${summary.becameAtRisk} em risco` : null,
        summary.deactivated ? `${summary.deactivated} desativado(s)` : null,
        summary.backToActive ? `${summary.backToActive} voltaram a ativo` : null,
      ].filter(Boolean)
      toast.success(parts.length ? `Análise feita: ${parts.join(", ")}` : "Análise feita: nenhuma mudança")
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar")
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="mx-auto max-w-3xl space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => { setLoading(true); void load() }}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (!data) return null
  const t = data.totals
  const maxDay = Math.max(1, ...data.checkInsByDay.map((d) => d.count))

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <AcademiaPageHeader
          title="Painel da academia"
          subtitle="O sistema acompanha seus alunos sozinho. Você só age quando aparecer um aviso."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/academia/alunos?novo=1">
                  <UserPlus className="mr-2 h-4 w-4" /> Novo aluno
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/academia/checkin">
                  <UserCheck className="mr-2 h-5 w-5" /> Registrar presença
                </Link>
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Alunos ativos" value={t.active} caption="Treinando normalmente" icon={Activity} tone="emerald" href="/academia/alunos?status=ACTIVE" />
          <Kpi label="Em risco" value={t.atRisk} caption={`${data.rules.atRiskAfterDays}+ dias sem treinar`} icon={AlertTriangle} tone="amber" href="/academia/alunos?status=AT_RISK" />
          <Kpi label="Desativados no mês" value={t.deactivatedThisMonth} caption={`${t.inactive} inativos no total`} icon={UserX} tone="slate" href="/academia/alunos?status=INACTIVE" />
          <Kpi label="Presenças hoje" value={t.checkInsToday} caption={`${t.checkInsWeek} nos últimos 7 dias`} icon={UserCheck} tone="blue" href="/academia/checkin" />
        </div>

        {(t.plansExpiringSoon > 0 || t.plansExpired > 0 || t.paymentsOverdue > 0) && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.plansExpiringSoon > 0 && (
              <Link href="/academia/alunos?status=PLAN_EXPIRING" className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 hover:bg-blue-100">
                <CalendarClock className="h-5 w-5 shrink-0" />
                <span><strong>{t.plansExpiringSoon}</strong> plano(s) vencendo nos próximos dias</span>
              </Link>
            )}
            {t.plansExpired > 0 && (
              <Link href="/academia/alunos?status=PLAN_EXPIRED" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 hover:bg-red-100">
                <CalendarClock className="h-5 w-5 shrink-0" />
                <span><strong>{t.plansExpired}</strong> aluno(s) ativo(s) com plano vencido</span>
              </Link>
            )}
            {t.paymentsOverdue > 0 && (
              <Link href="/academia/alunos" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 hover:bg-amber-100">
                <CalendarClock className="h-5 w-5 shrink-0" />
                <span><strong>{t.paymentsOverdue}</strong> mensalidade(s) atrasada(s)</span>
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="rounded-2xl shadow-sm lg:col-span-3">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-lg">Precisam de atenção</CardTitle>
                <CardDescription>Alunos sumidos. Uma mensagem agora pode evitar o cancelamento.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/academia/alunos?status=AT_RISK">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.atRiskMembers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="font-medium">Nenhum aluno em risco 🎉</p>
                  <p className="text-sm text-muted-foreground">Todo mundo está treinando em dia.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {data.atRiskMembers.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-800">
                        {m.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.name}</p>
                        <p className="text-xs text-amber-700">{lastCheckInLabel(m)}</p>
                      </div>
                      {whatsappLink(m.phone, m.name) && (
                        <Button asChild size="sm" variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                          <a href={whatsappLink(m.phone, m.name) ?? undefined} target="_blank" rel="noopener noreferrer">
                            <MessageCircle className="mr-1.5 h-4 w-4" /> Chamar
                          </a>
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Frequência da semana</CardTitle>
                <CardDescription>Presenças por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-36 items-end gap-2">
                  {data.checkInsByDay.map((d) => {
                    const date = new Date(`${d.date}T12:00:00`)
                    return (
                      <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-600">{d.count}</span>
                        <div
                          className="w-full rounded-t-md bg-primary/80"
                          style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}px` }}
                          title={`${formatDateBR(d.date)}: ${d.count} presença(s)`}
                        />
                        <span className="text-[11px] text-muted-foreground">{WEEKDAY[date.getDay()]}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <CardTitle className="text-lg">Últimos avisos</CardTitle>
                  <CardDescription>{t.unreadNotifications} não lido(s)</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/academia/avisos">Ver todos</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-1 px-3">
                {data.recentNotifications.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum aviso por enquanto.</p>
                ) : (
                  data.recentNotifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      compact
                      onClick={async () => {
                        if (n.readAt) return
                        await markNotificationRead(n.id).catch(() => {})
                        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
                        void load()
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Automático: em risco após <strong>{data.rules.atRiskAfterDays} dias</strong>
              {data.rules.autoDeactivate ? (
                <> e desativa após <strong>{data.rules.inactiveAfterDays} dias</strong> sem treinar.</>
              ) : (
                <>. Desativação automática desligada.</>
              )}{" "}
              Última análise: {data.lastEvaluatedAt ? formatRelative(data.lastEvaluatedAt) : "ainda não rodou"}.
            </span>
          </p>
          {isAdmin && (
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={handleEvaluate} disabled={evaluating}>
                {evaluating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                Analisar agora
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/academia/configuracoes">
                  <Settings2 className="mr-1.5 h-4 w-4" /> Regras
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
