"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { checkHealth } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Users, Clock, Package, ArrowRight, Crown, AlertCircle } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "STAFF"
}

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const showUpgradeMessage = searchParams.get("upgrade") === "1"
  const { isPremium, isLoading: isLoadingSubscription } = useSubscription()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Só executa no cliente - evita mismatch de hidratação
    try {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")
      setUser(userData ? (JSON.parse(userData) as User) : null)
      if (!token) {
        router.push("/login")
      } else {
        checkHealth().catch(() => {})
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Mostrar loading ou nada enquanto carrega
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {showUpgradeMessage && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Plano Premium necessário para acessar esta funcionalidade. Faça upgrade na tela de{" "}
              <Link href="/administracao" className="font-medium underline underline-offset-4 hover:text-primary">
                Administração
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.name || "Usuário"}!
          </h1>
          <p className="text-muted-foreground">
            Sistema de gestão empresarial
            {!isLoadingSubscription && !isPremium && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                • Plano gratuito
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isPremium ? (
            <Link href="/ponto">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Bater Ponto
                  </CardTitle>
                  <CardDescription>
                    Registre sua entrada e saída
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full hover:cursor-pointer">
                    Acessar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Bater Ponto
                </CardTitle>
                <CardDescription>
                  Plano Premium necessário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/administracao">
                  <Button variant="outline" className="w-full gap-2">
                    <Crown className="h-4 w-4" />
                    Fazer upgrade
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {user?.role === "ADMIN" ? (
            isPremium ? (
              <Link href="/colaboradores">
                <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Colaboradores
                    </CardTitle>
                    <CardDescription>
                      Gerencie sua equipe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full hover:cursor-pointer">
                      Acessar <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Card className="opacity-60 cursor-not-allowed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    Colaboradores
                  </CardTitle>
                  <CardDescription>
                    Plano Premium necessário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/administracao">
                    <Button variant="outline" className="w-full gap-2">
                      <Crown className="h-4 w-4" />
                      Fazer upgrade
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Funcionários
                </CardTitle>
                <CardDescription>
                  Gerencie sua equipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Apenas para administradores</p>
              </CardContent>
            </Card>
          )}

          {isPremium ? (
            <Link href="/estoque">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Estoque
                  </CardTitle>
                  <CardDescription>
                    Controle de inventário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full hover:cursor-pointer">
                    Acessar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="opacity-60 cursor-not-allowed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  Estoque
                </CardTitle>
                <CardDescription>
                  Plano Premium necessário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/administracao">
                  <Button variant="outline" className="w-full gap-2">
                    <Crown className="h-4 w-4" />
                    Fazer upgrade
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {user?.role === "ADMIN" ? (
            <Link href="/administracao">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Administração
                  </CardTitle>
                  <CardDescription>
                    Configurações do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full hover:cursor-pointer">
                    Acessar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Administração
                </CardTitle>
                <CardDescription>
                  Configurações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Apenas para administradores</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>Dados do seu perfil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Nome:</strong> {user?.name || "N/A"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Perfil:</strong> {user?.role === "ADMIN" ? "Administrador" : "Colaborador"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

