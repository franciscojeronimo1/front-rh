import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  LayoutDashboard,
  Clock,
  Users,
  Package,
  FileBarChart,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const WHATSAPP_NUMBER = "5535999312337"
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Gostaria de agendar um teste de 30 dias no Sistema CGS."
)

export const metadata: Metadata = {
  title: "Sobre nós | Sistema CGS",
  description:
    "Conheça o Sistema CGS: gestão empresarial com dashboard, ponto, colaboradores, estoque e administração. Agende um teste gratuito de 30 dias.",
}

const features = [
  {
    icon: LayoutDashboard,
    title: "Visão centralizada",
    description:
      "Um dashboard que reúne o que importa para a rotina da empresa e o acesso rápido às áreas de trabalho.",
  },
  {
    icon: Clock,
    title: "Controle de ponto",
    description:
      "Registro de entrada e saída com foco em organização e rastreabilidade do tempo da equipe (recursos avançados no plano Premium).",
  },
  {
    icon: Users,
    title: "Colaboradores",
    description:
      "Cadastro e gestão de pessoas em um só lugar, com permissões adequadas ao perfil de cada usuário.",
  },
  {
    icon: Package,
    title: "Estoque completo",
    description:
      "Produtos, entradas, saídas, histórico de movimentações e visão do que entra e sai do armazém.",
  },
  {
    icon: FileBarChart,
    title: "Relatórios",
    description:
      "Apoio à tomada de decisão com dados consolidados sobre movimentações e operação do estoque.",
  },
  {
    icon: Building2,
    title: "Administração",
    description:
      "Configurações da empresa e gestão de assinatura, alinhadas ao crescimento do seu negócio.",
  },
] as const

export default function SobreNosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-semibold text-foreground">Sistema CGS</span>
          </div>
          <Button asChild variant="default" size="sm" className="shrink-0">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 md:pt-20 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wide text-primary">
              Gestão empresarial profissional
            </p>
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              Evolua sua empresa com controle sobre equipe e estoque
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
              O Sistema CGS reúne ferramentas de RH, estoque e administração em uma experiência moderna,
              para você ganhar previsibilidade, reduzir retrabalho e acompanhar a operação com clareza.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 text-base font-semibold shadow-lg">
                <Link href="/login">
                  Acessar o sistema
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 text-base font-semibold border-2">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Agendar teste no WhatsApp
                </a>
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Teste gratuito de <span className="font-medium text-foreground">30 dias</span> — fale conosco para
              começar.
            </p>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/40 py-16 md:py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Tudo o que sua empresa precisa em um só lugar
              </h2>
              <p className="mt-4 text-muted-foreground">
                Módulos pensados para o dia a dia: do primeiro acesso ao relatório que sustenta a decisão.
                Recursos marcados como Premium no app seguem as regras do seu plano ou período de teste.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <Card
                  key={title}
                  className="border-2 border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-12">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Acesso seguro
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Profissionalismo que seus colaboradores e clientes percebem
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Processos organizados transmitem confiança. Com login protegido e papéis bem definidos,
                você mantém a governança da informação enquanto a equipe foca no que gera resultado.
              </p>
              <ul className="mt-6 space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Menos planilhas soltas e mais um fluxo único para RH e estoque.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Visibilidade de movimentações para evitar surpresas no estoque.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Base para escalar: teste Premium e planos conforme a necessidade da empresa.
                </li>
              </ul>
            </div>
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-accent/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Agende seu teste de 30 dias</CardTitle>
                <CardDescription className="text-base">
                  Entre em contato pelo WhatsApp ou telefone. Apresentamos o sistema e configuramos seu
                  período de avaliação sem compromisso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border-2 border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      WhatsApp
                    </p>
                    <p className="font-semibold text-foreground">(35) 99931-2337</p>
                  </div>
                </a>
                <a
                  href="tel:+5535999312337"
                  className="flex items-center gap-3 rounded-lg border-2 border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Telefone
                    </p>
                    <p className="font-semibold text-foreground">(35) 99931-2337</p>
                  </div>
                </a>
                <Button asChild className="w-full h-11 text-base font-semibold">
                  <Link href="/login">Já tenho conta — Entrar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/90 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>© 2026 Sistema CGS. Todos os direitos reservados.</p>
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Fazer login
          </Link>
        </div>
      </footer>
    </div>
  )
}
