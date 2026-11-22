"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Pencil, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ActiveToggle } from "@/components/ui/active-toggle"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  createMembershipPlan,
  getMembershipPlans,
  updateMembershipPlan,
  type MembershipPlan,
} from "@/lib/api"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import { formatMoney, planDurationLabel } from "@/lib/academia/format"

const PRESETS = [
  { name: "Mensal", months: 1 },
  { name: "Trimestral", months: 3 },
  { name: "Semestral", months: 6 },
  { name: "Anual", months: 12 },
]

interface Form {
  name: string
  description: string
  price: string
  durationMonths: string
  durationDays: string
  active: boolean
}

const EMPTY: Form = { name: "", description: "", price: "", durationMonths: "1", durationDays: "0", active: true }

export default function PlanosPage() {
  const isAdmin = useIsAdmin()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<MembershipPlan | "new" | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setError("")
      const res = await getMembershipPlans()
      setPlans(res.plans)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar planos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const open = (p: MembershipPlan | "new") => {
    setForm(
      p === "new"
        ? EMPTY
        : {
            name: p.name,
            description: p.description ?? "",
            price: String(p.price).replace(".", ","),
            durationMonths: String(p.durationMonths),
            durationDays: String(p.durationDays),
            active: p.active,
          }
    )
    setEditing(p)
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    const price = Number(form.price.replace(",", "."))
    const months = parseInt(form.durationMonths || "0", 10)
    const days = parseInt(form.durationDays || "0", 10)
    if (!form.name.trim() || !Number.isFinite(price) || price < 0) {
      toast.error("Informe nome e valor do plano")
      return
    }
    if (!(months + days > 0)) {
      toast.error("O plano precisa ter duração (meses ou dias)")
      return
    }
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price,
      durationMonths: months,
      durationDays: days,
      active: form.active,
    }
    try {
      setSaving(true)
      if (editing === "new") await createMembershipPlan(data)
      else if (editing) await updateMembershipPlan(editing.id, data)
      toast.success("Plano salvo")
      setEditing(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <AcademiaPageHeader
          title="Planos"
          subtitle="Os planos que a academia vende. Usados na matrícula e na renovação dos alunos."
          actions={
            isAdmin ? (
              <Button onClick={() => open("new")}>
                <Plus className="mr-2 h-4 w-4" /> Novo plano
              </Button>
            ) : undefined
          }
        />

        {!isAdmin && (
          <Alert>
            <AlertDescription>Somente administradores podem criar ou alterar planos.</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : plans.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum plano cadastrado ainda.
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Situação</TableHead>
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((p) => (
                  <TableRow key={p.id} className={p.active ? "" : "opacity-60"}>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    </TableCell>
                    <TableCell>{planDurationLabel(p.durationMonths, p.durationDays)}</TableCell>
                    <TableCell>{formatMoney(p.price)}</TableCell>
                    <TableCell className="text-sm">{p.active ? "Ativo" : "Desativado"}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => open(p)} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Novo plano" : "Editar plano"}</DialogTitle>
            <DialogDescription>Mudar o valor não altera matrículas já feitas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editing === "new" && (
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p.name}
                    type="button"
                    size="sm"
                    variant={form.name === p.name ? "default" : "outline"}
                    onClick={() => setForm((f) => ({ ...f, name: p.name, durationMonths: String(p.months), durationDays: "0" }))}
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-price">Valor (R$)</Label>
                <Input id="p-price" inputMode="decimal" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-months">Meses</Label>
                <Input id="p-months" type="number" min={0} max={36} value={form.durationMonths} onChange={(e) => set("durationMonths", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-days">Dias</Label>
                <Input id="p-days" type="number" min={0} max={365} value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Descrição (opcional)</Label>
              <Input id="p-desc" value={form.description} onChange={(e) => set("description", e.target.value)} maxLength={300} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Plano ativo (aparece na matrícula)</p>
              <ActiveToggle checked={form.active} onCheckedChange={(v) => set("active", v)} aria-label="Ativo" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
