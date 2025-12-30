"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getUsers,
  getTimeSummary,
  getTimeRecords,
  type User,
  type TimeSummary,
  type TimeRecord,
} from "@/lib/api"
import {
  Users,
  ArrowLeft,
  Clock,
  Calendar,
  History,
  Loader2,
  AlertCircle,
  Timer,
  Square,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ColaboradoresPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = format(new Date(), "yyyy-MM-dd")
    console.log("Data inicial selecionada:", today)
    return today
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userSummary, setUserSummary] = useState<TimeSummary | null>(null)
  const [userRecords, setUserRecords] = useState<TimeRecord[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const userStr = localStorage.getItem("user")
      
      if (!token) {
        router.push("/login")
        return
      }

      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role !== "ADMIN") {
          router.push("/dashboard")
        }
      }
    }
  }, [router])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      const response = await getUsers()

      const staffUsers = response.users.filter((user) => user.role === "STAFF")
      setUsers(staffUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar colaboradores")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserDetails = async (user: User) => {
    try {
      setIsLoadingDetails(true)
      setSelectedUser(user)
      setIsDialogOpen(true)

      const formattedDate = selectedDate.includes("T") ? selectedDate.split("T")[0] : selectedDate

      const [summaryData, recordsData] = await Promise.all([
        getTimeSummary(formattedDate, user.id),
        getTimeRecords(formattedDate, user.id),
      ])

      setUserSummary(summaryData.summary)
      setUserRecords(recordsData.records)
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar detalhes")
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleDateChange = async (newDate: string) => {
    const formattedDate = newDate.includes("T") ? newDate.split("T")[0] : newDate
    setSelectedDate(formattedDate)
    if (selectedUser) {
      await loadUserDetails(selectedUser)
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), "HH:mm:ss", { locale: ptBR })
    } catch {
      return timeString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando colaboradores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-6">
          <Link href="/dashboard" className="block">
            <Button
              variant="default"
              size="lg"
              className="gap-3 h-14 px-8 text-lg font-bold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto hover:cursor-pointer"
            >
              <ArrowLeft className="h-6 w-6" />
              Voltar ao Dashboard
            </Button>
          </Link>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                Meus Colaboradores
              </h1>
              <p className="text-muted-foreground">
                Gerencie e acompanhe o trabalho da sua equipe
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="date" className="text-sm">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg mb-2">
                Nenhum colaborador encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                Crie colaboradores através da API para começar a gerenciar sua equipe
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <ColaboradorCard
                key={user.id}
                user={user}
                date={selectedDate}
                onViewDetails={() => loadUserDetails(user)}
              />
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Detalhes - {selectedUser?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Resumo do Dia
                    </CardTitle>
                    <CardDescription>
                      {format(parseISO(selectedDate + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {userSummary?.totalHours || "0:00"}
                      </div>
                      <p className="text-muted-foreground">
                        {userSummary?.totalMinutes
                          ? `${userSummary.totalMinutes} minutos`
                          : "0 minutos"}
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-2">
                        {userSummary?.status === "started" ? (
                          <>
                            <Timer className="w-4 h-4 text-success" />
                            <span className="text-sm text-success font-medium">
                              Trabalhando
                            </span>
                          </>
                        ) : (
                          <>
                            <Square className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Parado
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {userSummary && userSummary.periods.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          Períodos trabalhados:
                        </p>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {userSummary.periods.map((period, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                            >
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {period.start} - {period.stop || "..."}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {Math.floor(period.minutes / 60)}h {period.minutes % 60}m
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" />
                      Histórico do Dia
                    </CardTitle>
                    <CardDescription>Registros de entrada e saída</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userRecords.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {userRecords.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center justify-between p-4 rounded-md border bg-card"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  record.type === "START"
                                    ? "bg-success"
                                    : "bg-destructive"
                                }`}
                              />
                              <div>
                                <p className="font-medium text-foreground">
                                  {record.type === "START" ? "Entrada" : "Saída"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(record.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono text-sm font-semibold text-foreground">
                                {formatTime(record.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum registro encontrado para esta data
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ColaboradorCard({
  user,
  date,
  onViewDetails,
}: {
  user: User
  date: string
  onViewDetails: () => void
}) {
  const [summary, setSummary] = useState<TimeSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSummary = async () => {
      if (!date || !user.id) {
        return
      }
      
      try {
        setIsLoading(true)
        const formattedDate = date.includes("T") ? date.split("T")[0] : date
        
        const response = await getTimeSummary(formattedDate, user.id)
        setSummary(response.summary)
      } catch (err) {
        console.error(`Erro ao carregar resumo para usuário ${user.id}:`, err)
        setSummary(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSummary()
  }, [date, user.id])

  const isWorking = summary?.status === "started"

  return (
    <Card className="hover:shadow-lg transition-all ">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{user.name}</span>
          {isWorking ? (
            <div className="flex items-center gap-2 text-success">
              <Timer className="w-4 h-4" />
              <span className="text-xs font-medium">Trabalhando</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Square className="w-4 h-4" />
              <span className="text-xs">Parado</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="text-center py-2">
              <div className="text-3xl font-bold text-primary mb-1">
                {summary?.totalHours || "0:00"}
              </div>
              <p className="text-sm text-muted-foreground">
                {summary?.totalMinutes ? `${summary.totalMinutes} min` : "0 min"}
              </p>
            </div>
            <Button
              onClick={onViewDetails}
              variant="outline"
              className="w-full hover:cursor-pointer"
            >
              <History className="w-4 h-4 mr-2 " />
              Ver Detalhes
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

