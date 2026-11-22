import type { GymMember, MemberStatus } from "@/lib/api"

export const MEMBER_STATUS_LABEL: Record<MemberStatus, string> = {
  ACTIVE: "Ativo",
  AT_RISK: "Em risco",
  INACTIVE: "Inativo",
}

export function effectiveStatus(member: Pick<GymMember, "memberStatus">): MemberStatus {
  return member.memberStatus
}

export function formatDateBR(value: string | null | undefined): string {
  if (!value) return "—"
  // Datas "YYYY-MM-DD" (sem hora) são exibidas como estão, sem conversão de fuso
  const ymd = /^\d{4}-\d{2}-\d{2}$/.exec(value)
  if (ymd) {
    const [y, m, d] = value.split("-")
    return `${d}/${m}/${y}`
  }
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
      new Date(value)
    )
  } catch {
    return "—"
  }
}

export function formatTimeBR(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value))
  } catch {
    return "—"
  }
}

export function formatRelative(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "agora"
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.round(h / 24)
  return d === 1 ? "ontem" : `há ${d} dias`
}

export function lastCheckInLabel(member: Pick<GymMember, "lastCheckInAt" | "daysAbsent">): string {
  if (!member.lastCheckInAt) return "Nunca registrou presença"
  if (member.daysAbsent === 0) return "Treinou hoje"
  if (member.daysAbsent === 1) return "Treinou ontem"
  return `${member.daysAbsent} dias sem treinar`
}

export function planLabel(member: Pick<GymMember, "planExpiresAt" | "daysToPlanExpiry">): {
  text: string
  tone: "ok" | "warn" | "danger" | "none"
} {
  if (!member.planExpiresAt || member.daysToPlanExpiry === null) return { text: "Sem vencimento", tone: "none" }
  const d = member.daysToPlanExpiry
  if (d < 0) return { text: `Venceu há ${-d} dia${-d === 1 ? "" : "s"}`, tone: "danger" }
  if (d === 0) return { text: "Vence hoje", tone: "warn" }
  if (d <= 5) return { text: `Vence em ${d} dia${d === 1 ? "" : "s"}`, tone: "warn" }
  return { text: `Até ${formatDateBR(member.planExpiresAt)}`, tone: "ok" }
}

/** Link para abrir conversa no WhatsApp com mensagem pronta (o dono só confirma o envio). */
export function whatsappLink(phone: string | null | undefined, name: string, kind: "miss" | "plan" = "miss"): string | null {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (digits.length < 10) return null
  const full = digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`
  const firstName = name.trim().split(/\s+/)[0] ?? name
  const text =
    kind === "plan"
      ? `Oi ${firstName}! Tudo bem? Passando para lembrar que seu plano da academia está vencendo. Quer renovar? 💪`
      : `Oi ${firstName}! Sentimos sua falta na academia 💪 Está tudo bem? Bora voltar a treinar essa semana?`
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  TRANSFER: "Transferência",
  OTHER: "Outro",
}

export const ACCESS_METHOD_LABEL: Record<string, string> = {
  MANUAL: "Recepção",
  PASSWORD: "Senha",
  FINGERPRINT: "Digital",
  CARD: "Cartão",
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function planDurationLabel(months: number, days: number): string {
  const parts: string[] = []
  if (months > 0) parts.push(`${months} ${months === 1 ? "mês" : "meses"}`)
  if (days > 0) parts.push(`${days} ${days === 1 ? "dia" : "dias"}`)
  return parts.join(" e ") || "—"
}
