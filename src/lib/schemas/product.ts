import * as z from "zod"

const costPriceSchema = z.string().optional().refine(
  (val) => {
    if (!val || val === "") return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  },
  "Preço deve ser >= 0"
)

const salePriceSchema = z.string().optional().refine(
  (val) => {
    if (!val || val === "") return true
    const num = parseFloat(val)
    return !isNaN(num) && num > 0
  },
  "Preço de venda deve ser maior que 0 quando informado"
)

const minStockSchema = z.string().refine(
  (val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  },
  "Estoque mínimo deve ser >= 0"
)

const minStockOptionalSchema = z.string().optional().refine(
  (val) => {
    if (!val || val === "") return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  },
  "Estoque mínimo deve ser >= 0"
)

const currentStockSchema = z.string().optional().refine(
  (val) => {
    if (!val || val === "") return true
    const num = parseInt(val, 10)
    return !isNaN(num) && num >= 0
  },
  "Estoque atual deve ser um número inteiro >= 0"
)

const expirationDateSchema = z.string().optional().refine(
  (val) => {
    if (val === undefined || val === "") return true
    const t = Date.parse(val)
    return !isNaN(t)
  },
  "Data de validade inválida"
)

/** Schema para criação de produto */
export const productCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  expirationDate: expirationDateSchema,
  minStock: minStockSchema,
  unit: z.string().min(1, "Unidade é obrigatória"),
  costPrice: costPriceSchema,
  salePrice: salePriceSchema,
  supplierName: z.string().optional(),
  supplierDoc: z.string().optional(),
  active: z.boolean().optional(),
})

/** Schema para atualização de produto */
export const productUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  code: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  expirationDate: expirationDateSchema,
  minStock: minStockOptionalSchema,
  currentStock: currentStockSchema,
  unit: z.string().optional(),
  costPrice: costPriceSchema,
  salePrice: salePriceSchema,
  supplierName: z.string().optional(),
  supplierDoc: z.string().optional(),
  active: z.boolean().optional(),
})

export type ProductCreateFormValues = z.infer<typeof productCreateSchema>
export type ProductUpdateFormValues = z.infer<typeof productUpdateSchema>
