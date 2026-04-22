"use client"

import { Loader2 } from "lucide-react"
import { estoqueDashboardLayout } from "@/lib/estoque/dashboard-tokens"

export function EstoqueDashboardSkeleton() {
  return (
    <div className={estoqueDashboardLayout.page}>
      <div className={estoqueDashboardLayout.container}>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  )
}
