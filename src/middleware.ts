import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_COOKIE_NAME = "auth-token"

/** Rotas que exigem autenticação. */
const PROTECTED_PATHS = [
  "/dashboard",
  "/ponto",
  "/colaboradores",
  "/clientes",
  "/estoque",
  "/administracao",
]

/** Rotas públicas (login, etc.). */
const PUBLIC_PATHS = ["/login", "/sobre-nos"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  // Rota raiz: redirecionar para login ou dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL(token ? "/dashboard" : "/login", request.url))
  }

  // Rotas protegidas: exigir token
  if (isProtectedPath(pathname) && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Login: se já autenticado, redirecionar para dashboard
  if (pathname === "/login" && token) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard"
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|icone.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
