export function formatSubscriptionDate(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return isoDate
  }
}

/** Data e hora local para fim do trial (GET /subscription → trialEndsAt). */
export function formatTrialEndsAt(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(d)
  } catch {
    return isoDate
  }
}
