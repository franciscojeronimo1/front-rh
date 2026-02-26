"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { checkHealth } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Clock, Package, ArrowRight, LogOut } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "STAFF"
}

export default function Dashboard() {
  const router = useRouter()
  // Função inicializadora que só executa no cliente
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const userData = localStorage.getItem("user")
      return userData ? (JSON.parse(userData) as User) : null
    } catch {
      return null
    }
  })
  const [isLoading] = useState(() => {
    if (typeof window === "undefined") return true
    const token = localStorage.getItem("token")
    return !token
  })

  useEffect(() => {
    // Verificar se há token e redirecionar se necessário
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
      } else {
        // Aquecer o banco ao abrir o app já logado
        checkHealth().catch(() => {})
      }
    }
  }, [router])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      router.push("/login")
    }
  }

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
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo, {user?.name || "Usuário"}!
            </h1>
            <p className="text-muted-foreground">
              Sistema de gestão empresarial
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          {user?.role === "ADMIN" ? (
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
            <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
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
              <p className="text-xs text-muted-foreground">Em breve</p>
            </CardContent>
          </Card>
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

