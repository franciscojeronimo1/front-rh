"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Check, Loader2, Search, Undo2, UserCheck, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  createCheckIn,
  deleteCheckIn,
  getCheckIns,
  getGymMembers,
  type GymCheckIn,
  type GymMember,
} from "@/lib/api"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { MemberStatusBadge, ToneText } from "@/components/academia/member-status-badge"
import { NOTIFICATIONS_CHANGED_EVENT } from "@/components/academia/notification-bell"
import { ACCESS_METHOD_LABEL, effectiveStatus, formatTimeBR, lastCheckInLabel, planLabel } from "@/lib/academia/format"
import { formatCpf } from "@/lib/schemas/client"
import { cn } from "@/lib/utils"

const DEBOUNCE_MS = 250

export default function CheckInPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<GymMember[]>([])
  const [searching, setSearching] = useState(false)
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [justRegistered, setJustRegistered] = useState<string | null>(null)
  const [today, setToday] = useState<GymCheckIn[]>([])
  const [loadingToday, setLoadingToday] = useState(true)

  const loadToday = useCallback(async () => {
    try {
      const res = await getCheckIns()
      setToday(res.checkIns)
    } catch {
      /* mantém lista atual */
    } finally {
      setLoadingToday(false)
    }
  }, [])

  useEffect(() => {
    void loadToday()
    inputRef.current?.focus()
  }, [loadToday])

  useEffect(() => {
    const term = search.trim()
    if (term.length < 2) {
      setResults([])
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await getGymMembers({ search: term, limit: 8 })
        if (!cancelled) setResults(res.members)
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [search])

  const register = async (member: GymMember) => {
    try {
      setRegisteringId(member.id)
      const res = await createCheckIn(member.id)
      if (res.alreadyCheckedIn) {
        toast.info(`${member.name} já tinha presença registrada há pouco.`)
      } else if (res.reactivated) {
        toast.success(`${member.name} voltou! Presença registrada e aluno reativado 🎉`)
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
      } else {
        toast.success(`Presença de ${member.name} registrada ✅`)
      }
      if (res.member.daysToPlanExpiry !== null && res.member.daysToPlanExpiry < 0) {
        toast.warning(`Atenção: o plano de ${member.name} está vencido.`)
      }
      setJustRegistered(member.id)
      setTimeout(() => setJustRegistered(null), 2500)
      setSearch("")
      setResults([])
      inputRef.current?.focus()
      void loadToday()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar a presença")
    } finally {
      setRegisteringId(null)
    }
  }

  const undo = async (c: GymCheckIn) => {
    try {
      await deleteCheckIn(c.id)
      toast.success("Presença removida")
      void loadToday()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover")
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && results.length === 1 && !registeringId) {
      e.preventDefault()
      void register(results[0]!)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <AcademiaPageHeader
          title="Registrar presença"
          subtitle="Digite o nome, CPF, telefone ou senha da catraca do aluno e toque em Registrar."
        />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar aluno..."
                className="h-14 rounded-xl pl-12 text-lg shadow-sm"
                autoComplete="off"
                aria-label="Buscar aluno"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {search.trim().length >= 2 && !searching && results.length === 0 && (
              <Card className="rounded-xl">
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum aluno encontrado para “{search}”.</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/academia/alunos?novo=1">
                      <UserPlus className="mr-2 h-4 w-4" /> Cadastrar novo aluno
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {results.map((m) => {
                const status = effectiveStatus(m)
                const plan = planLabel(m)
                return (
                  <Card
                    key={m.id}
                    className={cn(
                      "rounded-xl shadow-sm transition-colors",
                      justRegistered === m.id && "border-emerald-400 bg-emerald-50"
                    )}
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold">{m.name}</p>
                          <MemberStatusBadge status={status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {m.cpf ? `CPF ${formatCpf(m.cpf)} · ` : ""}{lastCheckInLabel(m)}
                        </p>
                        <p className="mt-0.5 text-xs">
                          {m.planName ? <span className="text-slate-600">{m.planName} · </span> : null}
                          <ToneText tone={plan.tone}>{plan.text}</ToneText>
                        </p>
                      </div>
                      <Button
                        size="lg"
                        className="h-12 shrink-0 sm:w-44"
                        onClick={() => register(m)}
                        disabled={registeringId !== null}
                      >
                        {registeringId === m.id ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <UserCheck className="mr-2 h-5 w-5" />
                        )}
                        {status === "INACTIVE" ? "Registrar e reativar" : "Registrar"}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {search.trim().length < 2 && (
              <p className="px-1 text-sm text-muted-foreground">
                Dica: se aparecer só um aluno na busca, é só apertar <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Enter</kbd>.
              </p>
            )}
          </div>

          <Card className="rounded-2xl shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Check className="h-5 w-5 text-emerald-600" /> Presenças de hoje
              </CardTitle>
              <CardDescription>{today.filter((c) => c.result === "GRANTED" && c.direction === "IN").length} presença(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingToday ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
              ) : today.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Ninguém registrou presença ainda hoje.</p>
              ) : (
                <ul className="max-h-[60vh] divide-y overflow-y-auto">
                  {today.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-12 shrink-0 font-mono text-sm text-muted-foreground">
                        {formatTimeBR(c.occurredAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {c.member?.name ?? "Não identificado"}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {ACCESS_METHOD_LABEL[c.method] ?? c.method}
                          {c.result === "DENIED" ? ` · negado${c.reason ? `: ${c.reason}` : ""}` : ""}
                        </span>
                      </span>
                      {c.method === "MANUAL" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground"
                        title="Desfazer (registrado por engano)"
                        onClick={() => undo(c)}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
