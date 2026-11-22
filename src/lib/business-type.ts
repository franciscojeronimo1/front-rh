/**
 * Tipo de negócio da empresa logada (STANDARD = sistema atual, GYM = só Academia).
 * Vem do login (salvo em localStorage "user"); sessões antigas buscam em GET /organizations.
 */
import { getOrganization } from "@/lib/api/organization"

export type BusinessType = "STANDARD" | "GYM"

let cached: BusinessType | null = null
let inflight: Promise<BusinessType> | null = null
const listeners = new Set<(t: BusinessType) => void>()

function readStored(): BusinessType | null {
  if (typeof window === "undefined") return null
  try {
    const u = JSON.parse(localStorage.getItem("user") ?? "null")
    return u?.businessType === "GYM" || u?.businessType === "STANDARD" ? u.businessType : null
  } catch {
    return null
  }
}

function store(t: BusinessType) {
  cached = t
  try {
    const u = JSON.parse(localStorage.getItem("user") ?? "null")
    if (u && u.businessType !== t) localStorage.setItem("user", JSON.stringify({ ...u, businessType: t }))
  } catch {
    /* ignora */
  }
  listeners.forEach((l) => l(t))
}

export function getCachedBusinessType(): BusinessType | null {
  if (cached) return cached
  cached = readStored()
  return cached
}

export async function resolveBusinessType(): Promise<BusinessType> {
  const known = getCachedBusinessType()
  if (known) return known
  if (!inflight) {
    inflight = getOrganization()
      .then((org) => {
        const t: BusinessType = org.businessType === "GYM" ? "GYM" : "STANDARD"
        store(t)
        return t
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function subscribeBusinessType(listener: (t: BusinessType) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function resetBusinessTypeCache(): void {
  cached = null
  inflight = null
}

/** Página inicial de cada tipo de empresa. */
export function homePathFor(t: BusinessType | null | undefined): string {
  return t === "GYM" ? "/academia" : "/dashboard"
}

/** Rotas do sistema atual (escondidas para academia). */
export const STANDARD_ONLY_PATHS = ["/dashboard", "/ponto", "/colaboradores", "/clientes", "/estoque"]
/** Rotas exclusivas da academia. */
export const GYM_ONLY_PATHS = ["/academia"]

export function isPathAllowed(pathname: string, t: BusinessType): boolean {
  const matches = (list: string[]) => list.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  return t === "GYM" ? !matches(STANDARD_ONLY_PATHS) : !matches(GYM_ONLY_PATHS)
}
