"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, ExternalLink, Link2, Loader2, QrCode, Unlink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { disconnectMercadoPago, getMercadoPagoStatus, startMercadoPagoConnect, type MercadoPagoStatus } from "@/lib/api"
import { formatDateBR } from "@/lib/academia/format"

const CALLBACK_ERRORS: Record<string, string> = {
  negado: "Você cancelou a autorização no Mercado Pago.",
  expirado: "O link de conexão expirou ou já foi usado. Clique em Conectar de novo.",
  token: "O Mercado Pago não confirmou a conexão. Tente de novo em alguns minutos.",
  indisponivel: "A conexão com o Mercado Pago ainda não está disponível no servidor.",
  mp: "O Mercado Pago devolveu um erro. Tente de novo.",
}

/** Card "Recebimento por Pix": conecta a conta Mercado Pago da academia (OAuth) para o Pix cair na conta dela. */
export function MercadoPagoCard() {
  const [status, setStatus] = useState<MercadoPagoStatus | null>(null)
  const [error, setError] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const load = useCallback(async () => {
    try {
      setError("")
      setStatus(await getMercadoPagoStatus())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o Mercado Pago")
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => void load(), 0)
    // Volta do Mercado Pago: ?mp=connected | ?mp=error&motivo=...
    const params = new URLSearchParams(window.location.search)
    const mp = params.get("mp")
    if (mp) {
      if (mp === "connected") toast.success("Mercado Pago conectado! O Pix das mensalidades agora cai na conta da academia.")
      else toast.error(CALLBACK_ERRORS[params.get("motivo") ?? ""] ?? CALLBACK_ERRORS.mp)
      params.delete("mp")
      params.delete("motivo")
      const qs = params.toString()
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`)
    }
    return () => clearTimeout(t)
  }, [load])

  const connect = async () => {
    try {
      setConnecting(true)
      const { url } = await startMercadoPagoConnect()
      window.location.href = url
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível iniciar a conexão")
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      setDisconnecting(true)
      await disconnectMercadoPago()
      toast.success("Mercado Pago desconectado")
      setConfirmOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao desconectar")
    } finally {
      setDisconnecting(false)
    }
  }

  const acc = status?.account
  return (
    <Card id="pix" className="scroll-mt-6 rounded-2xl shadow-sm" data-testid="mercadopago-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" /> Recebimento por Pix
        </CardTitle>
        <CardDescription>
          Conecte a conta Mercado Pago da academia para cobrar mensalidades por Pix. O dinheiro cai direto na conta de vocês e a
          mensalidade é baixada sozinha quando o aluno paga.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!status && !error && <Skeleton className="h-20 rounded-xl" />}

        {status && status.connected && acc && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-emerald-900" data-testid="mp-connected">
                  Conectado{acc.nickname ? ` à conta ${acc.nickname}` : ""}
                  {acc.liveMode === false ? " (conta de teste)" : ""}
                </p>
                <p className="text-emerald-800">
                  {acc.email ? `${acc.email} · ` : ""}
                  {acc.userId ? `ID ${acc.userId} · ` : ""}
                  desde {formatDateBR(acc.connectedAt)}
                </p>
              </div>
            </div>
            {status.needsReconnect && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {acc.lastError ?? "O acesso ao Mercado Pago expirou."} Enquanto isso, o Pix fica indisponível.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              {status.needsReconnect && (
                <Button onClick={connect} disabled={connecting || !status.available}>
                  {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  Conectar de novo
                </Button>
              )}
              <Button variant="outline" onClick={() => setConfirmOpen(true)} data-testid="mp-disconnect">
                <Unlink className="mr-2 h-4 w-4" /> Desconectar
              </Button>
            </div>
          </>
        )}

        {status && !status.connected && (
          <>
            {status.testMode && (
              <Alert>
                <AlertDescription>
                  Modo teste: o servidor está usando uma conta Mercado Pago de teste. Conecte a conta da academia para receber de
                  verdade.
                </AlertDescription>
              </Alert>
            )}
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Você vai entrar na sua conta Mercado Pago e autorizar o Sistema CGS.</li>
              <li>
                A conta precisa ter uma <strong>chave Pix cadastrada</strong> (app do Mercado Pago › Pix › Minhas chaves).
              </li>
              <li>Não guardamos sua senha. Você pode desconectar quando quiser.</li>
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={connect} disabled={connecting || !status.available} data-testid="mp-connect">
                {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                Conectar Mercado Pago
              </Button>
              {!status.available && (
                <span className="text-xs text-muted-foreground">Indisponível no momento (configuração do servidor pendente).</span>
              )}
            </div>
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Desconectar Mercado Pago"
        description="A academia deixa de cobrar por Pix até conectar de novo. Os Pix já enviados e ainda não pagos podem não ser baixados automaticamente."
        confirmLabel="Desconectar"
        onConfirm={disconnect}
        loading={disconnecting}
        destructive
      />
    </Card>
  )
}
