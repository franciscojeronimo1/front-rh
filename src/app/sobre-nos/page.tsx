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
  Gift,
  Headphones,
  Sparkles,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const WHATSAPP_NUMBER = "5535999312337"
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Olá! Gostaria de agendar um teste de 30 dias no Sistema CGS."
)

export const metadata: Metadata = {
  title: "Sobre nós | Sistema CGS",
  description:
    "Conheça o Sistema CGS: gestão empresarial com dashboard, ponto, colaboradores, estoque e administração. Agende um teste gratuito de 30 dias.",
}

const trustChips = [
  { icon: Gift, label: "30 dias grátis" },
  { icon: Users, label: "RH + estoque" },
  { icon: Headphones, label: "Suporte no WhatsApp" },
] as const

const features = [
  {
    icon: LayoutDashboard,
    title: "Visão centralizada",
    description:
      "Um dashboard que reúne o que importa para a rotina da empresa e o acesso rápido às áreas de trabalho.",
    bentoClass:
      "lg:col-span-2 lg:row-span-2 lg:row-start-1 lg:col-start-1 min-h-[200px] sm:min-h-0",
    delayClass: "delay-0",
  },
  {
    icon: Clock,
    title: "Controle de ponto",
    description:
      "Registro de entrada e saída com foco em organização e rastreabilidade do tempo da equipe (recursos avançados no plano Premium).",
    bentoClass: "lg:col-start-3 lg:row-start-1",
    delayClass: "delay-75",
  },
  {
    icon: Users,
    title: "Colaboradores",
    description:
      "Cadastro e gestão de pessoas em um só lugar, com permissões adequadas ao perfil de cada usuário.",
    bentoClass: "lg:col-start-3 lg:row-start-2",
    delayClass: "delay-100",
  },
  {
    icon: Package,
    title: "Estoque completo",
    description:
      "Produtos, entradas, saídas, histórico de movimentações e visão do que entra e sai do armazém.",
    bentoClass:
      "lg:col-span-2 lg:row-span-2 lg:row-start-3 lg:col-start-1 min-h-[200px] sm:min-h-0",
    delayClass: "delay-150",
  },
  {
    icon: FileBarChart,
    title: "Relatórios",
    description:
      "Apoio à tomada de decisão com dados consolidados sobre movimentações e operação do estoque.",
    bentoClass: "lg:col-start-3 lg:row-start-3",
    delayClass: "delay-200",
  },
  {
    icon: Building2,
    title: "Administração",
    description:
      "Configurações da empresa e gestão de assinatura, alinhadas ao crescimento do seu negócio.",
    bentoClass: "lg:col-start-3 lg:row-start-4",
    delayClass: "delay-300",
  },
] as const

type BentoFill = "dashboard" | "estoque"

const BENTO_FILLS: Partial<Record<(typeof features)[number]["title"], BentoFill>> = {
  "Visão centralizada": "dashboard",
  "Estoque completo": "estoque",
}

function BentoFeaturedBackdrop({ variant }: { variant: BentoFill }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
      aria-hidden
    >
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 top-[28%]",
          "bg-linear-to-t from-primary/11 via-primary/5 to-transparent",
          "dark:from-primary/18 dark:via-primary/8"
        )}
      />
      <div className="absolute inset-x-0 bottom-0 top-[32%] opacity-[0.14] dark:opacity-[0.22]">
        {variant === "dashboard" ? (
          <svg
            className="absolute bottom-0 left-1/2 h-[min(52%,9.5rem)] w-[92%] max-w-md -translate-x-1/2 text-primary"
            viewBox="0 0 360 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
          >
            <rect x="12" y="58" width="336" height="64" rx="8" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12 78h336" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
            <rect x="24" y="88" width="72" height="8" rx="2" fill="currentColor" opacity="0.35" />
            <rect x="24" y="102" width="52" height="8" rx="2" fill="currentColor" opacity="0.22" />
            <rect x="110" y="88" width="52" height="8" rx="2" fill="currentColor" opacity="0.22" />
            <rect x="110" y="102" width="68" height="8" rx="2" fill="currentColor" opacity="0.18" />
            <rect x="248" y="84" width="14" height="36" rx="2" fill="currentColor" opacity="0.4" />
            <rect x="268" y="72" width="14" height="48" rx="2" fill="currentColor" opacity="0.28" />
            <rect x="288" y="92" width="14" height="28" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="308" y="64" width="14" height="56" rx="2" fill="currentColor" opacity="0.32" />
            <circle cx="48" cy="34" r="18" stroke="currentColor" strokeWidth="1" />
            <path
              d="M38 34h20M48 24v20"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.6"
            />
            <rect x="88" y="18" width="88" height="36" rx="6" stroke="currentColor" strokeWidth="1" />
            <rect x="98" y="28" width="28" height="6" rx="1" fill="currentColor" opacity="0.25" />
            <rect x="98" y="38" width="68" height="6" rx="1" fill="currentColor" opacity="0.15" />
            <rect x="196" y="22" width="152" height="28" rx="6" stroke="currentColor" strokeWidth="1" opacity="0.85" />
            <rect x="208" y="32" width="40" height="8" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
        ) : (
          <svg
            className="absolute bottom-0 left-1/2 h-[min(52%,9.5rem)] w-[92%] max-w-md -translate-x-1/2 text-primary"
            viewBox="0 0 360 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
          >
            <path
              d="M88 108 L140 78 L192 108 L140 138 Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <path
              d="M140 78 L192 48 L244 78 L192 108 Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.12"
            />
            <path
              d="M192 48 L244 18 L296 48 L244 78 Z"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.18"
            />
            <rect x="208" y="72" width="120" height="52" rx="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M208 88h120M228 72v52" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
            <rect x="220" y="96" width="36" height="20" rx="2" fill="currentColor" opacity="0.22" />
            <rect x="264" y="96" width="52" height="12" rx="2" fill="currentColor" opacity="0.15" />
            <circle cx="52" cy="88" r="22" stroke="currentColor" strokeWidth="1" />
            <path
              d="M40 88h24M52 76v24"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M32 118c18-8 36-8 54 0"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.35"
            />
          </svg>
        )}
      </div>
      <div
        className="absolute -right-8 -bottom-12 h-40 w-40 rounded-full bg-primary/6 blur-2xl dark:bg-primary/12"
        aria-hidden
      />
      <div
        className="absolute -left-6 bottom-0 h-28 w-28 rounded-full bg-primary/5 blur-xl dark:bg-primary/10"
        aria-hidden
      />
    </div>
  )
}

const faqItems = [
  {
    q: "Como funciona o teste de 30 dias?",
    a: "Entre em contato pelo WhatsApp ou telefone. Configuramos seu acesso ao período de avaliação para você explorar os módulos com apoio da nossa equipe, sem compromisso de contratação.",
  },
  {
    q: "O que é o plano Premium?",
    a: "Alguns recursos avançados (como extensões do controle de ponto) ficam marcados como Premium no aplicativo. Durante o teste você pode avaliar essas funções; depois, o plano define o que permanece liberado.",
  },
  {
    q: "Preciso instalar algo na empresa?",
    a: "O Sistema CGS roda no navegador. Basta acessar pelo link, fazer login e usar — ideal para equipes em escritório ou híbridas.",
  },
  {
    q: "Como peço suporte?",
    a: "O canal principal é o WhatsApp no número exibido nesta página. Também atendemos por telefone no mesmo contato.",
  },
] as const

export default function SobreNosPage() {
  return (
    <div className="landing-sobre-nos min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
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
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div
              className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
              style={{
                backgroundImage: `linear-gradient(to right, oklch(0.45 0.15 250 / 0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, oklch(0.45 0.15 250 / 0.08) 1px, transparent 1px)`,
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-primary/20 blur-3xl dark:bg-primary/25" />
            <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-accent blur-3xl opacity-80 dark:opacity-40" />
            <div className="absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-12 md:pb-24 md:pt-16 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
              <div className="text-center lg:text-left">
                <p
                  className={cn(
                    "mb-4 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary",
                    "animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
                  )}
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Gestão empresarial profissional
                </p>
                <h1
                  className={cn(
                    "text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                    "animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both delay-75"
                  )}
                >
                  Evolua sua empresa com{" "}
                  <span className="bg-linear-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent dark:from-primary dark:via-primary dark:to-primary/80">
                    controle sobre equipe e estoque
                  </span>
                </h1>
                <p
                  className={cn(
                    "mt-6 text-pretty text-lg text-muted-foreground md:text-xl",
                    "animate-in fade-in slide-in-from-bottom-3 duration-600 fill-mode-both delay-100"
                  )}
                >
                  O Sistema CGS reúne ferramentas de RH, estoque e administração em uma experiência moderna,
                  para você ganhar previsibilidade, reduzir retrabalho e acompanhar a operação com clareza.
                </p>
                <div
                  className={cn(
                    "mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start",
                    "animate-in fade-in slide-in-from-bottom-3 duration-600 fill-mode-both delay-150"
                  )}
                >
                  <Button asChild size="lg" className="h-12 text-base font-semibold shadow-lg">
                    <Link href="/login">
                      Acessar o sistema
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 border-2 text-base font-semibold">
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
                <div
                  className={cn(
                    "mt-8 flex flex-wrap justify-center gap-2 lg:justify-start",
                    "animate-in fade-in duration-600 fill-mode-both delay-200"
                  )}
                >
                  {trustChips.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-sm text-foreground backdrop-blur-sm dark:bg-muted/20"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      {label}
                    </span>
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Teste gratuito de <span className="font-medium text-foreground">30 dias</span> — fale conosco
                  para começar.
                </p>
              </div>

              <div
                className={cn(
                  "relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none",
                  "animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-700 fill-mode-both delay-200"
                )}
                aria-hidden
              >
                <div className="rounded-2xl border border-border/60 bg-linear-to-br from-card via-card to-primary/7 p-1 shadow-2xl dark:to-primary/10">
                  <div className="overflow-hidden rounded-[0.875rem] border border-border/50 bg-muted/30 dark:bg-muted/20">
                    <div className="flex items-center gap-2 border-b border-border/60 bg-muted/50 px-4 py-3 dark:bg-muted/30">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
                      <span className="ml-2 truncate text-xs text-muted-foreground">app.cgs — visão geral</span>
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-border/60 bg-background/90 p-3 shadow-sm dark:bg-card/80">
                          <LayoutDashboard className="mb-2 h-5 w-5 text-primary" />
                          <div className="h-2 w-12 rounded bg-muted" />
                          <div className="mt-2 h-8 rounded bg-primary/10" />
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/90 p-3 shadow-sm dark:bg-card/80">
                          <Users className="mb-2 h-5 w-5 text-primary" />
                          <div className="h-2 w-10 rounded bg-muted" />
                          <div className="mt-2 space-y-1">
                            <div className="h-2 rounded bg-muted" />
                            <div className="h-2 w-4/5 rounded bg-muted" />
                          </div>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/90 p-3 shadow-sm dark:bg-card/80">
                          <Package className="mb-2 h-5 w-5 text-primary" />
                          <div className="h-2 w-14 rounded bg-muted" />
                          <div className="mt-2 h-10 rounded bg-chart-2/15" />
                        </div>
                      </div>
                      <div className="flex gap-2 rounded-lg border border-dashed border-primary/25 bg-primary/4 p-4 dark:bg-primary/10">
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-3/4 max-w-[180px] rounded bg-muted" />
                          <div className="h-2 w-full max-w-[220px] rounded bg-muted/70" />
                          <div className="h-2 w-5/6 max-w-[200px] rounded bg-muted/50" />
                        </div>
                        <FileBarChart className="h-10 w-10 shrink-0 text-primary/40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/60 bg-card/35 py-16 dark:bg-card/20 md:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div
              className={cn(
                "mx-auto max-w-2xl text-center",
                "animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both"
              )}
            >
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Tudo o que sua empresa precisa em um só lugar
              </h2>
              <p className="mt-4 text-muted-foreground">
                Módulos pensados para o dia a dia: do primeiro acesso ao relatório que sustenta a decisão.
                Recursos marcados como Premium no app seguem as regras do seu plano ou período de teste.
              </p>
            </div>
            <div className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-4 lg:gap-5">
              {features.map(({ icon: Icon, title, description, bentoClass, delayClass }) => {
                const fill = BENTO_FILLS[title]
                return (
                  <Card
                    key={title}
                    className={cn(
                      "group border-2 border-border/80 bg-card/90 shadow-sm transition-all duration-300",
                      "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg dark:bg-card/80",
                      "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both",
                      delayClass,
                      bentoClass,
                      fill && "relative overflow-hidden"
                    )}
                  >
                    {fill ? <BentoFeaturedBackdrop variant={fill} /> : null}
                    <CardHeader className={cn("pb-2", fill && "relative z-10")}>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className={cn(fill && "relative z-10")}>
                      <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-start md:gap-12">
            <div
              className={cn(
                "animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both"
              )}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm text-muted-foreground dark:bg-muted/30">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Acesso seguro
              </div>
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                Profissionalismo que seus colaboradores e clientes percebem
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
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
            <Card
              className={cn(
                "border border-border/50 bg-card/65 shadow-2xl backdrop-blur-xl dark:bg-card/50",
                "animate-in fade-in slide-in-from-bottom-5 duration-700 fill-mode-both delay-150"
              )}
            >
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
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-4 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-muted/40 dark:bg-background/40"
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
                  className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/60 p-4 backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-muted/40 dark:bg-background/40"
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
                <Button asChild className="h-11 w-full text-base font-semibold">
                  <Link href="/login">Já tenho conta — Entrar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-t border-border/60 bg-muted/20 py-16 dark:bg-muted/10 md:py-20">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">Perguntas frequentes</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Respostas rápidas sobre teste, planos e suporte.
            </p>
            <div className="mt-10 space-y-3">
              {faqItems.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-xl border border-border/80 bg-card/80 shadow-sm open:border-primary/20 open:shadow-md dark:bg-card/60"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div className="border-t border-border/60 px-4 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground">
                    {a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background/90 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>© 2026 Sistema CGS. Todos os direitos reservados.</p>
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Fazer login
          </Link>
        </div>
      </footer>
    </div>
  )
}
