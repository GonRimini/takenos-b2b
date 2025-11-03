"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface TransactionReceiptData {
  // Datos de la transacción usando keys exactas del API
  transaction: {
    id?: string;
    raw_id?: string;
    date?: string;
    description?: string;
    amount?: number;
    type?: string;
    status?: string;
    direction?: string;
    raw_type?: string;
    account_ref?: string;
    initial_amount?: number;
    final_amount?: number;
    currency?: string;
    conversion_rate?: number;
  };
  // Datos enriquecidos de la cuenta destino
  enrichedData: {
    withdraw_id?: string;
    payout_account_id?: string;
    nickname?: string;
    category?: string;
    method?: string;
    beneficiary_name?: string;
    beneficiary_bank?: string;
    account_number?: string;
    routing_number?: string;
    account_type?: string;
    swift_bic?: string;
    wallet_alias?: string;
    wallet_address?: string;
    wallet_network?: string;
    local_bank?: string;
    local_account_name?: string;
    local_account_number?: string;
    last4?: string;
    created_at?: string;
  };
  // Datos del usuario/empresa
  companyName?: string;
  userEmail?: string;
}

export const TransactionReceiptPDF = ({
  data,
}: {
  data: TransactionReceiptData;
}) => {
  const { transaction, enrichedData, companyName, userEmail } = data;

  // Log para verificar los datos recibidos con keys correctas
  console.log("🎨 [TransactionReceiptPDF] Datos recibidos para PDF:", data);
  console.log(
    "💰 [TransactionReceiptPDF] Transaction con keys correctas:",
    transaction
  );
  console.log("🏦 [TransactionReceiptPDF] EnrichedData:", enrichedData);
  console.log(
    "💳 [TransactionReceiptPDF] Método detectado:",
    enrichedData?.method
  );
  console.log("🔍 [TransactionReceiptPDF] Datos específicos método:", {
    method: enrichedData?.method,
    beneficiary_name: enrichedData?.beneficiary_name,
    beneficiary_bank: enrichedData?.beneficiary_bank,
    account_number: enrichedData?.account_number,
    routing_number: enrichedData?.routing_number,
    account_type: enrichedData?.account_type,
  });
  console.log("💰 [TransactionReceiptPDF] Transacción Retool:", transaction);
  console.log("🏦 [TransactionReceiptPDF] Datos enriquecidos:", enrichedData);

  // Formatear monto
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Formatear monto USD
  const formatAmountUSD = (amountUSD: string | number) => {
    const amount =
      typeof amountUSD === "string" ? parseFloat(amountUSD) : amountUSD;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
    if (!concept) return "Transferencia";

    // Convertir camelCase a texto legible
    const formatted = concept
      .replace(/([A-Z])/g, " $1") // Agregar espacios antes de mayúsculas
      .replace(/^./, (str) => str.toUpperCase()) // Primera letra mayúscula
      .trim();

    // Casos específicos
    if (concept === "individualBusinessPayment")
      return "Pago Comercial Individual";

    return formatted || "Transferencia";
  };

  // Determinar método de pago y datos relevantes usando keys correctas
  const getPaymentMethodInfo = () => {
    // Método desde enriched data (SWIFT, ACH, WIRE)
    const method = enrichedData?.method?.toUpperCase();

    if (method === "SWIFT" || method === "WIRE") {
      return {
        method: "Transferencia SWIFT",
        beneficiary: enrichedData?.beneficiary_name || "Destinatario",
        beneficiaryBank: enrichedData?.beneficiary_bank || "N/A",
        accountInfo: "SWIFT Internacional",
        showSwiftInfo: true,
      };
    }

    if (method === "ACH") {
      return {
        method: "Transferencia ACH",
        beneficiary: enrichedData?.beneficiary_name || "Destinatario",
        beneficiaryBank: enrichedData?.beneficiary_bank || "N/A",
        accountNumber: enrichedData?.account_number || "N/A",
        routingNumber: enrichedData?.routing_number || "N/A",
        accountType: enrichedData?.account_type || "N/A",
        accountInfo: enrichedData?.account_number || "N/A",
        showAchInfo: true,
      };
    }

    // Si tenemos account_ref que parece una wallet (empieza con 0x)
    if (transaction?.account_ref?.startsWith("0x")) {
      return {
        method: "Criptomoneda",
        accountInfo: transaction.account_ref,
        beneficiary: enrichedData?.beneficiary_name || "Wallet Crypto",
        details: `Red: ${transaction?.currency?.toUpperCase() || "CRYPTO"}`,
      };
    }

    // Fallback - transferencia tradicional
    return {
      method: "Transferencia Bancaria",
      accountInfo:
        transaction?.account_ref || enrichedData?.account_number || "Varios",
      beneficiary: enrichedData?.beneficiary_name || "Destinatario",
      details: `Banco: ${enrichedData?.beneficiary_bank || "N/A"}`,
    };
  };

  const paymentInfo = getPaymentMethodInfo();

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
            <Text style={styles.headerText}>Comprobante de transferencia</Text>
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

        {/* Importe debitado */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Importe debitado</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountValue}>
              {transaction?.final_amount
                ? formatAmount(transaction.final_amount)
                : transaction?.amount
                ? formatAmount(Math.abs(transaction.amount))
                : "$ 0,00"}
            </Text>
            {transaction?.initial_amount && (
              <Text style={styles.amountUSD}>
                Monto inicial: {formatAmount(transaction.initial_amount)}
              </Text>
            )}
            {transaction?.initial_amount}
            <Text style={styles.amountUSD}>
              Fee:{" "}
              {transaction?.initial_amount != null &&
              transaction?.final_amount != null
                ? formatAmount(
                    Number(transaction.initial_amount) -
                      Number(transaction.final_amount)
                  )
                : "$ 0,00"}
            </Text>
          </View>
        </View>

        {/* Separador */}
        <View style={styles.sectionSeparator} />

        {/* Datos de la transferencia */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cuenta destino</Text>
            <Text style={styles.detailValue}></Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Titular cuenta destino</Text>
            <Text style={styles.detailValue}>{paymentInfo.beneficiary}</Text>
          </View>

          {/* Información específica para ACH */}
          {paymentInfo.showAchInfo && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Banco beneficiario</Text>
                <Text style={styles.detailValue}>
                  {paymentInfo.beneficiaryBank}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Número de cuenta</Text>
                <Text style={styles.detailValue}>
                  {paymentInfo.accountNumber}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Routing number</Text>
                <Text style={styles.detailValue}>
                  {paymentInfo.routingNumber}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo de cuenta</Text>
                <Text style={styles.detailValue}>
                  {paymentInfo.accountType}
                </Text>
              </View>
            </>
          )}

          {/* Información específica para SWIFT */}
          {paymentInfo.showSwiftInfo && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Banco beneficiario</Text>
                <Text style={styles.detailValue}>
                  {paymentInfo.beneficiaryBank}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método</Text>
                <Text style={styles.detailValue}>SWIFT Internacional</Text>
              </View>
            </>
          )}

          {enrichedData.method === "crypto" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dirección/Red</Text>
              <Text style={styles.detailValue}>
                {transaction?.account_ref || "N/A"}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Concepto transferencia</Text>
            <Text style={styles.detailValue}>
              {formatConcept(transaction?.description || "")}
            </Text>
          </View>

          {transaction?.currency && transaction?.conversion_rate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Moneda/Tasa</Text>
              <Text style={styles.detailValue}>
                {transaction.currency.toUpperCase()} - Tasa:{" "}
                {transaction.conversion_rate.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de ejecución</Text>
            <Text style={styles.detailValue}>
              {transaction?.date ? formatDate(transaction.date) : "N/A"}
            </Text>
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
            N° comprobante{" "}
            {transaction?.id?.slice(-8) || Math.random().toString().slice(-8)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// 🎨 Estilos siguiendo el patrón de StatementPDF
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
  amountLabel: { fontSize: 11, color: "#374151", fontWeight: "normal" },
  amountValue: { fontSize: 14, color: "#374151", fontWeight: "bold" },
  amountContainer: { flexDirection: "column", alignItems: "flex-end" },
  amountMeta: { marginTop: 2, alignItems: "flex-end" }, // 👈 nuevo
  amountUSD: {
    fontSize: 10,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 2,
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
