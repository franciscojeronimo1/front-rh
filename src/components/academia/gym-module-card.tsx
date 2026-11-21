"use client"

import Link from "next/link"
import { ArrowRight, Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGymModule } from "@/hooks/useGymModule"

/**
 * Atalho para o módulo Academia.
 * - Ligado: leva ao painel.
 * - Desligado: só aparece para admin (variant "admin"), convidando a ativar.
 */
export function GymModuleCard({ variant = "dashboard" }: { variant?: "dashboard" | "admin" }) {
  const { enabled, isLoading } = useGymModule()
  if (isLoading) return null
  if (!enabled && variant !== "admin") return null

  return (
    <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm">
      <CardContent className="flex flex-col gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">
            {enabled ? "Academia — controle inteligente de alunos" : "Módulo Academia (desligado)"}
          </p>
          <p className="text-sm text-muted-foreground">
            {enabled
              ? "Presenças, alunos em risco, desativação automática e avisos em um só lugar."
              : "Ative para o sistema acompanhar a frequência dos alunos e avisar você automaticamente."}
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/academia">
            {enabled ? "Abrir painel" : "Conhecer e ativar"} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
