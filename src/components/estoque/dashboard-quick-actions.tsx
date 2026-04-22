"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp, BarChart3, Box } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  estoqueDashboardLayout,
  estoqueQuickActionTone,
  type EstoqueQuickActionTone,
} from "@/lib/estoque/dashboard-tokens"

type QuickActionItem = {
  href: string
  title: string
  description: string
  icon: LucideIcon
  tone: EstoqueQuickActionTone
}

const ACTIONS: QuickActionItem[] = [
  {
    href: "/estoque/entrada",
    title: "Registrar entrada",
    description: "Compra ou recebimento",
    icon: ArrowDown,
    tone: "emerald",
  },
  {
    href: "/estoque/saida",
    title: "Registrar saída",
    description: "Uso ou consumo",
    icon: ArrowUp,
    tone: "blue",
  },
  {
    href: "/estoque/produtos/novo",
    title: "Novo produto",
    description: "Cadastrar item",
    icon: Box,
    tone: "amber",
  },
  {
    href: "/estoque/relatorios",
    title: "Relatórios",
    description: "Análises completas",
    icon: BarChart3,
    tone: "blue",
  },
]

export function DashboardQuickActions() {
  return (
    <div>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Ações rápidas</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIONS.map(({ href, title, description, icon: Icon, tone }) => (
          <Link key={href} href={href} className="group block">
            <Card className={`h-full ${estoqueDashboardLayout.cardInteractive}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${estoqueQuickActionTone[tone].circle}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
