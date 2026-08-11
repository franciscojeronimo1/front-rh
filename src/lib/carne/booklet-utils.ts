import type { Booklet, BookletParcel } from "@/lib/api"

export interface BookletPaymentSummary {
  paidAmount: string
  openAmount: string
  paidCount: number
  pendingCount: number
  cancelledCount: number
  nextDueDate: string | null
}

function toDateKey(iso: string): string {
  return iso.includes("T") ? iso.split("T")[0]! : iso
}

function nextDueDateFromParcels(parcels: BookletParcel[]): string | null {
  let next: string | null = null

  for (const parcel of parcels) {
    if (parcel.status !== "PENDING") continue
    const key = toDateKey(parcel.dueDate)
    if (!next || key < next) next = key
  }

  return next
}

function summarizeFromParcels(parcels: BookletParcel[]): BookletPaymentSummary {
  let paid = 0
  let open = 0
  let paidCount = 0
  let pendingCount = 0
  let cancelledCount = 0

  for (const parcel of parcels) {
    const amount = parseFloat(String(parcel.amount))
    if (Number.isNaN(amount)) continue

    if (parcel.status === "PAID") {
      paid += amount
      paidCount += 1
    } else if (parcel.status === "PENDING") {
      open += amount
      pendingCount += 1
    } else {
      cancelledCount += 1
    }
  }

  return {
    paidAmount: paid.toFixed(2),
    openAmount: open.toFixed(2),
    paidCount,
    pendingCount,
    cancelledCount,
    nextDueDate: nextDueDateFromParcels(parcels),
  }
}

/** Totais do carnê: usa campos da API quando existem; senão calcula pelas parcelas. */
export function getBookletPaymentSummary(booklet: Booklet): BookletPaymentSummary {
  const hasApiTotals =
    booklet.paidAmount != null &&
    booklet.openAmount != null &&
    booklet.paidCount != null

  if (!hasApiTotals) {
    return summarizeFromParcels(booklet.parcels)
  }

  return {
    paidAmount: booklet.paidAmount!,
    openAmount: booklet.openAmount!,
    paidCount: booklet.paidCount!,
    pendingCount: booklet.pendingCount ?? 0,
    cancelledCount: booklet.cancelledCount ?? 0,
    nextDueDate:
      booklet.nextDueDate !== undefined
        ? booklet.nextDueDate
        : nextDueDateFromParcels(booklet.parcels),
  }
}
