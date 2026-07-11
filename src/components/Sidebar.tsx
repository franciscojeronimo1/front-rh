"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Clock,
  Users,
  UserRound,
  Package,
  Building2,
  LogOut,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  FileBarChart,
  Crown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSubscription } from "@/hooks/useSubscription"
import { clearAuth } from "@/lib/auth"

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "STAFF"
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ponto", label: "Bater Ponto", icon: Clock, premium: true },
  { href: "/colaboradores", label: "Colaboradores", icon: Users, admin: true, premium: true },
  { href: "/clientes", label: "Clientes", icon: UserRound },
  {
    href: "/estoque",
    label: "Estoque",
    icon: Package,
    premium: true,
    children: [
      { href: "/estoque", label: "Visão geral", icon: Boxes },
      { href: "/estoque/produtos", label: "Produtos", icon: Package },
      { href: "/estoque/entrada", label: "Entrada", icon: ArrowDownToLine },
      { href: "/estoque/saida", label: "Saída", icon: ArrowUpFromLine },
      { href: "/estoque/movimentacoes", label: "Movimentações", icon: History },
      { href: "/estoque/relatorios", label: "Relatórios", icon: FileBarChart },
    ],
  },
  { href: "/administracao", label: "Administração", icon: Building2, admin: true },
] as const

function NavLink({
  href,
  label,
  icon: Icon,
  disabled,
  disabledReason,
  collapsed,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  disabledReason?: string
  collapsed?: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  if (disabled) {
    return (
      <div
        title={disabledReason}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-60",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate">{label}</span>
            {disabledReason?.includes("Premium") && <Crown className="h-4 w-4 ml-auto shrink-0" />}
          </>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

type NavItemWithChildrenType = Extract<(typeof navItems)[number], { children: readonly unknown[] }>

function NavItemWithChildren({
  item,
  isPremium,
  pathname,
  collapsed,
  onClose,
}: {
  item: NavItemWithChildrenType
  isAdmin: boolean
  isPremium: boolean
  pathname: string
  collapsed?: boolean
  onClose?: () => void
}) {
  const [open, setOpen] = useState(pathname.startsWith("/estoque"))
  const Icon = item.icon
  const disabled = item.premium && !isPremium

  if (disabled) {
    return (
      <div
        title="Plano Premium necessário"
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-60",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate">{item.label}</span>
            <Crown className="h-4 w-4 ml-auto shrink-0" />
          </>
        )}
      </div>
    )
  }

  const isParentActive = pathname.startsWith("/estoque")

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={item.label}
            className={cn(
              "flex w-full items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors",
              isParentActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          {item.children?.map((child) => {
            const ChildIcon = child.icon
            return (
              <DropdownMenuItem key={child.href} asChild>
                <Link href={child.href} onClick={onClose}>
                  <ChildIcon className="h-4 w-4" />
                  {child.label}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isParentActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="truncate flex-1 text-left">{item.label}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
      </button>
      {open && item.children && (
        <div className="ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children.map((child) => {
            const ChildIcon = child.icon
            const isChildActive = pathname === child.href
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isChildActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <ChildIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{child.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface SidebarProps {
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isPremium } = useSubscription()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user")
        setUser(userData ? (JSON.parse(userData) as User) : null)
      }
    })
  }, [])

  const isAdmin = user?.role === "ADMIN"
  const isCollapsed = collapsed && !!onToggleCollapsed

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      clearAuth()
      router.push("/login")
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border shrink-0",
          isCollapsed ? "justify-center px-0" : "px-4"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onClose}
          className={cn(
            "flex items-center font-semibold",
            isCollapsed ? "justify-center p-2" : "gap-2"
          )}
        >
          <Package className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && <span className="text-lg">Sistema CGS</span>}
        </Link>
      </div>

      <nav className={cn("flex-1 overflow-y-auto p-3 space-y-1", isCollapsed && "px-2")}>
        {navItems.map((item) => {
          if ("children" in item && item.children) {
            return (
              <NavItemWithChildren
                key={item.href}
                item={item}
                isAdmin={!!isAdmin}
                isPremium={!!isPremium}
                pathname={pathname}
                collapsed={isCollapsed}
                onClose={onClose}
              />
            )
          }

          const disabledByAdmin = "admin" in item && item.admin && !isAdmin
          const disabledByPremium = "premium" in item && item.premium && !isPremium
          const disabled = disabledByAdmin || disabledByPremium
          const disabledReason = disabledByAdmin
            ? "Apenas para administradores"
            : disabledByPremium
              ? "Plano Premium necessário"
              : undefined

          return (
            <div key={item.href} onClick={onClose}>
              <NavLink
                href={item.href}
                label={item.label}
                icon={item.icon}
                disabled={disabled}
                disabledReason={disabledReason}
                collapsed={isCollapsed}
              />
            </div>
          )
        })}
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-3 space-y-2",
          isCollapsed && "px-2"
        )}
      >
        {user && !isCollapsed && (
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        {onToggleCollapsed && (
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isCollapsed ? "w-full" : "w-full justify-start gap-3"
            )}
            onClick={onToggleCollapsed}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                Recolher menu
              </>
            )}
          </Button>
        )}
        <Button
          variant="ghost"
          size={isCollapsed ? "icon" : "default"}
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed ? "" : "justify-start gap-3"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  )
}
