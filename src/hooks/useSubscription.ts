"use client"

import { useState, useEffect, useCallback } from "react"
import { getSubscription, type Subscription } from "@/lib/api"
import { setBillingManual } from "@/lib/billing-mode"

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async (opts?: { bypassCache?: boolean }) => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("token")
    if (!token) {
      setSubscription(null)
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      const data = await getSubscription({ bypassCache: opts?.bypassCache === true })
      setBillingManual(data.billingManaged === "MANUAL")
      setSubscription(data)
    } catch (err) {
      setSubscription(null)
      setError(err instanceof Error ? err.message : "Erro ao carregar assinatura")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("token")
    if (!token) {
      setSubscription(null)
      setIsLoading(false)
      return
    }
    fetchSubscription()
  }, [fetchSubscription])

  const refetch = useCallback(() => {
    return fetchSubscription({ bypassCache: true })
  }, [fetchSubscription])

  const isTrialing =
    subscription?.isTrialing === true || subscription?.status === "TRIAL"

  /** Cobrança manual: esconder card de assinatura, banners, upgrade e coroa Premium. */
  const isBillingManual = subscription?.billingManaged === "MANUAL"
  const needsPayment = !isBillingManual && subscription?.needsPayment === true

  return {
    subscription,
    isPremium: subscription?.isPremium ?? false,
    isTrialing,
    needsPayment,
    isBillingManual,
    isLoading,
    error,
    refetch,
  }
}
