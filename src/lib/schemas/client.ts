import * as z from "zod"

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

export function formatCpf(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export function formatPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

export function formatZipCode(value: string): string {
  const d = digitsOnly(value).slice(0, 8)
  return d.replace(/(\d{5})(\d)/, "$1-$2")
}

function isValidCpf(value: string): boolean {
  const cpf = digitsOnly(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i)
  }
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== parseInt(cpf.charAt(9), 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i)
  }
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  return rest === parseInt(cpf.charAt(10), 10)
}

const optionalEmail = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    "E-mail inválido"
  )

const optionalState = z
  .string()
  .optional()
  .refine((v) => !v || v.trim() === "" || v.trim().length === 2, "UF deve ter 2 caracteres")

const optionalZip = z
  .string()
  .optional()
  .refine(
    (v) => !v || v.trim() === "" || digitsOnly(v).length === 8,
    "CEP deve ter 8 dígitos"
  )

export const clientFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((v) => isValidCpf(v), "CPF inválido"),
  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .refine((v) => {
      const d = digitsOnly(v)
      return d.length >= 10 && d.length <= 11
    }, "Telefone deve ter 10 ou 11 dígitos"),
  email: optionalEmail,
  street: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: optionalState,
  zipCode: optionalZip,
  addressReference: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>
