"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatBrlOptional, type UsageExitRow } from "@/lib/estoque/relatorios-utils"

export type UsageExitsTableProps = {
  rows: UsageExitRow[]
}

export function UsageExitsTable({ rows }: UsageExitsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Preço unit.</TableHead>
            <TableHead>Valor total</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Projeto</TableHead>
            <TableHead>Tipo serviço</TableHead>
            <TableHead>Observações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.productName}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>{row.unit}</TableCell>
              <TableCell>{formatBrlOptional(row.unitPrice)}</TableCell>
              <TableCell>{formatBrlOptional(row.totalPrice)}</TableCell>
              <TableCell>{row.clientName || "-"}</TableCell>
              <TableCell>{row.projectName || "-"}</TableCell>
              <TableCell>{row.serviceType || "-"}</TableCell>
              <TableCell>{row.notes || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
