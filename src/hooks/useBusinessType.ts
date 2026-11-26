"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  getCachedBusinessType,
  resolveBusinessType,
  subscribeBusinessType,
  type BusinessType,
} from "@/lib/business-type"

/**
 * Tipo de negócio da empresa logada. `null` enquanto carrega.
 *
 * Revalida a cada troca de rota: o AppShell fica montado desde a tela de login (sem token),
 * então sem isso o tipo ficava `null` depois do login até recarregar a página.
 */
export function useBusinessType() {
  const pathname = usePathname()
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)

  useEffect(() => subscribeBusinessType(setBusinessType), [])

  useEffect(() => {
    let cancelled = false
    const known = getCachedBusinessType()
    if (known) {
      queueMicrotask(() => {
        if (!cancelled) setBusinessType(known)
      })
    } else if (localStorage.getItem("token")) {
      resolveBusinessType()
        .then((t) => {
          if (!cancelled) setBusinessType(t)
        })
        .catch(() => {
          if (!cancelled) setBusinessType("STANDARD")
        })
    } else {
      queueMicrotask(() => {
        if (!cancelled) setBusinessType(null)
      })
    }
    return () => {
      cancelled = true
    }
  }, [pathname])

  return { businessType, isGym: businessType === "GYM", isLoading: businessType === null }
}
