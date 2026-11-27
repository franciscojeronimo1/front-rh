import { authenticatedFetch, authenticatedFetchWithRetry } from "./http"
import type { PaginationInfo } from "./types"

export type MemberStatus = "ACTIVE" | "AT_RISK" | "INACTIVE"
export type MemberFilter = "ALL" | "ACTIVE" | "AT_RISK" | "INACTIVE" | "PLAN_EXPIRING" | "PLAN_EXPIRED" | "NO_PLAN"
export type PaymentMethod = "CASH" | "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "TRANSFER" | "OTHER"
export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED"
export type AccessMethod = "MANUAL" | "PASSWORD" | "FINGERPRINT" | "CARD"
export type DeactivationReason = "AUTO_ABSENCE" | "AUTO_PLAN_EXPIRED" | "MANUAL"
export type GymNotificationType =
  | "MEMBER_AT_RISK"
  | "MEMBER_DEACTIVATED"
  | "MEMBER_REACTIVATED"
  | "PLAN_EXPIRING"
  | "PLAN_EXPIRED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_ISSUE"

export interface GymSettings {
  id: string
  organizationId: string
  atRiskAfterDays: number
  inactiveAfterDays: number
  autoDeactivate: boolean
  autoReactivateOnCheckIn: boolean
  planExpiringNoticeDays: number
  deactivateOnPlanExpired: boolean
  planExpiredGraceDays: number
  notifyAtRisk: boolean
  lastEvaluatedAt: string | null
}

export type UpdateGymSettingsRequest = Partial<
  Omit<GymSettings, "id" | "organizationId" | "lastEvaluatedAt">
>

export interface GymMember {
  id: string
  name: string
  cpf: string | null
  phone: string | null
  email?: string | null
  /** YYYY-MM-DD */
  birthDate?: string | null
  /** Só vem no detalhe/cadastro (senha numérica da catraca) */
  accessCode?: string | null
  notes?: string | null
  memberStatus: MemberStatus
  lastCheckInAt: string | null
  activeSince: string | null
  createdAt: string
  planName: string | null
  /** YYYY-MM-DD */
  planExpiresAt: string | null
  autoControl: boolean
  statusChangedAt: string | null
  deactivatedAt: string | null
  deactivationReason: DeactivationReason | null
  daysAbsent: number
  daysToPlanExpiry: number | null
}

export interface GymNotification {
  id: string
  type: GymNotificationType
  title: string
  message: string
  memberId: string | null
  readAt: string | null
  createdAt: string
  member?: { id: string; name: string; phone: string | null; memberStatus: MemberStatus } | null
}

export interface GymDashboard {
  lastEvaluatedAt: string | null
  rules: { atRiskAfterDays: number; inactiveAfterDays: number; autoDeactivate: boolean }
  totals: {
    active: number
    atRisk: number
    inactive: number
    deactivatedThisMonth: number
    newThisMonth: number
    checkInsToday: number
    checkInsWeek: number
    plansExpiringSoon: number
    plansExpired: number
    paymentsOverdue: number
    unreadNotifications: number
  }
  checkInsByDay: { date: string; count: number }[]
  atRiskMembers: GymMember[]
  recentNotifications: GymNotification[]
  /** Só vem para administradores (dono). */
  finance: GymDashboardFinance | null
}

export interface GymDebtor {
  memberId: string
  name: string
  phone: string | null
  memberStatus: MemberStatus
  amount: number
  payments: number
  oldestDueDate: string
  daysLate: number
}

export interface GymMonthlyPoint {
  month: string
  label: string
  revenue: number
  paymentsPaid: number
  newMembers: number
  deactivated: number
}

export interface GymDashboardFinance {
  revenueThisMonth: number
  paymentsPaidThisMonth: number
  openAmount: number
  openCount: number
  overdueAmount: number
  overdueCount: number
  debtorsCount: number
  debtors: GymDebtor[]
  monthly: GymMonthlyPoint[]
}

export interface GymCheckIn {
  id: string
  memberId: string | null
  occurredAt: string
  method: AccessMethod
  direction: "IN" | "OUT"
  result: "GRANTED" | "DENIED"
  reason?: string | null
  member?: { id: string; name: string; memberStatus: MemberStatus; planName: string | null } | null
  user?: { id: string; name: string } | null
}

export interface MembershipPlan {
  id: string
  name: string
  description: string | null
  price: number
  durationMonths: number
  durationDays: number
  active: boolean
  _count?: { memberships: number }
}

export interface Membership {
  id: string
  memberId: string
  planId: string | null
  planName: string
  price: number
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  status: "ACTIVE" | "CANCELLED"
  notes: string | null
  createdAt: string
}

export interface GymPayment {
  id: string
  memberId: string
  membershipId: string | null
  amount: number
  /** YYYY-MM-DD */
  dueDate: string
  status: PaymentStatus
  method: PaymentMethod | null
  paidAt: string | null
  notes: string | null
  receivedBy?: { id: string; name: string } | null
  /** Cobrança Pix (Mercado Pago): pending | approved | cancelled | ... */
  pixStatus?: string | null
  pixExpiresAt?: string | null
}

export interface GymPixCharge {
  paymentId: string
  paymentStatus: PaymentStatus
  amount: number
  dueDate: string
  paidAt: string | null
  reused?: boolean
  enabled?: boolean
  pix: {
    id: string
    status: string | null
    qrCode: string | null
    qrCodeBase64: string | null
    ticketUrl: string | null
    expiresAt: string | null
  } | null
}

export interface MemberInput {
  name?: string
  cpf?: string | null
  phone?: string | null
  email?: string | null
  birthDate?: string | null
  notes?: string | null
  accessCode?: string | null
  autoControl?: boolean
}

export interface CheckInResult {
  checkIn: GymCheckIn
  member: GymMember
  alreadyCheckedIn: boolean
  reactivated: boolean
}

export interface EvaluationSummary {
  evaluated: number
  becameAtRisk: number
  deactivated: number
  backToActive: number
  notificationsCreated: number
}

async function json<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise
  return res.json() as Promise<T>
}

export function getGymSettings() {
  return json<{ settings: GymSettings }>(authenticatedFetchWithRetry("/gym/settings"))
}

export function updateGymSettings(data: UpdateGymSettingsRequest) {
  return json<{ message: string; settings: GymSettings }>(
    authenticatedFetch("/gym/settings", { method: "PUT", body: JSON.stringify(data) })
  )
}

export function runGymEvaluation() {
  return json<{ message: string; summary: EvaluationSummary }>(
    authenticatedFetch("/gym/evaluate", { method: "POST" })
  )
}

export function getGymDashboard() {
  return json<GymDashboard>(authenticatedFetchWithRetry("/gym/dashboard", {}, 45000))
}

export function getGymMembers(params: {
  status?: MemberFilter
  search?: string
  page?: number
  limit?: number
}) {
  const sp = new URLSearchParams()
  if (params.status && params.status !== "ALL") sp.set("status", params.status)
  if (params.search?.trim()) sp.set("search", params.search.trim())
  if (params.page) sp.set("page", String(params.page))
  if (params.limit) sp.set("limit", String(params.limit))
  const qs = sp.toString()
  return json<{ members: GymMember[]; pagination: PaginationInfo }>(
    authenticatedFetchWithRetry(`/gym/members${qs ? `?${qs}` : ""}`)
  )
}

export function getGymMember(id: string) {
  return json<{
    member: GymMember
    recentCheckIns: Pick<GymCheckIn, "id" | "occurredAt" | "method" | "direction" | "result" | "reason">[]
    credentials: { id: string; type: "PASSWORD" | "FINGERPRINT" | "CARD"; label: string | null; active: boolean }[]
  }>(authenticatedFetch(`/gym/members/${id}`))
}

export function createGymMember(data: MemberInput & { name: string; planId?: string; startDate?: string }) {
  return json<{ message: string; member: GymMember }>(
    authenticatedFetch("/gym/members", { method: "POST", body: JSON.stringify(data) })
  )
}

export function updateGymMember(id: string, data: MemberInput) {
  return json<{ message: string; member: GymMember }>(
    authenticatedFetch(`/gym/members/${id}`, { method: "PATCH", body: JSON.stringify(data) })
  )
}

export function deactivateGymMember(id: string) {
  return json<{ message: string; member: GymMember }>(
    authenticatedFetch(`/gym/members/${id}/deactivate`, { method: "POST" })
  )
}

export function reactivateGymMember(id: string) {
  return json<{ message: string; member: GymMember }>(
    authenticatedFetch(`/gym/members/${id}/reactivate`, { method: "POST" })
  )
}

export function createCheckIn(memberId: string) {
  return json<CheckInResult>(
    authenticatedFetch("/gym/checkins", { method: "POST", body: JSON.stringify({ memberId }) })
  )
}

export function getCheckIns(date?: string) {
  return json<{ checkIns: GymCheckIn[]; total: number }>(
    authenticatedFetchWithRetry(`/gym/checkins${date ? `?date=${date}` : ""}`)
  )
}

export function deleteCheckIn(id: string) {
  return json<{ message: string }>(authenticatedFetch(`/gym/checkins/${id}`, { method: "DELETE" }))
}

export function getGymNotifications(params: { unreadOnly?: boolean; page?: number; limit?: number } = {}) {
  const sp = new URLSearchParams()
  if (params.unreadOnly) sp.set("unreadOnly", "true")
  if (params.page) sp.set("page", String(params.page))
  if (params.limit) sp.set("limit", String(params.limit))
  const qs = sp.toString()
  return json<{ notifications: GymNotification[]; unreadCount: number; pagination: PaginationInfo }>(
    authenticatedFetch(`/gym/notifications${qs ? `?${qs}` : ""}`)
  )
}

export function getUnreadNotificationsCount() {
  return json<{ unreadCount: number }>(authenticatedFetch("/gym/notifications/unread-count"))
}

export function markNotificationRead(id: string) {
  return json<{ updated: number }>(authenticatedFetch(`/gym/notifications/${id}/read`, { method: "POST" }))
}

export function markAllNotificationsRead() {
  return json<{ updated: number }>(authenticatedFetch("/gym/notifications/read-all", { method: "POST" }))
}

// ---------- Planos ----------

export function getMembershipPlans(onlyActive = false) {
  return json<{ plans: MembershipPlan[] }>(
    authenticatedFetchWithRetry(`/gym/plans${onlyActive ? "?active=true" : ""}`)
  )
}

export type MembershipPlanInput = Pick<MembershipPlan, "name" | "price" | "durationMonths" | "durationDays" | "active"> & {
  description?: string | null
}

export function createMembershipPlan(data: MembershipPlanInput) {
  return json<{ message: string; plan: MembershipPlan }>(
    authenticatedFetch("/gym/plans", { method: "POST", body: JSON.stringify(data) })
  )
}

export function updateMembershipPlan(id: string, data: Partial<MembershipPlanInput>) {
  return json<{ message: string; plan: MembershipPlan }>(
    authenticatedFetch(`/gym/plans/${id}`, { method: "PUT", body: JSON.stringify(data) })
  )
}

// ---------- Matrículas e mensalidades ----------

export interface CreateMembershipRequest {
  planId?: string
  planName?: string
  price?: number
  startDate?: string
  endDate?: string
  paid?: boolean
  paymentMethod?: PaymentMethod
  notes?: string | null
}

export function getMemberships(memberId: string) {
  return json<{ memberships: Membership[] }>(authenticatedFetch(`/gym/members/${memberId}/memberships`))
}

export function createMembership(memberId: string, data: CreateMembershipRequest) {
  return json<{ membership: Membership; member: GymMember; reactivated: boolean }>(
    authenticatedFetch(`/gym/members/${memberId}/memberships`, { method: "POST", body: JSON.stringify(data) })
  )
}

export function cancelMembership(membershipId: string) {
  return json<{ message: string; member: GymMember }>(
    authenticatedFetch(`/gym/memberships/${membershipId}/cancel`, { method: "POST" })
  )
}

export function getMemberPayments(memberId: string) {
  return json<{ payments: GymPayment[]; pixEnabled?: boolean }>(authenticatedFetch(`/gym/members/${memberId}/payments`))
}

export function payGymPayment(paymentId: string, data: { method: PaymentMethod; amount?: number }) {
  return json<{ message: string; payment: GymPayment }>(
    authenticatedFetch(`/gym/payments/${paymentId}/pay`, { method: "POST", body: JSON.stringify(data) })
  )
}

/** Gera (ou reaproveita) a cobrança Pix de uma mensalidade pendente. */
export function chargeGymPix(paymentId: string) {
  return json<GymPixCharge>(authenticatedFetch(`/gym/payments/${paymentId}/pix`, { method: "POST" }))
}

/** Situação da cobrança Pix (o servidor confere no Mercado Pago se ainda estiver pendente). */
export function getGymPixStatus(paymentId: string) {
  return json<GymPixCharge>(authenticatedFetch(`/gym/payments/${paymentId}/pix`))
}

export function cancelGymPayment(paymentId: string) {
  return json<{ message: string; payment: GymPayment }>(
    authenticatedFetch(`/gym/payments/${paymentId}/cancel`, { method: "POST" })
  )
}

/* ------------------------------ Importação de alunos ------------------------------ */

export type ImportField =
  | "name"
  | "cpf"
  | "phone"
  | "phone2"
  | "email"
  | "birthDate"
  | "accessCode"
  | "externalCode"
  | "rg"
  | "gender"
  | "address"
  | "district"
  | "city"
  | "state"
  | "zip"
  | "status"
  | "planName"
  | "planPrice"
  | "planStart"
  | "memberSince"
  | "planEnd"
  | "notes"

export type ImportMapping = Partial<Record<ImportField, number | null>>

export interface ImportRequest {
  file: string
  fileName?: string
  headerRow?: number
  mapping?: ImportMapping
  duplicates?: "skip" | "update"
  createPlans?: boolean
  importInactive?: boolean
}

export type ImportRowAction = "create" | "update" | "skip" | "error"

export interface ImportPreviewRow {
  line: number
  action: ImportRowAction
  errors: string[]
  warnings: string[]
  existingMemberId?: string
  data: {
    name: string
    cpf: string | null
    phone: string | null
    email: string | null
    birthDate: string | null
    accessCode: string | null
    status: "ACTIVE" | "INACTIVE"
    planName: string | null
    planPrice: number | null
    planStart: string | null
    planEnd: string | null
    notes: string | null
  }
}

export interface ImportPreview {
  file: { format: "csv" | "xlsx" | "xls"; encoding: string | null; delimiter: string | null; sheetName: string | null; totalLines: number }
  headerRow: number
  columns: { index: number; header: string; samples: string[] }[]
  mapping: ImportMapping
  fields: { key: ImportField; label: string; required: boolean }[]
  options: { duplicates: "skip" | "update"; createPlans: boolean; importInactive: boolean }
  summary: { total: number; create: number; update: number; skip: number; error: number; withWarnings: number; withPlan: number }
  rows: ImportPreviewRow[]
}

export interface ImportResult {
  message: string
  summary: {
    total: number
    created: number
    updated: number
    skipped: number
    errors: number
    failed: number
    memberships: number
    plansCreated: string[]
    importedOn: string
  }
  results: { line: number; action: ImportRowAction | "failed"; memberId?: string; name: string; message?: string }[]
  rows: ImportPreviewRow[]
}

export function previewMemberImport(data: ImportRequest) {
  return json<ImportPreview>(
    authenticatedFetch("/gym/members/import/preview", { method: "POST", body: JSON.stringify(data) })
  )
}

export function importMembers(data: ImportRequest) {
  return json<ImportResult>(authenticatedFetch("/gym/members/import", { method: "POST", body: JSON.stringify(data) }))
}

export interface MercadoPagoStatus {
  /** O servidor tem a aplicação do Mercado Pago configurada (dá para conectar). */
  available: boolean
  connected: boolean
  /** Sem conta conectada, o Pix usa o token global de teste do servidor. */
  testMode: boolean
  pixEnabled: boolean
  needsReconnect: boolean
  account: {
    userId: string | null
    nickname: string | null
    email: string | null
    liveMode: boolean | null
    connectedAt: string | null
    expiresAt: string | null
    lastError: string | null
  } | null
}

export function getMercadoPagoStatus() {
  return json<MercadoPagoStatus>(authenticatedFetch("/gym/mercadopago"))
}

/** Devolve a URL do Mercado Pago para o dono autorizar (o navegador vai para lá). */
export function startMercadoPagoConnect() {
  return json<{ url: string }>(authenticatedFetch("/gym/mercadopago/authorize", { method: "POST" }))
}

export function disconnectMercadoPago() {
  return json<{ message: string }>(authenticatedFetch("/gym/mercadopago/disconnect", { method: "POST" }))
}
