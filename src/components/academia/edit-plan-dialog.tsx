"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ActiveToggle } from "@/components/ui/active-toggle"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateGymMember, type GymMember } from "@/lib/api"

const PLAN_SUGGESTIONS = ["Mensal", "Trimestral", "Semestral", "Anual"]
const PLAN_MONTHS: Record<string, number> = { Mensal: 1, Trimestral: 3, Semestral: 6, Anual: 12 }

function addMonthsYmd(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function EditPlanDialog({
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
  const [planName, setPlanName] = useState("")
  const [planExpiresAt, setPlanExpiresAt] = useState("")
  const [autoControl, setAutoControl] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (member && open) {
      setPlanName(member.planName ?? "")
      setPlanExpiresAt(member.planExpiresAt ?? "")
      setAutoControl(member.autoControl)
    }
  }, [member, open])

  const pickPlan = (name: string) => {
    setPlanName(name)
    const months = PLAN_MONTHS[name]
    if (months) setPlanExpiresAt(addMonthsYmd(months))
  }

  const save = async () => {
    if (!member) return
    try {
      setSaving(true)
      const res = await updateGymMember(member.id, {
        planName: planName.trim() || null,
        planExpiresAt: planExpiresAt || null,
        autoControl,
      })
      toast.success("Plano salvo")
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
          <DialogTitle>Plano de {member?.name}</DialogTitle>
          <DialogDescription>
            Com o vencimento preenchido, o sistema avisa antes de vencer e quando vencer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Plano (renovar a partir de hoje)</Label>
            <div className="flex flex-wrap gap-2">
              {PLAN_SUGGESTIONS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={planName === p ? "default" : "outline"}
                  onClick={() => pickPlan(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Ex.: Mensal, Musculação 3x" maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-exp">Vence em</Label>
            <Input id="plan-exp" type="date" value={planExpiresAt} onChange={(e) => setPlanExpiresAt(e.target.value)} />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Controle automático</p>
              <p className="text-xs text-muted-foreground">
                Desligue para alunos especiais (ex.: viajando, lesionado) que não devem ser desativados sozinhos.
              </p>
            </div>
            <ActiveToggle checked={autoControl} onCheckedChange={setAutoControl} aria-label="Controle automático" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
