import * as z from "zod"

export const bookletCreateSchema = z.object({
  description: z.string().optional(),
  notes: z.string().optional(),
  installmentCount: z
    .string()
    .min(1, "Informe a quantidade de parcelas")
    .refine((v) => {
      const n = parseInt(v, 10)
      return !isNaN(n) && n >= 1 && n <= 48
    }, "Entre 1 e 48 parcelas"),
  installmentAmount: z
    .string()
    .min(1, "Informe o valor da parcela")
    .refine((v) => {
      const n = parseFloat(v.replace(",", "."))
      return !isNaN(n) && n > 0
    }, "Valor deve ser maior que zero"),
  firstDueDate: z
    .string()
    .min(1, "Informe o primeiro vencimento")
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida"),
})

export type BookletCreateFormValues = z.infer<typeof bookletCreateSchema>
