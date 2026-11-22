"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createMembership,
  getMembershipPlans,
  type GymMember,
  type MembershipPlan,
  type PaymentMethod,
} from "@/lib/api"
import { formatDateBR, formatMoney, PAYMENT_METHOD_LABEL, planDurationLabel } from "@/lib/academia/format"

const CUSTOM = "__custom__"

/** Matricular / renovar o plano do aluno (cria matrícula + mensalidade). */
export function MembershipDialog({
  member,
  open,
  onOpenChange,
  onSaved,
}: {
  member: GymMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (member: GymMember) => void
}) {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [planId, setPlanId] = useState("")
  const [customName, setCustomName] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [startDate, setStartDate] = useState("")
  const [paid, setPaid] = useState(true)
  const [method, setMethod] = useState<PaymentMethod>("PIX")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    queueMicrotask(() => {
      setStartDate("")
      setCustomName("")
      setCustomPrice("")
      setCustomEnd("")
      setPaid(true)
    })
    getMembershipPlans(true)
      .then((r) => {
        setPlans(r.plans)
        setPlanId(r.plans[0]?.id ?? CUSTOM)
      })
      .catch(() => {
        setPlans([])
        setPlanId(CUSTOM)
      })
  }, [open])

  const selected = plans.find((p) => p.id === planId)

  const save = async () => {
    if (!member) return
    const isCustom = planId === CUSTOM
    const price = Number(customPrice.replace(",", "."))
    if (isCustom && (!customName.trim() || !Number.isFinite(price) || !customEnd)) {
      toast.error("Informe nome, valor e vencimento do plano")
      return
    }
    try {
      setSaving(true)
      const res = await createMembership(member.id, {
        ...(isCustom ? { planName: customName.trim(), price, endDate: customEnd } : { planId }),
        ...(startDate ? { startDate } : {}),
        paid,
        ...(paid ? { paymentMethod: method } : {}),
      })
      toast.success(
        `Plano ${res.membership.planName} até ${formatDateBR(res.membership.endDate)}${res.reactivated ? " · aluno reativado" : ""}`
      )
      onSaved(res.member)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Matricular / renovar {member?.name}</DialogTitle>
          <DialogDescription>
            {member?.planExpiresAt
              ? `Plano atual vence em ${formatDateBR(member.planExpiresAt)}. A renovação começa no dia seguinte, se ainda estiver valendo.`
              : "O plano começa hoje, a não ser que você escolha outra data."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha o plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {formatMoney(p.price)} · {planDurationLabel(p.durationMonths, p.durationDays)}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM}>Outro (avulso)</SelectItem>
              </SelectContent>
            </Select>
            {plans.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum plano cadastrado. Cadastre em <Link href="/academia/planos" className="underline">Planos</Link>.
              </p>
            )}
          </div>
          {planId === CUSTOM && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="c-name">Nome</Label>
                <Input id="c-name" value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-price">Valor (R$)</Label>
                <Input id="c-price" inputMode="decimal" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="c-end">Vence em</Label>
                <Input id="c-end" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="ms-start">Início (opcional)</Label>
            <Input id="ms-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Já recebeu o pagamento?</p>
              <p className="text-xs text-muted-foreground">
                {selected ? formatMoney(selected.price) : "Valor informado acima"}. Se não, fica como mensalidade pendente.
              </p>
            </div>
            <ActiveToggle checked={paid} onCheckedChange={setPaid} aria-label="Pago" />
          </div>
          {paid && (
            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !planId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
