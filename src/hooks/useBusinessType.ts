"use client"

import { useEffect, useState } from "react"
import {
  getCachedBusinessType,
  resolveBusinessType,
  subscribeBusinessType,
  type BusinessType,
} from "@/lib/business-type"

/** Tipo de negócio da empresa logada. `null` enquanto carrega. */
export function useBusinessType() {
  const [businessType, setBusinessType] = useState<BusinessType | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeBusinessType(setBusinessType)
    const known = getCachedBusinessType()
    if (known) {
      queueMicrotask(() => setBusinessType(known))
    } else if (localStorage.getItem("token")) {
      resolveBusinessType()
        .then(setBusinessType)
        .catch(() => setBusinessType("STANDARD"))
    }
    return unsubscribe
  }, [])

  return { businessType, isGym: businessType === "GYM", isLoading: businessType === null }
}
