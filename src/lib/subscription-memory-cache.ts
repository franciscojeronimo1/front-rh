import type { Subscription } from "./api/subscription"

/** Evita rajadas sequenciais de GET /subscription ao navegar (rate limit no backend). */
const TTL_MS = 60_000

let cached: Subscription | null = null
let cachedAt = 0
/** Incrementado no login/logout para não gravar cache de outro usuário. */
let generation = 0

const inflightClears: Array<() => void> = []

/** Registrado por `api/subscription` para anular dedupe em voo ao trocar sessão. */
export function registerSubscriptionInflightClear(fn: () => void): void {
  inflightClears.push(fn)
}

export function getSubscriptionCacheGeneration(): number {
  return generation
}

/** Login, logout ou troca de sessão: zera cache, invalida gravações pendentes e limpa dedupe em voo. */
export function resetSubscriptionCacheForNewSession(): void {
  generation++
  cached = null
  cachedAt = 0
  for (const fn of inflightClears) {
    fn()
  }
}

export function getSubscriptionFromMemoryCache(): Subscription | null {
  if (cached != null && Date.now() - cachedAt < TTL_MS) {
    return cached
  }
  return null
}

export function setSubscriptionMemoryCache(data: Subscription, genAtFetchStart: number): void {
  if (genAtFetchStart !== generation) return
  cached = data
  cachedAt = Date.now()
}
