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
          <Text style={[styles.th, styles.colDesc]}>Descripción</Text>
          <Text style={[styles.th, styles.colAmount]}>Monto</Text>
          <Text style={[styles.th, styles.colStatus]}>Estado</Text>
        </View>

        {transactions.map((t: any, i: number) => (
          <View style={styles.row} key={i}>
            <Text style={[styles.cell, styles.colDate]}>{fmtDate(t.date)}</Text>
            <Text style={[styles.cell, styles.colDesc]}>{t.description}</Text>
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
              {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
            </Text>
          </View>
        ))}

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

// 🎨 Estilos refinados
const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: "Helvetica" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  logo: { width: 80, height: 20, objectFit: "contain", marginBottom: 3 },
  companyBlock: { flexDirection: "column", gap: 1 },
  companyName: { fontSize: 10, color: "#374151", fontWeight: 600 },
  userEmail: { fontSize: 9, color: "#6b7280" },
  headerText: {
    fontSize: 15,
    color: "#7044d2", // más suave
    fontWeight: 500,
  },
  issuedAt: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 2,
  },
  separator: {
    borderBottom: 1,
    borderColor: "#ECECEC",
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#ECECEC",
    marginBottom: 6,
  },
  th: {
    fontWeight: "bold",
    paddingRight: 6,
  },
  row: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#F2F2F2",
    paddingVertical: 4,
    alignItems: "flex-start", // 👈 para que el texto largo no empuje
  },
  cell: {
    fontSize: 10,
    paddingRight: 6,
  },
  colDate: {
    width: "22%", // más espacio para fechas tipo "30 de sept de 2025"
  },
  colDesc: {
    width: "42%", // 👈 descripción con más aire y wrap automático
  },
  colAmount: {
    width: "20%",
    textAlign: "right",
  },
  colStatus: {
    width: "16%",
    textAlign: "right",
  },
  right: { textAlign: "right" },
  credit: { color: "#22C55E" },
  debit: { color: "#EF4444" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});
