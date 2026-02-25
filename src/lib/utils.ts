import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { GetTimeSummaryParams, TimeSummary } from "@/lib/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TimeSummaryFilterMode = "day" | "periodDays" | "month"

export function getTimeSummaryParams(
  filterMode: TimeSummaryFilterMode,
  selectedDate: string,
  selectedMonth: string,
  userId: string
): GetTimeSummaryParams {
  if (filterMode === "day") {
    const date = selectedDate.includes("T") ? selectedDate.split("T")[0] : selectedDate
    const cleanDate = date.split("+")[0].split("Z")[0]
    return { date: cleanDate, userId }
  }
  if (filterMode === "periodDays") {
    return { periodDays: 30, userId }
  }
  return { month: selectedMonth.slice(0, 7), userId }
}

/** Título do card de resumo de horas (ex.: "Resumo do dia", "Últimos 30 dias", "Março de 2025"). */
export function getSummaryCardTitle(
  filterMode: TimeSummaryFilterMode,
  selectedDate: string,
  selectedMonth: string
): string {
  if (filterMode === "day") {
    return "Resumo do dia"
  }
  if (filterMode === "periodDays") {
    return "Últimos 30 dias"
  }
  const monthStr = format(
    parseISO(selectedMonth.slice(0, 7) + "-01T00:00:00"),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  )
  return monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
}

/** Descrição do card (data única ou intervalo). */
export function getSummaryCardDescription(
  filterMode: TimeSummaryFilterMode,
  selectedDate: string,
  summary: TimeSummary | null
): string | null {
  if (filterMode === "day") {
    const date = selectedDate.includes("T") ? selectedDate.split("T")[0] : selectedDate
    return format(parseISO(date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
  }
  if (summary?.startDate && summary?.endDate) {
    return `${format(parseISO(summary.startDate), "dd/MM/yyyy", { locale: ptBR })} a ${format(parseISO(summary.endDate), "dd/MM/yyyy", { locale: ptBR })}`
  }
  return null
}
