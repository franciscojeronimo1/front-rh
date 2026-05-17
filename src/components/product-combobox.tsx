"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Input } from "@/components/ui/input"
import { getProducts, getProductById, type Product } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ChevronDown, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const DEBOUNCE_MS = 350
const SEARCH_LIMIT = 15
const DROPDOWN_MAX_HEIGHT = 240
const VIEWPORT_PADDING = 8

interface ProductComboboxProps {
  value: string
  onChange: (productId: string) => void
  onProductSelect?: (product: Product | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showStock?: boolean
  onlyWithStock?: boolean
  excludeProductIds?: string[]
}

type DropdownPosition = {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

function formatProductLabel(product: Product, showStock?: boolean) {
  const base = `${product.name}${product.code ? ` (${product.code})` : ""}`
  if (showStock) {
    return `${base} - Estoque: ${product.currentStock} ${product.unit}`
  }
  return base
}

function computeDropdownPosition(anchor: HTMLElement): DropdownPosition {
  const rect = anchor.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow
  const maxHeight = Math.min(
    DROPDOWN_MAX_HEIGHT,
    Math.max(120, openUpward ? spaceAbove - 4 : spaceBelow - 4)
  )

  if (openUpward) {
    return {
      bottom: window.innerHeight - rect.top + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    }
  }

  return {
    top: rect.bottom + 4,
    left: rect.left,
    width: rect.width,
    maxHeight,
  }
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
  excludeProductIds = [],
}: ProductComboboxProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isLoadingSelected, setIsLoadingSelected] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
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
        if (excludeProductIds.length > 0) {
          const excluded = new Set(excludeProductIds)
          list = list.filter((p) => p.id === value || !excluded.has(p.id))
        }
        setProducts(list)
      } catch {
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    },
    [onlyWithStock, excludeProductIds, value]
  )

  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return
    setDropdownPosition(computeDropdownPosition(inputRef.current))
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      fetchProducts(searchTerm)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchTerm, isOpen, fetchProducts])

  useEffect(() => {
    if (excludeProductIds.length === 0) return
    const excluded = new Set(excludeProductIds)
    setProducts((prev) => prev.filter((p) => p.id === value || !excluded.has(p.id)))
  }, [excludeProductIds, value])

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
    if (!isOpen) {
      setDropdownPosition(null)
      return
    }

    updateDropdownPosition()

    const handleReposition = () => updateDropdownPosition()
    window.addEventListener("resize", handleReposition)
    window.addEventListener("scroll", handleReposition, true)

    return () => {
      window.removeEventListener("resize", handleReposition)
      window.removeEventListener("scroll", handleReposition, true)
    }
  }, [isOpen, updateDropdownPosition, products.length, isLoading])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (listboxRef.current?.contains(target)) return
      setIsOpen(false)
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
    updateDropdownPosition()
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
    updateDropdownPosition()
  }

  const selectedLabel = selectedProduct ? formatProductLabel(selectedProduct, showStock) : ""
  const displayValue = isOpen ? (searchTerm || selectedLabel) : selectedLabel

  const dropdownContent =
    isOpen && dropdownPosition ? (
      <div
        ref={listboxRef}
        role="listbox"
        style={{
          position: "fixed",
          top: dropdownPosition.top,
          bottom: dropdownPosition.bottom,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          maxHeight: dropdownPosition.maxHeight,
        }}
        className="z-[200] overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando...
          </div>
        ) : products.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground px-2">
            {searchTerm
              ? excludeProductIds.length > 0
                ? "Nenhum produto disponível (já selecionado em outra linha ou não encontrado)"
                : "Nenhum produto encontrado"
              : excludeProductIds.length > 0
                ? "Produtos restantes já estão em outras linhas — digite para buscar outros"
                : "Digite para buscar"}
          </div>
        ) : (
          <ul className="p-1">
            {products.map((product) => (
              <li
                key={product.id}
                role="option"
                tabIndex={0}
                className="cursor-pointer rounded-sm px-2 py-2 text-sm whitespace-normal break-words outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
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
    ) : null

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

      {mounted && dropdownContent ? createPortal(dropdownContent, document.body) : null}
    </div>
  )
}
