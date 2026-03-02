"use client"

import { useState, useEffect, useCallback } from "react"
import { getSubscription, type Subscription } from "@/lib/api"

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
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
      const data = await getSubscription()
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

  return {
    subscription,
    isPremium: subscription?.isPremium ?? false,
    isLoading,
    error,
    refetch: fetchSubscription,
  }
}
