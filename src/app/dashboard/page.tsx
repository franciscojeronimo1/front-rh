"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Clock, Package } from "lucide-react"

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    // Verificar se há token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
      }
    }
  }, [router])

  const user = typeof window !== "undefined" 
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : null

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.name || "Usuário"}!
          </h1>
          <p className="text-muted-foreground">
            Sistema de gestão empresarial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Bater Ponto
              </CardTitle>
              <CardDescription>
                Registre sua entrada e saída
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Funcionários
              </CardTitle>
              <CardDescription>
                Gerencie sua equipe
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Estoque
              </CardTitle>
              <CardDescription>
                Controle de inventário
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Administração
              </CardTitle>
              <CardDescription>
                Configurações do sistema
              </CardDescription>
            </CardHeader>
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

