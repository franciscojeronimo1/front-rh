/** Cache em memória do "módulo Academia ligado?" compartilhado entre menu, sino e páginas. */
let cachedEnabled: boolean | null = null
const listeners = new Set<(enabled: boolean) => void>()

export function getCachedGymEnabled(): boolean | null {
  return cachedEnabled
}

export function setGymModuleEnabled(enabled: boolean): void {
  cachedEnabled = enabled
  listeners.forEach((l) => l(enabled))
}

export function resetGymModuleCache(): void {
  cachedEnabled = null
}

export function subscribeGymModule(listener: (enabled: boolean) => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
