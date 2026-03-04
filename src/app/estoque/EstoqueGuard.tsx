"use client"

import { useRequirePremium } from "@/hooks/useRequirePremium"
import { Loader2 } from "lucide-react"

export default function EstoqueGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { isPremium, isLoading } = useRequirePremium()

  if (isLoading || !isPremium) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
