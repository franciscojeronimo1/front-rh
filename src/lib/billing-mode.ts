/**
 * Guarda se a assinatura do sistema é cobrada manualmente (billingManaged = "MANUAL").
 * Nesse caso nenhuma tela de pagamento/upgrade deve aparecer.
 */
let manual = false

export function setBillingManual(value: boolean): void {
  manual = value
}

export function isBillingManual(): boolean {
  return manual
}

export function resetBillingModeCache(): void {
  manual = false
}
