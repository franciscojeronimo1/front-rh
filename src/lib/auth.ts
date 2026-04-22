/**
 * Utilitários centralizados de autenticação.
 * Mantém token sincronizado entre localStorage e cookie para o middleware Next.js.
 */

import { resetSubscriptionCacheForNewSession } from "@/lib/subscription-memory-cache"

export const AUTH_COOKIE_NAME = "auth-token"
/** Cookie expira em 7 dias (em segundos). */
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60

/**
 * Salva o token em localStorage e em cookie (para o middleware).
 * Chamar após login bem-sucedido.
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return
  resetSubscriptionCacheForNewSession()
  localStorage.setItem("token", token)
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/**
 * Remove token e dados do usuário de localStorage e cookie.
 * Chamar em logout e ao receber 401.
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return
  resetSubscriptionCacheForNewSession()
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`
}

/**
 * Retorna o token do localStorage (para uso em requisições API).
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

/**
 * Redireciona para login e limpa autenticação.
 * Usado centralmente ao receber 401.
 */
export function redirectToLogin(expired = true): void {
  clearAuth()
  const params = expired ? "?expired=1" : ""
  window.location.href = `/login${params}`
}
