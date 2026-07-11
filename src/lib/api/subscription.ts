import {
  getSubscriptionCacheGeneration,
  getSubscriptionFromMemoryCache,
  registerSubscriptionInflightClear,
  setSubscriptionMemoryCache,
} from "@/lib/subscription-memory-cache"
import { authenticatedFetch } from "./http"

export type Plan = "FREE" | "PREMIUM"
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "TRIAL"

export interface Subscription {
  id?: string
  plan: Plan
  status: SubscriptionStatus
  isPremium: boolean
  /** true quando plan === PREMIUM e status === EXPIRED (regularizar pagamento no portal). */
  needsPayment?: boolean
  /** true apenas durante o trial (espelha status TRIAL). */
  isTrialing?: boolean
  /** Presente quando needsPayment é true: orientação para cadastrar pagamento e manter o Premium. */
  message?: string
  startedAt?: string
  expiresAt?: string
  trialEndsAt?: string | null
  cancelAtPeriodEnd?: boolean
}

/**
 * Deduplica GET /subscription em paralelo e usa cache em memória (~60s) para reduzir
 * rajadas sequenciais (navegação / vários hooks). Use `bypassCache` após checkout.
 */
let subscriptionRequestInFlight: Promise<Subscription> | null = null

registerSubscriptionInflightClear(() => {
  subscriptionRequestInFlight = null
})

export async function getSubscription(options?: { bypassCache?: boolean }): Promise<Subscription> {
  if (!options?.bypassCache) {
    const fromMemory = getSubscriptionFromMemoryCache()
    if (fromMemory) {
      return fromMemory
    }
  }
  if (subscriptionRequestInFlight) {
    return subscriptionRequestInFlight
  }
  const genAtFetchStart = getSubscriptionCacheGeneration()
  const started = (async () => {
    const response = await authenticatedFetch("/subscription")
    const data = (await response.json()) as Subscription
    setSubscriptionMemoryCache(data, genAtFetchStart)
    return data
  })()
  subscriptionRequestInFlight = started.finally(() => {
    subscriptionRequestInFlight = null
  })
  return subscriptionRequestInFlight
}

export interface CreateCheckoutSessionResponse {
  url: string
  sessionId: string
}

export async function createCheckoutSession(): Promise<CreateCheckoutSessionResponse> {
  const response = await authenticatedFetch("/subscription/checkout", {
    method: "POST",
  })
  return response.json()
}

export interface CreatePortalSessionResponse {
  url: string
}

/** Retorna URL do Portal do Stripe (cancelar, atualizar cartão, etc.). Redirecione o usuário com window.location.href = url */
export async function createPortalSession(): Promise<CreatePortalSessionResponse> {
  const response = await authenticatedFetch("/subscription/portal", {
    method: "POST",
  })
  return response.json()
}
