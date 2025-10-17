"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

export const StatementPDF = ({ data }: { data: any }) => {
  console.log("StatementPDF data:", data);
  const companyName = data.companyName || "";
  const userEmail = data.userEmail || "";
  const transactions = Array.isArray(data.transactions)
    ? data.transactions
    : data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {/* Izquierda: logo + empresa + mail */}
          <View style={styles.leftHeader}>
            <Image src="/logo-takenos-transparent.png" style={styles.logo} />
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>{companyName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
          </View>

          {/* Derecha: título + fecha */}
          <View style={styles.headerRight}>
            <Text style={styles.headerText}>Extracto de movimientos</Text>
            <Text style={styles.issuedAt}>
              Emitido el{" "}
              {new Date().toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              a las{" "}
              {new Date().toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}{" "}
              hs
            </Text>
          </View>
        </View>

        {/* Línea divisoria */}
        <View style={styles.separator} />

        {/* Encabezado tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, styles.colDate]}>Fecha</Text>
          <Text style={[styles.th, styles.colAccount]}>Cuenta/Destino</Text>
          <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
          <Text style={[styles.th, styles.colAmount]}>Monto</Text>
          <Text style={[styles.th, styles.colStatus]}>Estado</Text>
        </View>

        {transactions.map((t: any, i: number) => {
          return (
            <View style={styles.row} key={i}>
              <Text style={[styles.cell, styles.colDate]}>{fmtDate(t.date)}</Text>
              <Text style={[styles.cell, styles.colAccount]}>
                {truncateAccount(t.account_ref || t.cuenta_origen_o_destino || t.nickname || "-")}
              </Text>
              <Text style={[styles.cell, styles.colDesc]}>
                {truncateDescription(t.description || "")}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.colAmount,
                  t.amount < 0 ? styles.debit : styles.credit,
                ]}
              >
                {t.amount < 0
                  ? `-$${Math.abs(t.amount).toLocaleString()}`
                  : `$${t.amount.toLocaleString()}`}
              </Text>
              <Text style={[styles.cell, styles.colStatus]}>
                {truncateStatus(t.status.charAt(0).toUpperCase() + t.status.slice(1))}
              </Text>
            </View>
          );
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado automáticamente por Takenos — No requiere firma
            ni sello.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// 🔹 Formateador de fecha
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

// 🔹 Funciones para truncar texto
const truncateText = (text: string, maxLength: number) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const truncateDescription = (desc: string) => truncateText(desc, 25);
const truncateAccount = (account: string) => truncateText(account, 20);
const truncateStatus = (status: string) => truncateText(status, 10);

// 🎨 Estilos refinados
const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 9, fontFamily: "Helvetica" }, // Reducido padding y fontSize
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8, // Más reducido para subir el contenido
  },
  leftHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: 8, // Alinea mejor con el logo
  },
  logo: { width: 120, height: 32, objectFit: "contain", marginBottom: 2 }, // Más compacto
  companyBlock: { flexDirection: "column", gap: 1 },
  companyName: { fontSize: 9, color: "#374151", fontWeight: 600 },
  userEmail: { fontSize: 8, color: "#6b7280" },
  headerText: {
    fontSize: 13, // Reducido
    color: "#7044d2",
    fontWeight: 500,
  },
  issuedAt: {
    fontSize: 8, // Reducido
    color: "#6b7280",
    textAlign: "right",
    marginTop: 1,
  },
  separator: {
    borderBottom: 1,
    borderColor: "#ECECEC",
    marginTop: 4, // Margen superior más pequeño
    marginBottom: 6, // Margen inferior más pequeño
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#ECECEC",
    marginBottom: 3, // Más reducido
    backgroundColor: "#F8F9FA", // Fondo ligero para header
    paddingVertical: 3, // Ligeramente más padding vertical
    paddingTop: 1, // Padding superior mínimo para estar más cerca de la línea
  },
  th: {
    fontWeight: "bold",
    paddingRight: 4,
    fontSize: 8,
    paddingVertical: 3,
  },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#F2F2F2",
    paddingVertical: 4,
    minHeight: 24, // Más altura para texto truncado
    alignItems: "stretch", // Para que todas las celdas tengan la misma altura
  },
  cell: {
    fontSize: 8,
    paddingRight: 4,
    paddingVertical: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  colDate: {
    width: "15%",
    fontSize: 7,
    flexShrink: 0, // No se encoge
  },
  colDesc: {
    width: "28%",
    fontSize: 7,
    flexWrap: "wrap", // Permite wrap
    flexShrink: 1,
  },
  colAccount: {
    width: "27%",
    fontSize: 7,
    flexWrap: "wrap", // Permite wrap
    flexShrink: 1,
  },
  colAmount: {
    width: "15%",
    textAlign: "right",
    fontSize: 8,
    flexShrink: 0, // No se encoge
  },
  colStatus: {
    width: "15%",
    textAlign: "right",
    fontSize: 7,
    flexShrink: 0, // No se encoge
  },
  right: { textAlign: "right" },
  credit: { color: "#22C55E" },
  debit: { color: "#EF4444" },
  footer: {
    position: "absolute",
    bottom: 15, // Reducido
    left: 20,
    right: 20,
    textAlign: "center",
  },
  footerText: {
    fontSize: 7, // Reducido
    color: "#9ca3af",
  },
});
