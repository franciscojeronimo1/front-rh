"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "./useSubscription"

/**
 * Redireciona para o dashboard se o usuário não tiver plano Premium.
 * Usado em páginas que exigem assinatura premium (ponto, colaboradores, estoque).
 */
export function useRequirePremium() {
  const router = useRouter()
  const { isPremium, isLoading } = useSubscription()

  useEffect(() => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    if (!isLoading && !isPremium) {
      router.push("/dashboard?upgrade=1")
    }
  }, [router, isPremium, isLoading])

  return { isPremium, isLoading }
}
