import EstoqueGuard from "./EstoqueGuard"

export const dynamic = "force-dynamic"

export default function EstoqueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <EstoqueGuard>{children}</EstoqueGuard>
}
