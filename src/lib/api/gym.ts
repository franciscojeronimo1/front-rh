import { authenticatedFetch, authenticatedFetchWithRetry } from "./http"
import type { PaginationInfo } from "./types"

export type MemberStatus = "ACTIVE" | "AT_RISK" | "INACTIVE"
export type MemberFilter = "ALL" | "ACTIVE" | "AT_RISK" | "INACTIVE" | "PLAN_EXPIRING" | "PLAN_EXPIRED"
export type DeactivationReason = "AUTO_ABSENCE" | "AUTO_PLAN_EXPIRED" | "MANUAL"
export type GymNotificationType =
  | "MEMBER_AT_RISK"
  | "MEMBER_DEACTIVATED"
  | "MEMBER_REACTIVATED"
  | "PLAN_EXPIRING"
  | "PLAN_EXPIRED"

export interface GymSettings {
  id: string
  organizationId: string
  enabled: boolean
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
  cpf: string
  phone: string
  email?: string | null
  active: boolean
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
  clientId: string | null
  readAt: string | null
  createdAt: string
  client?: { id: string; name: string; phone: string; memberStatus: MemberStatus } | null
}

export interface GymDashboard {
  enabled: boolean
  lastEvaluatedAt: string | null
  rules: { atRiskAfterDays: number; inactiveAfterDays: number; autoDeactivate: boolean }
  totals: {
    active: number
    atRisk: number
    inactive: number
    deactivatedThisMonth: number
    checkInsToday: number
    checkInsWeek: number
    plansExpiringSoon: number
    plansExpired: number
    unreadNotifications: number
  }
  checkInsByDay: { date: string; count: number }[]
  atRiskMembers: GymMember[]
  recentNotifications: GymNotification[]
}

export interface GymCheckIn {
  id: string
  clientId: string
  checkedInAt: string
  client?: { id: string; name: string; memberStatus: MemberStatus; planName: string | null }
  user?: { id: string; name: string } | null
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
  return json<{ member: GymMember; recentCheckIns: { id: string; checkedInAt: string }[] }>(
    authenticatedFetch(`/gym/members/${id}`)
  )
}

export function updateGymMember(
  id: string,
  data: { planName?: string | null; planExpiresAt?: string | null; autoControl?: boolean }
) {
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

export function createCheckIn(clientId: string) {
  return json<CheckInResult>(
    authenticatedFetch("/gym/checkins", { method: "POST", body: JSON.stringify({ clientId }) })
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
