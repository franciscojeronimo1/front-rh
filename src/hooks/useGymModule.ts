"use client"

import { useCallback, useEffect, useState } from "react"
import { getGymSettings } from "@/lib/api"
import {
  getCachedGymEnabled,
  setGymModuleEnabled,
  subscribeGymModule,
} from "@/lib/academia/module-cache"

export { setGymModuleEnabled }

/** Diz se o módulo Academia está ligado para a organização logada. */
export function useGymModule() {
  const [enabled, setEnabled] = useState<boolean>(getCachedGymEnabled() ?? false)
  const [isLoading, setIsLoading] = useState(getCachedGymEnabled() === null)

  const load = useCallback(async () => {
    if (typeof window === "undefined" || !localStorage.getItem("token")) {
      setIsLoading(false)
      return
    }
    try {
      const { settings } = await getGymSettings()
      setGymModuleEnabled(settings.enabled)
    } catch {
      // Sem acesso ou erro de rede: mantém o módulo escondido
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeGymModule(setEnabled)
    if (getCachedGymEnabled() === null) void load()
    return unsubscribe
  }, [load])

  return { enabled, isLoading, refresh: load }
}
