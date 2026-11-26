"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { AlertTriangle, ArrowLeft, CheckCircle2, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AcademiaPageHeader } from "@/components/academia/academia-page-header"
import { useIsAdmin } from "@/hooks/useIsAdmin"
import {
  getMembershipPlans,
  importMembers,
  previewMemberImport,
  type ImportField,
  type ImportMapping,
  type ImportPreview,
  type ImportPreviewRow,
  type ImportRequest,
  type ImportResult,
} from "@/lib/api/gym"
import { formatMoney } from "@/lib/academia/format"

const NONE = "none"
const MAX_FILE_MB = 3

const ACTION_LABEL: Record<ImportPreviewRow["action"], { label: string; className: string }> = {
  create: { label: "Novo", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  update: { label: "Atualizar", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  skip: { label: "Pular", className: "bg-muted text-muted-foreground" },
  error: { label: "Erro", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
}

/** Campos mostrados primeiro no mapeamento. */
const MAIN_FIELDS: ImportField[] = ["name", "cpf", "phone", "email", "birthDate", "accessCode", "status", "planName", "planPrice", "planEnd"]

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? "")
      resolve(result.includes(",") ? result.split(",")[1]! : result)
    }
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"))
    reader.readAsDataURL(f)
  })
}

/** Mesmo critério do backend para reconhecer um plano pelo nome (sem acento/maiúsculas). */
const planKey = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

const ymdBR = (ymd: string | null) => (ymd ? ymd.split("-").reverse().join("/") : "—")
const cpfMask = (c: string | null) => (c ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "—")
const phoneMask = (p: string | null) =>
  p ? (p.length === 11 ? p.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : p.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")) : "—"

export default function ImportarAlunosPage() {
  const isAdmin = useIsAdmin()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [request, setRequest] = useState<Omit<ImportRequest, "file" | "fileName">>({})
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<"all" | "problems">("all")
  const [showAllFields, setShowAllFields] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [existingPlans, setExistingPlans] = useState<string[] | null>(null)

  const runPreview = async (f: { name: string; base64: string }, req: Omit<ImportRequest, "file" | "fileName">) => {
    setLoading(true)
    setError("")
    try {
      const p = await previewMemberImport({ file: f.base64, fileName: f.name, ...req })
      setPreview(p)
      setRequest({
        headerRow: p.headerRow,
        mapping: p.mapping,
        duplicates: p.options.duplicates,
        createPlans: p.options.createPlans,
        importInactive: p.options.importInactive,
      })
    } catch (err) {
      setPreview(null)
      setError(err instanceof Error ? err.message : "Erro ao analisar o arquivo")
    } finally {
      setLoading(false)
    }
  }

  const onFile = async (f: File | undefined) => {
    if (!f) return
    setResult(null)
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Arquivo muito grande (máx. ${MAX_FILE_MB} MB). Exporte só as colunas de cadastro.`)
      return
    }
    try {
      const base64 = await fileToBase64(f)
      const loaded = { name: f.name, base64 }
      setFile(loaded)
      await runPreview(loaded, {})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler o arquivo")
    }
  }

  const change = (patch: Partial<Omit<ImportRequest, "file" | "fileName">>) => {
    if (!file) return
    const next = { ...request, ...patch }
    setRequest(next)
    void runPreview(file, next)
  }

  const setField = (field: ImportField, value: string) => {
    const mapping: ImportMapping = { ...(request.mapping ?? {}) }
    if (value === NONE) mapping[field] = null
    else mapping[field] = Number(value)
    change({ mapping })
  }

  const openConfirm = async () => {
    if (!preview) return
    setConfirmOpen(true)
    // Planos que já existem, para mostrar quais a importação vai criar
    if (request.createPlans !== false && existingPlans === null) {
      try {
        const { plans } = await getMembershipPlans()
        setExistingPlans(plans.map((p) => planKey(p.name)))
      } catch {
        setExistingPlans([])
      }
    }
  }

  const doImport = async () => {
    if (!file || !preview) return
    setImporting(true)
    setError("")
    try {
      const res = await importMembers({ file: file.base64, fileName: file.name, ...request })
      setResult(res)
      setPreview(null)
      setConfirmOpen(false)
      setExistingPlans(null)
      toast.success(res.message)
    } catch (err) {
      setConfirmOpen(false)
      setError(err instanceof Error ? err.message : "Erro ao importar")
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError("")
    setRequest({})
    if (inputRef.current) inputRef.current.value = ""
  }

  const rows = useMemo(() => {
    if (!preview) return []
    return filter === "problems" ? preview.rows.filter((r) => r.errors.length || r.warnings.length) : preview.rows
  }, [preview, filter])

  const fields = useMemo(() => {
    if (!preview) return []
    const main = preview.fields.filter((f) => MAIN_FIELDS.includes(f.key))
    const rest = preview.fields.filter((f) => !MAIN_FIELDS.includes(f.key))
    return showAllFields ? [...main, ...rest] : main
  }, [preview, showAllFields])

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-4 md:p-8">
        <Alert>
          <AlertDescription>Só administradores podem importar alunos.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const toImport = preview ? preview.summary.create + preview.summary.update : 0
  const plansToCreate =
    preview && request.createPlans !== false && existingPlans !== null
      ? Array.from(
          new Map(
            preview.rows
              .filter((r) => (r.action === "create" || r.action === "update") && r.data.planName && r.data.planEnd)
              .map((r) => [planKey(r.data.planName!), r.data.planName!])
          ).entries()
        )
          .filter(([k]) => !existingPlans.includes(k))
          .map(([, name]) => name)
      : []

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <AcademiaPageHeader
          title="Importar alunos"
          subtitle="Traga os alunos do sistema antigo (Secullum ou planilha) sem digitar um por um."
          actions={
            <Button asChild variant="outline">
              <Link href="/academia/alunos">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para alunos
              </Link>
            </Button>
          }
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 1. Arquivo */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">1. Arquivo</CardTitle>
            <CardDescription>
              No Secullum Academia.Net, abra o relatório de cadastro de pessoas/alunos, escolha os campos (Nome, CPF, Celular,
              E-mail, Nascimento, Senha, Serviço, Valor, Vencimento, Situação) e exporte em <b>Excel</b> ou <b>CSV</b>. Também
              serve qualquer planilha com uma linha de títulos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              data-testid="import-file"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={loading || importing}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {file ? "Trocar arquivo" : "Escolher arquivo"}
            </Button>
            {file && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" /> {file.name}
                {preview && (
                  <>
                    {" "}· {preview.file.format.toUpperCase()}
                    {preview.file.encoding ? ` · ${preview.file.encoding === "latin1" ? "Latin-1" : "UTF-8"}` : ""}
                    {preview.file.delimiter ? ` · separador "${preview.file.delimiter === "\t" ? "TAB" : preview.file.delimiter}"` : ""}
                    {preview.file.sheetName ? ` · aba "${preview.file.sheetName}"` : ""}
                  </>
                )}
              </span>
            )}
          </CardContent>
        </Card>

        {/* 2. Colunas */}
        {preview && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">2. Confira as colunas</CardTitle>
              <CardDescription>
                Reconhecemos as colunas pelo título. Se algo estiver errado, escolha a coluna certa. Campos sem lugar próprio (RG,
                endereço, código antigo) vão para as observações do aluno.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label htmlFor="header-row">Linha dos títulos</Label>
                  <Input
                    id="header-row"
                    type="number"
                    min={1}
                    max={preview.file.totalLines}
                    className="w-28"
                    value={(request.headerRow ?? 0) + 1}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value) || 1)
                      change({ headerRow: v - 1, mapping: undefined })
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Aluno que já existe</Label>
                  <Select value={request.duplicates ?? "skip"} onValueChange={(v) => change({ duplicates: v as "skip" | "update" })}>
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Pular (não mexer)</SelectItem>
                      <SelectItem value="update">Atualizar com o arquivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Checkbox checked={request.createPlans !== false} onCheckedChange={(v) => change({ createPlans: v })}>
                  <span className="text-sm">Criar planos que ainda não existem</span>
                </Checkbox>
                <Checkbox checked={request.importInactive !== false} onCheckedChange={(v) => change({ importInactive: v })}>
                  <span className="text-sm">Importar também os inativos</span>
                </Checkbox>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((f) => {
                  const idx = request.mapping?.[f.key]
                  const col = idx !== undefined && idx !== null ? preview.columns[idx] : undefined
                  return (
                    <div key={f.key} className="space-y-1 rounded-lg border p-3">
                      <Label className="text-sm">
                        {f.label}
                        {f.required && <span className="text-red-600"> *</span>}
                      </Label>
                      <Select value={idx === undefined || idx === null ? NONE : String(idx)} onValueChange={(v) => setField(f.key, v)}>
                        <SelectTrigger className="w-full" data-testid={`map-${f.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>— não importar —</SelectItem>
                          {preview.columns.map((c) => (
                            <SelectItem key={c.index} value={String(c.index)}>
                              {c.header || `Coluna ${c.index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="truncate text-xs text-muted-foreground">{col?.samples.length ? `Ex.: ${col.samples.join(" · ")}` : " "}</p>
                    </div>
                  )
                })}
              </div>
              <Button variant="link" className="px-0" onClick={() => setShowAllFields((v) => !v)}>
                {showAllFields ? "Mostrar só os campos principais" : "Mostrar todos os campos (RG, endereço, código antigo…)"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 3. Prévia */}
        {preview && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">3. Prévia</CardTitle>
              <CardDescription>Nada foi gravado ainda. Linhas com erro não serão importadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm" data-testid="import-summary">
                <span className="rounded-full bg-muted px-3 py-1">{preview.summary.total} linhas</span>
                <span className={`rounded-full px-3 py-1 ${ACTION_LABEL.create.className}`}>{preview.summary.create} novos</span>
                {preview.summary.update > 0 && (
                  <span className={`rounded-full px-3 py-1 ${ACTION_LABEL.update.className}`}>{preview.summary.update} a atualizar</span>
                )}
                {preview.summary.skip > 0 && (
                  <span className={`rounded-full px-3 py-1 ${ACTION_LABEL.skip.className}`}>{preview.summary.skip} pulados</span>
                )}
                {preview.summary.error > 0 && (
                  <span className={`rounded-full px-3 py-1 ${ACTION_LABEL.error.className}`}>{preview.summary.error} com erro</span>
                )}
                {preview.summary.withWarnings > 0 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {preview.summary.withWarnings} com aviso
                  </span>
                )}
                <span className="rounded-full bg-muted px-3 py-1">{preview.summary.withPlan} com plano/vencimento</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
                  Todas
                </Button>
                <Button size="sm" variant={filter === "problems" ? "default" : "outline"} onClick={() => setFilter("problems")}>
                  Só erros e avisos
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Linha</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Senha</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead className="min-w-64">Observações da importação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.line} data-testid={`row-${r.line}`}>
                        <TableCell className="text-muted-foreground">{r.line}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_LABEL[r.action].className}`}>
                            {ACTION_LABEL[r.action].label}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{r.data.name || <span className="text-muted-foreground">(sem nome)</span>}</TableCell>
                        <TableCell>{cpfMask(r.data.cpf)}</TableCell>
                        <TableCell>{phoneMask(r.data.phone)}</TableCell>
                        <TableCell className="font-mono">{r.data.accessCode ?? <span className="text-muted-foreground">gerar</span>}</TableCell>
                        <TableCell>
                          {r.data.planName ?? "—"}
                          {r.data.planPrice !== null && <span className="text-muted-foreground"> · {formatMoney(r.data.planPrice)}</span>}
                        </TableCell>
                        <TableCell>{ymdBR(r.data.planEnd)}</TableCell>
                        <TableCell>{r.data.status === "INACTIVE" ? "Inativo" : "Ativo"}</TableCell>
                        <TableCell className="min-w-72 whitespace-normal text-xs">
                          {r.errors.map((e) => (
                            <p key={e} className="flex items-start gap-1 text-red-600">
                              <XCircle className="mt-0.5 h-3 w-3 shrink-0" /> {e}
                            </p>
                          ))}
                          {r.warnings.map((w) => (
                            <p key={w} className="flex items-start gap-1 text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {w}
                            </p>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rows.length && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                          Nenhuma linha para mostrar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void openConfirm()} disabled={importing || loading || toImport === 0} data-testid="import-confirm">
                  Importar {toImport} aluno{toImport === 1 ? "" : "s"}
                </Button>
                <Button variant="outline" onClick={reset} disabled={importing}>
                  Cancelar
                </Button>
                {request.mapping?.name === undefined || request.mapping?.name === null ? (
                  <span className="text-sm text-red-600">Escolha a coluna do nome para continuar.</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        {preview && (
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Confirmar importação"
            description="Confira o resumo antes de gravar. Depois de importados, os alunos aparecem na lista de Alunos."
            confirmLabel={importing ? "Importando..." : `Importar ${toImport} aluno${toImport === 1 ? "" : "s"}`}
            onConfirm={doImport}
            loading={importing}
          >
            <ul className="space-y-1.5 text-sm" data-testid="confirm-summary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  <b>{preview.summary.create}</b> aluno{preview.summary.create === 1 ? "" : "s"} novo{preview.summary.create === 1 ? "" : "s"}
                </span>
              </li>
              {preview.summary.update > 0 && (
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span>
                    <b>{preview.summary.update}</b> aluno{preview.summary.update === 1 ? "" : "s"} já cadastrado{preview.summary.update === 1 ? "" : "s"} será
                    {preview.summary.update === 1 ? "" : "ão"} atualizado{preview.summary.update === 1 ? "" : "s"}
                  </span>
                </li>
              )}
              {preview.summary.skip > 0 && (
                <li className="flex items-center gap-2 text-muted-foreground">
                  <span className="inline-block h-4 w-4 text-center">–</span>
                  <span>
                    {preview.summary.skip} linha{preview.summary.skip === 1 ? "" : "s"} pulada{preview.summary.skip === 1 ? "" : "s"}
                  </span>
                </li>
              )}
              {preview.summary.error > 0 && (
                <li className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span>
                    <b>{preview.summary.error}</b> linha{preview.summary.error === 1 ? "" : "s"} com erro não ser
                    {preview.summary.error === 1 ? "á" : "ão"} importada{preview.summary.error === 1 ? "" : "s"}
                  </span>
                </li>
              )}
              {request.createPlans !== false && (
                <li className="flex items-start gap-2">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    {existingPlans === null ? (
                      <span className="text-muted-foreground">Verificando planos...</span>
                    ) : plansToCreate.length ? (
                      <>
                        Plano{plansToCreate.length === 1 ? "" : "s"} que ser{plansToCreate.length === 1 ? "á" : "ão"} criado{plansToCreate.length === 1 ? "" : "s"}:{" "}
                        <b>{plansToCreate.join(", ")}</b>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Nenhum plano novo será criado</span>
                    )}
                  </span>
                </li>
              )}
            </ul>
          </ConfirmDialog>
        )}

        {/* 4. Resultado */}
        {result && (
          <Card className="rounded-2xl shadow-sm" data-testid="import-result">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Importação concluída
              </CardTitle>
              <CardDescription>
                {result.summary.created} novo(s) · {result.summary.updated} atualizado(s) · {result.summary.skipped} pulado(s) ·{" "}
                {result.summary.errors + result.summary.failed} com erro · {result.summary.memberships} matrícula(s)
                {result.summary.plansCreated.length > 0 && <> · planos criados: {result.summary.plansCreated.join(", ")}</>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.results.some((r) => r.action === "error" || r.action === "failed") && (
                <div className="rounded-lg border border-red-200 p-3 text-sm dark:border-red-900">
                  <p className="mb-1 font-medium">Linhas não importadas</p>
                  {result.results
                    .filter((r) => r.action === "error" || r.action === "failed")
                    .map((r) => (
                      <p key={r.line} className="text-red-600">
                        Linha {r.line}
                        {r.name ? ` (${r.name})` : ""}: {r.message}
                      </p>
                    ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                A contagem de dias sem treinar dos alunos importados começa hoje. Mensalidades antigas não são importadas.
              </p>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href="/academia/alunos">Ver alunos</Link>
                </Button>
                <Button variant="outline" onClick={reset}>
                  Importar outro arquivo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
