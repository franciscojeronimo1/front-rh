"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { getProducts, getProductById, type Product } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ChevronDown, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEBOUNCE_MS = 350
const SEARCH_LIMIT = 15

interface ProductComboboxProps {
  value: string
  onChange: (productId: string) => void
  onProductSelect?: (product: Product | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Exibir estoque nos itens (para página de saída) */
  showStock?: boolean
  /** Filtrar apenas produtos com estoque > 0 (para página de saída) */
  onlyWithStock?: boolean
}

function formatProductLabel(product: Product, showStock?: boolean) {
  const base = `${product.name}${product.code ? ` (${product.code})` : ""}`
  if (showStock) {
    return `${base} - Estoque: ${product.currentStock} ${product.unit}`
  }
  return base
}

export function ProductCombobox({
  value,
  onChange,
  onProductSelect,
  placeholder = "Digite para buscar produto...",
  disabled = false,
  className,
  showStock = false,
  onlyWithStock = false,
}: ProductComboboxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoadingSelected, setIsLoadingSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchProducts = useCallback(
    async (search: string) => {
      try {
        setIsLoading(true)
        const response = await getProducts({
          search: search.trim() || undefined,
          limit: SEARCH_LIMIT,
          page: 1,
        })
        let list = response.products
        if (onlyWithStock) {
          list = list.filter((p) => p.currentStock > 0)
        }
        setProducts(list)
      } catch {
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    },
    [onlyWithStock]
  )

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      fetchProducts(searchTerm)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchTerm, isOpen, fetchProducts])

  useEffect(() => {
    if (value && !selectedProduct) {
      setIsLoadingSelected(true)
      getProductById(value)
        .then((res) => {
          setSelectedProduct(res.product)
          onProductSelect?.(res.product)
        })
        .catch(() => {
          setSelectedProduct(null)
          onProductSelect?.(null)
        })
        .finally(() => setIsLoadingSelected(false))
    } else if (!value) {
      setSelectedProduct(null)
      onProductSelect?.(null)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (product: Product) => {
    setSelectedProduct(product)
    onChange(product.id)
    onProductSelect?.(product)
    setSearchTerm("")
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProduct(null)
    onChange("")
    onProductSelect?.(null)
    setSearchTerm("")
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (!searchTerm && !value) {
      fetchProducts("")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setSearchTerm(v)
    if (value) {
      setSelectedProduct(null)
      onChange("")
      onProductSelect?.(null)
    }
    setIsOpen(true)
  }

  const selectedLabel = selectedProduct ? formatProductLabel(selectedProduct, showStock) : ""
  const displayValue = isOpen ? (searchTerm || selectedLabel) : selectedLabel

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={isLoadingSelected ? "Carregando..." : placeholder}
          disabled={disabled || isLoadingSelected}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          className="pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Limpar seleção"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
            />
          )}
        </div>
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : products.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {searchTerm ? "Nenhum produto encontrado" : "Digite para buscar"}
            </div>
          ) : (
            <ul className="p-1">
              {products.map((product) => (
                <li
                  key={product.id}
                  role="option"
                  tabIndex={0}
                  className="cursor-pointer rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleSelect(product)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleSelect(product)
                    }
                  }}
                >
                  {formatProductLabel(product, showStock)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
