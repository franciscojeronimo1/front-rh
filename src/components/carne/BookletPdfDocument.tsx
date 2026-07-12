import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { Booklet } from "@/lib/api"

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

function formatCpf(value: string): string {
  const d = digitsOnly(value).slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(String(value))
  if (isNaN(n)) return "R$ 0,00"
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string): string {
  const datePart = iso.includes("T") ? iso.split("T")[0] : iso
  const [y, m, d] = datePart.split("-")
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function clientAddress(booklet: Booklet): string {
  const c = booklet.client
  if (!c) return "—"
  return (
    [c.street, c.neighborhood, [c.city, c.state].filter(Boolean).join("/"), c.addressReference]
      .filter((p) => p && String(p).trim())
      .join(" · ") || "—"
  )
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e3a5f",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginBottom: 3,
  },
  companyMeta: {
    fontSize: 8,
    color: "#555",
    marginBottom: 1,
  },
  title: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
  },
  clientBox: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#f4f7fb",
    borderWidth: 1,
    borderColor: "#d5dde8",
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    width: 70,
    fontFamily: "Helvetica-Bold",
    color: "#445",
  },
  value: {
    flex: 1,
  },
  coupon: {
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 8,
    flexDirection: "row",
  },
  couponMain: {
    flex: 1,
    padding: 8,
  },
  couponStub: {
    width: 120,
    borderLeftWidth: 1,
    borderLeftColor: "#333",
    borderLeftStyle: "dashed",
    padding: 8,
    backgroundColor: "#fafafa",
  },
  couponTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 4,
    color: "#1e3a5f",
  },
  couponLine: {
    marginBottom: 2,
  },
  amount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginTop: 4,
  },
  stubTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  footer: {
    marginTop: 10,
    fontSize: 7,
    color: "#777",
    textAlign: "center",
  },
})

export function BookletPdfDocument({ booklet }: { booklet: Booklet }) {
  const org = booklet.organization
  const client = booklet.client

  return (
    <Document
      title={`Carnê - ${client?.name ?? "Cliente"}`}
      author={org?.name ?? "Sistema"}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{org?.name ?? "Empresa"}</Text>
          {org?.cnpj ? <Text style={styles.companyMeta}>CNPJ: {org.cnpj}</Text> : null}
          {org?.phone ? <Text style={styles.companyMeta}>Tel: {org.phone}</Text> : null}
          {org?.address ? <Text style={styles.companyMeta}>{org.address}</Text> : null}
          <Text style={styles.title}>CARNÊ DE PAGAMENTO</Text>
          {booklet.description ? (
            <Text style={styles.companyMeta}>Plano / serviço: {booklet.description}</Text>
          ) : null}
        </View>

        <View style={styles.clientBox}>
          <View style={styles.clientRow}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{client?.name ?? "—"}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.label}>CPF</Text>
            <Text style={styles.value}>{client?.cpf ? formatCpf(client.cpf) : "—"}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.label}>Telefone</Text>
            <Text style={styles.value}>{client?.phone ?? "—"}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.label}>Endereço</Text>
            <Text style={styles.value}>{clientAddress(booklet)}</Text>
          </View>
          <View style={styles.clientRow}>
            <Text style={styles.label}>Parcelas</Text>
            <Text style={styles.value}>
              {booklet.installmentCount}x de {formatMoney(booklet.installmentAmount)} · Total{" "}
              {formatMoney(booklet.totalAmount)}
            </Text>
          </View>
        </View>

        {booklet.parcels.map((parcel) => (
          <View key={parcel.id} style={styles.coupon} wrap={false}>
            <View style={styles.couponMain}>
              <Text style={styles.couponTitle}>
                Parcela {parcel.number}/{booklet.installmentCount}
              </Text>
              <Text style={styles.couponLine}>Cliente: {client?.name}</Text>
              <Text style={styles.couponLine}>
                Vencimento: {formatDate(parcel.dueDate)}
              </Text>
              {booklet.description ? (
                <Text style={styles.couponLine}>Referência: {booklet.description}</Text>
              ) : null}
              <Text style={styles.amount}>{formatMoney(parcel.amount)}</Text>
            </View>
            <View style={styles.couponStub}>
              <Text style={styles.stubTitle}>CANHOTO</Text>
              <Text style={styles.couponLine}>Parc. {parcel.number}/{booklet.installmentCount}</Text>
              <Text style={styles.couponLine}>Venc: {formatDate(parcel.dueDate)}</Text>
              <Text style={styles.couponLine}>{formatMoney(parcel.amount)}</Text>
              <Text style={[styles.couponLine, { marginTop: 6 }]}>Pago em: ____/____/______</Text>
              <Text style={[styles.couponLine, { marginTop: 4 }]}>Assinatura:</Text>
              <Text style={styles.couponLine}>________________</Text>
            </View>
          </View>
        ))}

        {booklet.notes ? (
          <Text style={{ marginTop: 6, fontSize: 8 }}>Obs.: {booklet.notes}</Text>
        ) : null}

        <Text style={styles.footer}>
          Documento gerado pelo sistema · Conserve este carnê até a quitação
        </Text>
      </Page>
    </Document>
  )
}
