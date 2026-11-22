import { authenticatedFetchWithRetry } from "./http"

export interface Organization {
  id: string
  name: string
  cnpj?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  businessType: "STANDARD" | "GYM"
  billingExempt: boolean
}

export async function getOrganization(): Promise<Organization> {
  const res = await authenticatedFetchWithRetry("/organizations")
  return res.json() as Promise<Organization>
}
