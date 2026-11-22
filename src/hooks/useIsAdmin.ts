"use client"

import { useEffect, useState } from "react"

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const u = JSON.parse(localStorage.getItem("user") ?? "null")
        setIsAdmin(u?.role === "ADMIN")
      } catch {
        setIsAdmin(false)
      }
    })
  }, [])
  return isAdmin
}
