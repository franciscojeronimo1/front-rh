"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createGymMember,
  getMembershipPlans,
  updateGymMember,
  type GymMember,
  type MembershipPlan,
} from "@/lib/api"
import { digitsOnly, formatCpf, formatPhone } from "@/lib/schemas/client"
import { formatMoney, planDurationLabel } from "@/lib/academia/format"

const NO_PLAN = "__none__"

interface FormState {
  name: string
  phone: string
  cpf: string
  email: string
  birthDate: string
  accessCode: string
  notes: string
  autoControl: boolean
  planId: string
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  cpf: "",
  email: "",
  birthDate: "",
  accessCode: "",
  notes: "",
  autoControl: true,
  planId: NO_PLAN,
}

/** Cadastro e edição de aluno. Sem `member` = novo aluno (com matrícula opcional). */
export function MemberFormDialog({
  member,
  open,
  onOpenChange,
  onSaved,
}: {
  member?: GymMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (member: GymMember) => void
}) {
  const isNew = !member
  const [form, setForm] = useState<FormState>(EMPTY)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    queueMicrotask(() =>
      setForm(
        member
          ? {
              name: member.name,
              phone: member.phone ? formatPhone(member.phone) : "",
              cpf: member.cpf ? formatCpf(member.cpf) : "",
              email: member.email ?? "",
              birthDate: member.birthDate ?? "",
              accessCode: member.accessCode ?? "",
              notes: member.notes ?? "",
              autoControl: member.autoControl,
              planId: NO_PLAN,
            }
          : EMPTY
      )
    )
    if (!member) {
      getMembershipPlans(true)
        .then((r) => setPlans(r.plans))
        .catch(() => setPlans([]))
    }
  }, [open, member])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (form.name.trim().length < 2) {
      toast.error("Informe o nome do aluno")
      return
    }
    const data = {
      name: form.name.trim(),
      phone: digitsOnly(form.phone) || null,
      cpf: digitsOnly(form.cpf) || null,
      email: form.email.trim() || null,
      birthDate: form.birthDate || null,
      notes: form.notes.trim() || null,
      autoControl: form.autoControl,
      // Em branco no cadastro: o sistema gera uma senha de 6 dígitos
      ...(form.accessCode.trim() ? { accessCode: digitsOnly(form.accessCode) } : {}),
    }
    try {
      setSaving(true)
      const res = isNew
        ? await createGymMember({ ...data, ...(form.planId !== NO_PLAN ? { planId: form.planId } : {}) })
        : await updateGymMember(member!.id, data)
      toast.success(isNew ? `Aluno cadastrado. Senha da catraca: ${res.member.accessCode ?? "-"}` : "Cadastro atualizado")
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo aluno" : `Editar ${member?.name}`}</DialogTitle>
          <DialogDescription>
            {isNew ? "Só o nome é obrigatório. O resto pode ser preenchido depois." : "Altere os dados do aluno."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="m-name">Nome *</Label>
            <Input id="m-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} autoFocus />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="m-phone">WhatsApp</Label>
              <Input id="m-phone" inputMode="tel" value={form.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} placeholder="(35) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-cpf">CPF</Label>
              <Input id="m-cpf" inputMode="numeric" value={form.cpf} onChange={(e) => set("cpf", formatCpf(e.target.value))} placeholder="000.000.000-00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-email">Email</Label>
              <Input id="m-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-birth">Nascimento</Label>
              <Input id="m-birth" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-code">Senha da catraca</Label>
            <Input
              id="m-code"
              inputMode="numeric"
              value={form.accessCode}
              onChange={(e) => set("accessCode", digitsOnly(e.target.value).slice(0, 8))}
              placeholder={isNew ? "Deixe em branco para gerar automaticamente" : ""}
            />
            <p className="text-xs text-muted-foreground">De 4 a 8 números. Não pode repetir entre alunos.</p>
          </div>
          {isNew && (
            <div className="space-y-2">
              <Label>Plano (opcional)</Label>
              <Select value={form.planId} onValueChange={(v) => set("planId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sem plano por enquanto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PLAN}>Sem plano por enquanto</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {formatMoney(p.price)} · {planDurationLabel(p.durationMonths, p.durationDays)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A matrícula começa hoje e a mensalidade fica pendente. Dá baixa na tela do aluno.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="m-notes">Observações</Label>
            <Input id="m-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Controle automático</p>
              <p className="text-xs text-muted-foreground">
                Desligue para alunos especiais (ex.: viajando, lesionado) que não devem ser desativados sozinhos.
              </p>
            </div>
            <ActiveToggle checked={form.autoControl} onCheckedChange={(v) => set("autoControl", v)} aria-label="Controle automático" />
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
