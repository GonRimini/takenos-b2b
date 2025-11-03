"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

export interface DepositReceiptData {
  id: string;
  account_ref: string;
  amount: number;
  description: string;
  date: string;
  // Datos adicionales del contexto para generar el PDF completo
  companyName?: string;
  userEmail?: string;
}

export const DepositReceiptPDF = ({
  data,
}: {
  data: DepositReceiptData;
}) => {
  const { account_ref, amount, description, date, id, companyName, userEmail } = data;

  // Formatear monto
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formatear concepto para que sea más legible
  const formatConcept = (concept: string) => {
    if (!concept) return "Depósito";

    // Convertir camelCase a texto legible
    const formatted = concept
      .replace(/([A-Z])/g, " $1") // Agregar espacios antes de mayúsculas
      .replace(/^./, (str) => str.toUpperCase()) // Primera letra mayúscula
      .trim();

    return formatted || "Depósito";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {/* Izquierda: logo + empresa + mail */}
          <View style={styles.leftHeader}>
            <Image src="/logo-takenos-transparent.png" style={styles.logo} />
            <View style={styles.companyBlock}>
              <Text style={styles.companyName}>{companyName || "Takenos"}</Text>
              <Text style={styles.userEmail}>{userEmail || ""}</Text>
            </View>
          </View>

          {/* Derecha: título + fecha */}
          <View style={styles.headerRight}>
            <Text style={styles.headerText}>Comprobante de depósito</Text>
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

        {/* Importe del depósito */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Importe del depósito</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountValue}>
              {formatAmount(amount)}
            </Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.sectionSeparator} />

        {/* Datos del depósito */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID del depósito</Text>
            <Text style={styles.detailValue}>{id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cuenta de referencia</Text>
            <Text style={styles.detailValue}>{account_ref}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Descripción</Text>
            <Text style={styles.detailValue}>
              {formatConcept(description)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha del depósito</Text>
            <Text style={styles.detailValue}>
              {formatDate(date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado</Text>
            <Text style={styles.detailValue}>Procesado</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Recuerde que puede consultar e imprimir este comprobante ingresando
            {"\n"}
            al portal de empresas.
          </Text>
          <Text style={styles.receiptNumber}>
            N° comprobante {id.slice(-8)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Estilos para el PDF de comprobante de depósito
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  leftHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    marginTop: 8,
  },
  logo: {
    width: 120,
    height: 32,
    objectFit: "contain",
    marginBottom: 2,
  },
  companyBlock: {
    flexDirection: "column",
    gap: 1,
  },
  companyName: {
    fontSize: 9,
    color: "#374151",
    fontWeight: 600,
  },
  userEmail: {
    fontSize: 8,
    color: "#6b7280",
  },
  headerText: {
    fontSize: 13,
    color: "#7044d2",
    fontWeight: 500,
  },
  issuedAt: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 1,
  },
  separator: {
    borderBottom: 1,
    borderColor: "#ECECEC",
    marginTop: 4,
    marginBottom: 6,
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  amountLabel: { 
    fontSize: 11, 
    color: "#374151", 
    fontWeight: "normal" 
  },
  amountValue: { 
    fontSize: 14, 
    color: "#374151", 
    fontWeight: "bold" 
  },
  amountContainer: { 
    flexDirection: "column", 
    alignItems: "flex-end" 
  },
  sectionSeparator: {
    marginVertical: 8,
  },
  detailsSection: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: 1,
    borderColor: "#F2F2F2",
  },
  detailLabel: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "normal",
    width: "40%",
  },
  detailValue: {
    fontSize: 9,
    color: "#374151",
    fontWeight: "bold",
    textAlign: "right",
    width: "60%",
  },
  footer: {
    position: "absolute",
    bottom: 15,
    left: 20,
    right: 20,
    textAlign: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 8,
  },
  receiptNumber: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
  },
});
