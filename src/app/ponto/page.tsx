"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useRequirePremium } from "@/hooks/useRequirePremium"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  startTimeRecord,
  stopTimeRecord,
  getTimeSummary,
  getTimeRecords,
  type TimeSummary,
  type TimeRecordDaySummary,
} from "@/lib/api"
import {
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Timer,
  History,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PontoPage() {
  const router = useRouter()
  const { isPremium, isLoading: isLoadingPremium } = useRequirePremium()
  const [summary, setSummary] = useState<TimeSummary | null>(null)
  const [byDay, setByDay] = useState<TimeRecordDaySummary[]>([])
  const [historyMonth, setHistoryMonth] = useState(() => format(new Date(), "yyyy-MM"))
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
      }
    }
  }, [router])

  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true)
      const [summaryData, monthData] = await Promise.all([
        getTimeSummary(),
        getTimeRecords({ month: historyMonth }),
      ])
      setSummary(summaryData.summary)
      setByDay(monthData.byDay ?? [])
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    } finally {
      setIsLoadingData(false)
    }
  }, [historyMonth])

  useEffect(() => {
    if (isPremium && !isLoadingPremium) {
      loadData()
      const handleFocus = () => loadData()
      window.addEventListener("focus", handleFocus)
      return () => window.removeEventListener("focus", handleFocus)
    }
  }, [isPremium, isLoadingPremium, loadData])

  if (isLoadingPremium || !isPremium) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleStart = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await startTimeRecord()
      setSuccess("Trabalho iniciado com sucesso!")
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar trabalho")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await stopTimeRecord()
      setSuccess("Trabalho encerrado com sucesso!")
      setSummary(response.summary)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao encerrar trabalho")
    } finally {
      setIsLoading(false)
    }
  }

  const isWorking = summary?.status === "started"

  const byDaySorted = [...byDay].sort((a, b) => b.date.localeCompare(a.date))

  const historyMonthLabel = (() => {
    try {
      const raw = historyMonth.slice(0, 7) + "-01T12:00:00"
      const label = format(parseISO(raw), "MMMM 'de' yyyy", { locale: ptBR })
      return label.charAt(0).toUpperCase() + label.slice(1)
    } catch {
      return historyMonth
    }
  })()

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-6">
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

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Clock className="w-8 h-8 text-primary" />
                Bater Ponto
              </h1>
              <p className="text-muted-foreground">
                Registre sua entrada e saída a qualquer momento
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Hoje</p>
                <p className="text-lg font-semibold text-foreground">
                  {summary?.date ? format(parseISO(summary.date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR }) : format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <Button
                onClick={loadData}
                disabled={isLoadingData}
                variant="outline"
                size="icon"
                className="h-10 w-10"
                title="Atualizar dados"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingData ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-success/10 border-success/20">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">{success}</AlertDescription>
          </Alert>
        )}

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Status Atual</CardTitle>
            <CardDescription>
              {isWorking
                ? "Você está trabalhando no momento"
                : "Você não está trabalhando no momento"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <div
                className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 transition-all ${
                  isWorking
                    ? "border-success bg-success/10 animate-pulse"
                    : "border-muted bg-muted/10"
                }`}
              >
                <div
                  className={`text-4xl font-bold ${
                    isWorking ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {isWorking ? (
                    <div className="flex flex-col items-center gap-2">
                      <Timer className="w-12 h-12" />
                      <span className="text-sm">Trabalhando</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Square className="w-12 h-12" />
                      <span className="text-sm">Parado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleStart}
                disabled={isLoading || isWorking}
                size="lg"
                className="h-16 text-lg font-semibold flex-1 sm:flex-initial sm:min-w-[200px] hover:cursor-pointer"
                variant={isWorking ? "secondary" : "default"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2 hover:cursor-pointer" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2 hover:cursor-pointer" />
                    Iniciar Trabalho
                  </>
                )}
              </Button>

              <Button
                onClick={handleStop}
                disabled={isLoading || !isWorking}
                size="lg"
                variant="destructive"
                className="h-16 text-lg font-semibold flex-1 sm:flex-initial sm:min-w-[200px] hover:cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Square className="h-5 w-5 mr-2" />
                    Encerrar Trabalho
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Resumo do Dia
              </CardTitle>
              <CardDescription>Total de horas trabalhadas hoje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="text-center py-6 flex-shrink-0">
                <div className="text-5xl font-bold text-primary mb-2">
                  {summary?.totalHours || "0:00"}
                </div>
                <p className="text-muted-foreground">
                  {summary?.totalMinutes
                    ? `${summary.totalMinutes} minutos`
                    : "0 minutos"}
                </p>
              </div>

              {summary && summary.periods.length > 0 && (
                <div className="flex-1 min-h-0 flex flex-col">
                  <p className="text-sm font-semibold text-foreground mb-3 flex-shrink-0">
                    Períodos trabalhados:
                  </p>
                  <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2">
                    {summary.periods.map((period, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 flex-shrink-0"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {period.start} - {period.stop || "..."}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(period.minutes / 60)}h {period.minutes % 60}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!summary || summary.periods.length === 0) && (
                <p className="text-center text-muted-foreground py-4 flex-shrink-0">
                  Nenhum período registrado hoje
                </p>
              )}
            </CardContent>
          </Card>

          {/* Histórico do mês (byDay) */}
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Histórico do mês
              </CardTitle>
            
              <div className="pt-2 space-y-2">
                <Label htmlFor="ponto-history-month" className="text-muted-foreground">
                  Mês
                </Label>
                <Input
                  id="ponto-history-month"
                  type="month"
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  className="max-w-[220px]"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col">
              {byDaySorted.length > 0 ? (
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                  {byDaySorted.map((day) => (
                    <div
                      key={day.date}
                      className="rounded-md border bg-card p-4 flex-shrink-0 space-y-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium text-foreground capitalize">
                          {format(parseISO(day.date + "T12:00:00"), "EEEE, dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                        <div className="text-right">
                          <p className="font-mono text-lg font-semibold text-primary">
                            {day.totalHours}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {day.totalMinutes} min
                          </p>
                        </div>
                      </div>
                      {day.periods.length > 0 && (
                        <ul className="text-sm text-muted-foreground space-y-1 border-t border-border/60 pt-2">
                          {day.periods.map((period, index) => (
                            <li
                              key={`${day.date}-${index}`}
                              className="flex flex-wrap justify-between gap-x-4 gap-y-0.5"
                            >
                              <span>
                                {period.start} – {period.stop || "…"}
                              </span>
                              <span className="font-mono tabular-nums">
                                {Math.floor(period.minutes / 60)}h {period.minutes % 60}m
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 flex-shrink-0">
                  <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Nenhum dia com período registrado neste mês
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

