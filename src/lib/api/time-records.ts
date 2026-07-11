import { authenticatedFetchWithRetry } from "./http"

export interface TimeRecord {
  id: string
  type: "START" | "STOP"
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
}

export interface TimePeriod {
  start: string
  stop: string
  minutes: number
}

export interface TimeSummary {
  date: string
  startDate?: string
  endDate?: string
  periods: TimePeriod[]
  totalMinutes: number
  totalHours: string
  status: "started" | "stopped"
}

export interface GetTimeSummaryParams {
  date?: string
  userId?: string
  periodDays?: number
  /** Mês no formato YYYY-MM (ex.: 2025-03). Não usar junto com date ou periodDays. */
  month?: string
}

export interface StartTimeRecordResponse {
  id: string
  type: "START"
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  message: string
}

export interface StopTimeRecordResponse {
  id: string
  type: "STOP"
  timestamp: string
  user: {
    id: string
    name: string
    email: string
  }
  summary: TimeSummary
  message: string
}

/** Resumo de um dia local (vem em `byDay` quando a lista usa `month` ou `periodDays`). */
export interface TimeRecordDaySummary {
  date: string
  periods: TimePeriod[]
  totalMinutes: number
  totalHours: string
  status: "started" | "stopped"
}

export interface TimeRecordsResponse {
  records: TimeRecord[]
  summary: TimeSummary
  /** Presente quando a consulta usa `month` ou `periodDays` (não com `date` único). */
  byDay?: TimeRecordDaySummary[]
}

export async function startTimeRecord(): Promise<StartTimeRecordResponse> {
  const response = await authenticatedFetchWithRetry("/time-records/start", {
    method: "POST",
  })
  return response.json()
}

export async function stopTimeRecord(): Promise<StopTimeRecordResponse> {
  const response = await authenticatedFetchWithRetry("/time-records/stop", {
    method: "POST",
  })
  return response.json()
}

/**
 * Lista batidas e resumo do período. Mesmos filtros que `/time-records/summary`:
 * sem params = dia atual; `date` = um dia; `month` / `periodDays` = intervalo (com `byDay` no backend).
 */
export async function getTimeRecords(
  paramsOrDate?: GetTimeSummaryParams | string,
  userId?: string
): Promise<TimeRecordsResponse> {
  const opts = normalizeTimeSummaryParams(paramsOrDate, userId)
  const queryString = buildTimeSummaryQueryString(opts)
  const response = await authenticatedFetchWithRetry(`/time-records${queryString}`)
  return response.json()
}

function normalizeTimeSummaryParams(
  paramsOrDate?: GetTimeSummaryParams | string,
  userId?: string
): GetTimeSummaryParams {
  if (typeof paramsOrDate === "string") {
    return { date: paramsOrDate, userId }
  }
  return { ...paramsOrDate, ...(userId && { userId }) }
}

function buildTimeSummaryQueryString(opts: GetTimeSummaryParams): string {
  const q = new URLSearchParams()

  if (opts.date) {
    const date = opts.date.includes("T") ? opts.date.split("T")[0] : opts.date
    q.set("date", date.split("+")[0].split("Z")[0])
  } else if (opts.periodDays != null) {
    q.set("periodDays", String(opts.periodDays))
  } else if (opts.month) {
    q.set("month", opts.month.slice(0, 7))
  }

  if (opts.userId) q.set("userId", opts.userId)
  const query = q.toString()
  return query ? `?${query}` : ""
}

export async function getTimeSummary(
  paramsOrDate?: GetTimeSummaryParams | string,
  userId?: string
): Promise<{ summary: TimeSummary }> {
  const opts = normalizeTimeSummaryParams(paramsOrDate, userId)
  const queryString = buildTimeSummaryQueryString(opts)
  const response = await authenticatedFetchWithRetry(`/time-records/summary${queryString}`)
  return response.json()
}
