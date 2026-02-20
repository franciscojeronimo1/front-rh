"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"

interface CategorySelectProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CategorySelect({
  value,
  onChange,
  placeholder = "Selecione uma categoria",
  disabled = false,
  className,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null)
  const [editName, setEditName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [editError, setEditError] = useState("")

  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const response = await getCategories()
      setCategories(response.categories)
    } catch {
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleCreate = async () => {
    const name = newCategoryName.trim()
    if (!name) return

    try {
      setIsCreating(true)
      setCreateError("")
      const response = await createCategory(name)
      setCategories((prev) => [...prev, response.category])
      onChange(response.category.name)
      setNewCategoryName("")
      setModalOpen(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erro ao criar categoria")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (cat: { id: string; name: string }) => {
    setEditingCategory(cat)
    setEditName(cat.name)
    setEditError("")
  }

  const handleUpdate = async () => {
    if (!editingCategory) return
    const name = editName.trim()
    if (!name) return

    try {
      setIsUpdating(true)
      setEditError("")
      const response = await updateCategory(editingCategory.id, name)
      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? response.category : c))
      )
      if (value === editingCategory.name) onChange(response.category.name)
      setEditingCategory(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao atualizar categoria")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = (cat: { id: string; name: string }) => {
    setCategoryToDelete(cat)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    try {
      setIsDeleting(true)
      await deleteCategory(categoryToDelete.id)
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
      if (value === categoryToDelete.name) onChange("")
      setCategoryToDelete(null)
    } catch {
      setCategoryToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const NONE_VALUE = "__none__"

  return (
    <div className={cn("flex gap-2", className)}>
      <Select
        value={value || NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE ? "" : v)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="flex-1 w-full">
          <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
          {value &&
            !categories.some((c) => c.name === value) && (
              <SelectItem value={value}>{value}</SelectItem>
            )}
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.name}>
              <span className="flex items-center justify-between w-full gap-2 pr-2">
                <span className="flex-1 truncate">{cat.name}</span>
                <span className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 min-w-7"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleEditClick(cat)
                    }}
                    title="Editar categoria"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 min-w-7 text-destructive hover:text-destructive"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteClick(cat)
                    }}
                    title="Excluir categoria"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setModalOpen(true)}
        disabled={disabled}
        title="Adicionar nova categoria"
        className="shrink-0"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Digite o nome da nova categoria para adicioná-la ao cadastro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Ex: Cabos"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
            />
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!newCategoryName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Altere o nome da categoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Ex: Cabos"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUpdate())}
            />
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingCategory(null)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={!editName.trim() || isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria &quot;{categoryToDelete?.name}&quot;?
              Produtos vinculados a ela ficarão sem categoria.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
