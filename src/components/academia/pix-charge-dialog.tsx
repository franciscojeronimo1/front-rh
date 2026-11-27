"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2, Copy, Loader2, MessageCircle, QrCode, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { chargeGymPix, getGymPixStatus, type GymPayment, type GymPixCharge } from "@/lib/api"
import { formatDateBR, formatMoney, formatTimeBR, isPastIso, whatsappTextLink } from "@/lib/academia/format"

/** Confere o pagamento a cada 5s enquanto o modal está aberto (para depois de 15 min). */
const POLL_MS = 5000
const POLL_MAX_MS = 15 * 60 * 1000

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement("textarea")
    el.value = text
    el.style.position = "fixed"
    el.style.opacity = "0"
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand("copy")
    el.remove()
    return ok
  }
}

export function pixWhatsappMessage(name: string, charge: GymPixCharge) {
  const firstName = name.trim().split(/\s+/)[0] ?? name
  const exp = charge.pix?.expiresAt ? ` (válido até ${formatDateBR(charge.pix.expiresAt)} às ${formatTimeBR(charge.pix.expiresAt)})` : ""
  return (
    `Oi ${firstName}! Segue o Pix da sua mensalidade da academia: ${formatMoney(charge.amount)}, vencimento ${formatDateBR(charge.dueDate)}.\n\n` +
    `É só copiar o código abaixo e colar no app do banco, em Pix > Copia e Cola${exp}:\n\n${charge.pix?.qrCode ?? ""}\n\nObrigado! 💪`
  )
}

export function PixChargeDialog({
  open,
  onOpenChange,
  payment,
  member,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: GymPayment | null
  member: { name: string; phone: string | null }
  onPaid: () => void
}) {
  const [charge, setCharge] = useState<GymPixCharge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const startedAt = useRef(0)
  const paidNotified = useRef(false)

  const generate = useCallback(async () => {
    if (!payment) return
    setLoading(true)
    setError("")
    try {
      const res = await chargeGymPix(payment.id)
      setCharge(res)
      startedAt.current = Date.now()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o Pix")
    } finally {
      setLoading(false)
    }
  }, [payment])

  // Ao abrir: gera ou reaproveita a cobrança ativa
  useEffect(() => {
    if (!open) return
    paidNotified.current = false
    setCharge(null)
    const t = setTimeout(() => void generate(), 0)
    return () => clearTimeout(t)
  }, [open, generate])

  const paid = charge?.paymentStatus === "PAID"

  // Polling leve enquanto aberto e pendente
  useEffect(() => {
    if (!open || !payment || !charge || paid || charge.paymentStatus !== "PENDING") return
    const t = setInterval(async () => {
      if (Date.now() - startedAt.current > POLL_MAX_MS) return clearInterval(t)
      try {
        const s = await getGymPixStatus(payment.id)
        setCharge((c) => (c ? { ...c, ...s, pix: s.pix ?? c.pix } : s))
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }, POLL_MS)
    return () => clearInterval(t)
  }, [open, payment, charge, paid])

  useEffect(() => {
    if (paid && !paidNotified.current) {
      paidNotified.current = true
      toast.success("Pix recebido! Mensalidade paga.")
      onPaid()
    }
  }, [paid, onPaid])

  const code = charge?.pix?.qrCode ?? ""
  const expired = isPastIso(charge?.pix?.expiresAt)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="pix-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" /> Cobrar via Pix
          </DialogTitle>
          <DialogDescription>
            {payment
              ? `${member.name} · ${formatMoney(charge?.amount ?? payment.amount)} · vence ${formatDateBR(payment.dueDate)}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !charge && (
          <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" /> Gerando Pix no Mercado Pago...
          </div>
        )}

        {paid && (
          <div className="flex flex-col items-center gap-2 py-8 text-center" data-testid="pix-paid">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-lg font-semibold">Pagamento confirmado</p>
            <p className="text-sm text-muted-foreground">
              A mensalidade foi baixada automaticamente{charge?.paidAt ? ` em ${formatDateBR(charge.paidAt)} às ${formatTimeBR(charge.paidAt)}` : ""}.
            </p>
          </div>
        )}

        {charge && !paid && charge.pix && (
          <div className="space-y-4">
            {charge.pix.qrCodeBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${charge.pix.qrCodeBase64}`}
                alt="QR Code Pix"
                className="mx-auto h-56 w-56 rounded-lg border bg-white p-2"
                data-testid="pix-qr"
              />
            ) : null}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Pix copia e cola</p>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  value={code}
                  rows={3}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 resize-none rounded-md border bg-muted/40 p-2 font-mono text-[11px] leading-tight"
                  data-testid="pix-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto shrink-0"
                  onClick={async () => {
                    if (await copyText(code)) toast.success("Código Pix copiado")
                    else toast.error("Não foi possível copiar. Selecione o código e copie manualmente.")
                  }}
                >
                  <Copy className="mr-1.5 h-4 w-4" /> Copiar
                </Button>
              </div>
            </div>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {expired ? (
                <span className="text-red-600">Este Pix expirou. Gere um novo.</span>
              ) : (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando pagamento
                  {charge.pix.expiresAt ? ` · válido até ${formatDateBR(charge.pix.expiresAt)} ${formatTimeBR(charge.pix.expiresAt)}` : ""}
                </>
              )}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {charge && !paid && charge.pix && (
            <>
              {expired && (
                <Button variant="outline" onClick={() => void generate()} disabled={loading}>
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Gerar novo Pix
                </Button>
              )}
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href={whatsappTextLink(member.phone, pixWhatsappMessage(member.name, charge))} target="_blank" rel="noopener noreferrer" data-testid="pix-whatsapp">
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Enviar no WhatsApp
                </a>
              </Button>
            </>
          )}
          {error && !charge && (
            <Button variant="outline" onClick={() => void generate()} disabled={loading}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Tentar de novo
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
