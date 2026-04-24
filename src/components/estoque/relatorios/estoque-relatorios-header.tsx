"use client"

import { EstoqueSubpageHeader } from "../estoque-subpage-header"

export type EstoqueRelatoriosHeaderProps = {
  title?: string
  subtitle?: string
  onBack: () => void
}

export function EstoqueRelatoriosHeader({
  title = "Relatórios de Estoque",
  subtitle = "Visualize análises e relatórios do estoque",
  onBack,
}: EstoqueRelatoriosHeaderProps) {
  return <EstoqueSubpageHeader title={title} subtitle={subtitle} onBack={onBack} />
}
