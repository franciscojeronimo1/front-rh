"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronRight, MessageCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { GymDashboardFinance } from "@/lib/api"
import { formatDateBR, formatMoney, whatsappLink } from "@/lib/academia/format"
import { cn } from "@/lib/utils"

/** Lista curta de inadimplentes (mensalidades vencidas e não pagas), com link para a ficha do aluno. */
export function DebtorsCard({ finance }: { finance: GymDashboardFinance }) {
  const { debtors, debtorsCount, overdueAmount } = finance
  return (
    <Card className="rounded-2xl shadow-sm" data-testid="debtors-card">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-lg">Inadimplentes</CardTitle>
          <CardDescription>
            {debtorsCount === 0
              ? "Mensalidades vencidas e não pagas"
              : `${debtorsCount} aluno${debtorsCount === 1 ? "" : "s"} devendo ${formatMoney(overdueAmount)}`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {debtors.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="font-medium">Ninguém em atraso</p>
            <p className="text-sm text-muted-foreground">Todas as mensalidades vencidas foram pagas.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {debtors.map((d) => {
              const wa = whatsappLink(d.phone, d.name)
              return (
                <li key={d.memberId} className="flex items-center gap-3 py-3">
                  <Link href={`/academia/alunos/${d.memberId}`} className="group flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-800">
                      {d.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover:underline">{d.name}</p>
                      <p className="text-xs text-red-700">
                        {d.daysLate} dia{d.daysLate === 1 ? "" : "s"} de atraso · venceu {formatDateBR(d.oldestDueDate)}
                        {d.payments > 1 ? ` · ${d.payments} mensalidades` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-900">{formatMoney(d.amount)}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                  {wa && (
                    <Button asChild size="icon" variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50" title="Chamar no WhatsApp">
                      <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Chamar ${d.name} no WhatsApp`}>
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {debtorsCount > debtors.length && (
          <p className="pt-3 text-center text-xs text-muted-foreground">
            Mostrando os {debtors.length} com mais atraso de {debtorsCount}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

type ChartMode = "revenue" | "members"

/** Gráfico de barras simples (sem biblioteca): receita ou entrada/saída de alunos nos últimos meses. */
export function MonthlyChartCard({ finance }: { finance: GymDashboardFinance }) {
  const [mode, setMode] = useState<ChartMode>("revenue")
  const points = finance.monthly
  const maxRevenue = Math.max(1, ...points.map((p) => p.revenue))
  const maxMembers = Math.max(1, ...points.map((p) => Math.max(p.newMembers, p.deactivated)))
  const BAR_AREA = 140

  return (
    <Card className="rounded-2xl shadow-sm" data-testid="monthly-chart">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-lg">Últimos {points.length} meses</CardTitle>
          <CardDescription>
            {mode === "revenue" ? "Mensalidades pagas por mês" : "Alunos novos e desativados por mês"}
          </CardDescription>
        </div>
        <div className="flex shrink-0 rounded-lg border p-0.5 text-xs">
          {(
            [
              ["revenue", "Receita"],
              ["members", "Alunos"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 sm:gap-4" style={{ height: BAR_AREA + 44 }}>
          {points.map((p) => (
            <div key={p.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              {mode === "revenue" ? (
                <>
                  <span className="truncate text-[11px] font-medium text-slate-600">
                    {p.revenue > 0 ? formatMoney(p.revenue).replace(/,\d{2}$/, "") : "—"}
                  </span>
                  <div
                    className="w-full max-w-12 rounded-t-md bg-emerald-500/80"
                    style={{ height: Math.max(4, (p.revenue / maxRevenue) * BAR_AREA) }}
                    title={`${p.label}: ${formatMoney(p.revenue)} (${p.paymentsPaid} pagamento(s))`}
                  />
                </>
              ) : (
                <>
                  <span className="text-[11px] font-medium text-slate-600">
                    <span className="text-blue-700">+{p.newMembers}</span>{" "}
                    <span className="text-slate-500">−{p.deactivated}</span>
                  </span>
                  <div className="flex w-full max-w-12 items-end gap-1">
                    <div
                      className="flex-1 rounded-t-md bg-blue-500/80"
                      style={{ height: Math.max(4, (p.newMembers / maxMembers) * BAR_AREA) }}
                      title={`${p.label}: ${p.newMembers} novo(s)`}
                    />
                    <div
                      className="flex-1 rounded-t-md bg-slate-400/80"
                      style={{ height: Math.max(4, (p.deactivated / maxMembers) * BAR_AREA) }}
                      title={`${p.label}: ${p.deactivated} desativado(s)`}
                    />
                  </div>
                </>
              )}
              <span className="text-[11px] text-muted-foreground">{p.label}</span>
            </div>
          ))}
        </div>
        {mode === "members" && (
          <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500/80" /> Novos</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-400/80" /> Desativados</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
