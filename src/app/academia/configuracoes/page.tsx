"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { getGymSettings, updateGymSettings, type GymSettings } from "@/lib/api"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { MercadoPagoCard } from "@/components/academia/mercado-pago-card"
import { formatRelative } from "@/lib/academia/format"

type Form = Omit<GymSettings, "id" | "organizationId" | "lastEvaluatedAt">

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ActiveToggle checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </div>
  )
}

function DaysRow({
  title,
  description,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  title: string
  description: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="w-20 text-center"
          disabled={disabled}
        />
        <span className="text-sm text-muted-foreground">dias</span>
      </div>
    </div>
  )
}

export default function ConfiguracoesAcademiaPage() {
  const isAdmin = useIsAdmin()
  const [form, setForm] = useState<Form | null>(null)
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    getGymSettings()
      .then(({ settings }) => {
        const { id: _id, organizationId: _org, lastEvaluatedAt: last, ...rest } = settings
        void _id
        void _org
        setForm(rest)
        setLastEvaluatedAt(last)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar configurações"))
  }, [])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => (f ? { ...f, [key]: value } : f))

  const invalid =
    !!form &&
    (!Number.isFinite(form.atRiskAfterDays) ||
      !Number.isFinite(form.inactiveAfterDays) ||
      !Number.isFinite(form.planExpiringNoticeDays) ||
      !Number.isFinite(form.planExpiredGraceDays) ||
      form.inactiveAfterDays <= form.atRiskAfterDays)

  const save = async () => {
    if (!form || invalid) return
    try {
      setSaving(true)
      await updateGymSettings(form)
      toast.success("Configurações salvas. O sistema já vai usar as novas regras.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const readOnly = !isAdmin

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <AcademiaPageHeader
          title="Regras automáticas"
          subtitle="Defina uma vez e o sistema cuida do resto. Os padrões já funcionam bem para a maioria das academias."
          actions={
            isAdmin ? (
              <Button onClick={save} disabled={saving || invalid}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            ) : undefined
          }
        />

        {readOnly && (
          <Alert>
            <AlertDescription>Somente administradores podem alterar estas regras.</AlertDescription>
          </Alert>
        )}

        {lastEvaluatedAt && (
          <p className="text-sm text-muted-foreground">Última análise automática {formatRelative(lastEvaluatedAt)}.</p>
        )}

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Frequência</CardTitle>
            <CardDescription>Quando o aluno para de vir, o sistema age sozinho.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <DaysRow
              title="Marcar como “em risco” após"
              description="Você recebe um aviso para chamar o aluno de volta."
              value={form.atRiskAfterDays}
              onChange={(v) => set("atRiskAfterDays", v)}
              min={1}
              max={180}
              disabled={readOnly}
            />
            <ToggleRow
              title="Desativar automaticamente"
              description="Tira da lista de ativos quem sumiu por muito tempo."
              checked={form.autoDeactivate}
              onChange={(v) => set("autoDeactivate", v)}
              disabled={readOnly}
            />
            <DaysRow
              title="Desativar após"
              description="Precisa ser maior que o prazo de “em risco”."
              value={form.inactiveAfterDays}
              onChange={(v) => set("inactiveAfterDays", v)}
              min={2}
              max={365}
              disabled={readOnly || !form.autoDeactivate}
            />
            <ToggleRow
              title="Reativar sozinho quando o aluno voltar"
              description="Ao registrar presença, o aluno inativo volta a ficar ativo."
              checked={form.autoReactivateOnCheckIn}
              onChange={(v) => set("autoReactivateOnCheckIn", v)}
              disabled={readOnly}
            />
            <ToggleRow
              title="Avisar quando um aluno ficar em risco"
              description="Desligue se preferir receber só os avisos de desativação."
              checked={form.notifyAtRisk}
              onChange={(v) => set("notifyAtRisk", v)}
              disabled={readOnly}
            />
            {form.inactiveAfterDays <= form.atRiskAfterDays && (
              <p className="pt-3 text-sm font-medium text-red-600">
                O prazo para desativar precisa ser maior que o prazo de “em risco”.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Planos e vencimentos</CardTitle>
            <CardDescription>Funciona para alunos com data de vencimento preenchida.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y pt-0">
            <DaysRow
              title="Avisar antes de vencer"
              description="Quantos dias antes do vencimento você quer ser avisado."
              value={form.planExpiringNoticeDays}
              onChange={(v) => set("planExpiringNoticeDays", v)}
              min={0}
              max={60}
              disabled={readOnly}
            />
            <ToggleRow
              title="Desativar quando o plano vencer"
              description="Desativa o aluno se o plano continuar vencido depois da carência."
              checked={form.deactivateOnPlanExpired}
              onChange={(v) => set("deactivateOnPlanExpired", v)}
              disabled={readOnly}
            />
            <DaysRow
              title="Carência após o vencimento"
              description="Dias de tolerância antes de desativar por plano vencido."
              value={form.planExpiredGraceDays}
              onChange={(v) => set("planExpiredGraceDays", v)}
              min={0}
              max={90}
              disabled={readOnly || !form.deactivateOnPlanExpired}
            />
          </CardContent>
        </Card>

        {isAdmin && <MercadoPagoCard />}
      </div>
    </div>
  )
}
