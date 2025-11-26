"use client";
import React from "react";

interface DepositInstructionsProps {
  logoUrl?: string;
  companyName: string;
  method: "ACH" | "SWIFT" | "CRYPTO" | "LOCAL";
  data: {
    bankName?: string;
    routingNumber?: string;
    bankAddress?: string;
    beneficiaryName?: string;
    accountNumber?: string;
    accountType?: string;
    beneficiaryAddress?: string;
    alias?: string;
    cbu?: string;
    nitOrCuit?: string;
    // Campos del banco intermediario (SWIFT)
    intermediaryBank?: string;
    intermediaryRoutingNumber?: string;
    intermediaryBicCode?: string;
  };
}

const DepositInstructions: React.FC<DepositInstructionsProps> = ({
  logoUrl,
  companyName,
  method,
  data,
}) => {
  const methodNames: Record<string, string> = {
    ACH: "Instrucciones de depósito (ACH)",
    SWIFT: "Instrucciones de depósito (SWIFT)",
    CRYPTO: "Instrucciones de depósito (Crypto)",
    LOCAL: "Instrucciones de depósito (Cuenta local)",
  };

  const isCrypto = method === "CRYPTO";

  const renderRow = (
    label: string,
    value: string | undefined,
    extraStyle: React.CSSProperties = {}
  ) => {
    if (!value) return null; // no renderiza si está vacío
    return (
      <tr style={{ borderBottom: "1px solid #ECECEC" }}>
        <td style={{ ...labelCell }}>{label}</td>
        <td style={{ ...valueCell, ...extraStyle }}>{value}</td>
      </tr>
    );
  };

  console.log("Instructions data:", data);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo Takenos"
            style={styles.logo}
          />
        ) : (
          <div style={{ height: 28 }} />
        )}
      </header>

      {/* TITULO PRINCIPAL */}
      <main>
        <h1 style={styles.title}>
          {companyName}
        </h1>
        <p style={styles.subtitle}>
          Utiliza estos datos para realizar transferencias a tu cuenta de
          Takenos.
        </p>

        {/* BLOQUE DE DATOS SEGÚN MÉTODO */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            {method === "CRYPTO"
              ? "Wallet"
              : method === "LOCAL"
              ? "Cuenta Local"
              : method === "SWIFT"
              ? "Banco Receptor (Transferencia Internacional)"
              : "Banco Receptor"}
          </h2>

          <table style={styles.table}>
            <tbody>
              {/* 🪙 CRYPTO */}
              {method === "CRYPTO" && (
                <>
                  {renderRow("Wallet", data.accountType)}
                  {renderRow("Dirección de depósito", data.accountNumber, {
                    wordBreak: "break-all",
                  })}
                  {renderRow("Red / Network", data.bankName)}
                </>
              )}

              {/* 💵 MONEDA LOCAL */}
              {method === "LOCAL" && (
                <>
                  {renderRow("Beneficiario", data.beneficiaryName)}
                  {renderRow("Banco", data.bankName)}
                  {renderRow("Número de Cuenta", data.accountNumber)}
                  {renderRow("NIT o Carnet", data.nitOrCuit)}
                  {renderRow("CBU", data.cbu)}
                  {renderRow("Alias", data.alias)}
                </>
              )}

              {/* 🌐 SWIFT */}
              {method === "SWIFT" && (
                <>
                  {renderRow("SWIFT/BIC Code", data.routingNumber)}
                  {renderRow("Nombre del Banco", data.bankName)}
                  {renderRow("Dirección del Banco", data.bankAddress, {
                    whiteSpace: "pre-line",
                  })}
                </>
              )}

              {/* 🇺🇸 ACH */}
              {method === "ACH" && (
                <>
                  {renderRow("Routing Number", data.routingNumber)}
                  {renderRow("Nombre del Banco", data.bankName)}
                  {renderRow("Dirección del Banco", data.bankAddress, {
                    whiteSpace: "pre-line",
                  })}
                </>
              )}
            </tbody>
          </table>
        </section>

        {/* BANCO INTERMEDIARIO (solo SWIFT si existe) */}
        {method === "SWIFT" && (data.intermediaryBank || data.intermediaryRoutingNumber || data.intermediaryBicCode) && (
          <section style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "rgb(109, 55, 213)",
                textTransform: "uppercase",
                marginBottom: 10,
                letterSpacing: ".6px",
              }}
            >
              Banco Intermediario
            </h2>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #ECECEC",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <tbody>
                {renderRow("Nombre del Banco Intermediario", data.intermediaryBank)}
                {renderRow("SWIFT/BIC Code Intermediario", data.intermediaryBicCode)}
                {renderRow("Routing Number Intermediario", data.intermediaryRoutingNumber)}
              </tbody>
            </table>
          </section>
        )}

        {/* BENEFICIARIO */}
        {!isCrypto && method !== "LOCAL" && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Beneficiario
            </h2>

            <table style={styles.table}>
              <tbody>
                {renderRow("Nombre del Beneficiario", data.beneficiaryName)}

                {renderRow("Número de Cuenta", data.accountNumber)}
                {renderRow("Tipo de Cuenta", data.accountType)}

                {renderRow(
                  "Dirección del Beneficiario",
                  data.beneficiaryAddress
                )}
              </tbody>
            </table>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer style={styles.footer}>
        Takenos Business
      </footer>
    </div>
  );
};

/* ---- Stylesheet ---- */
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif",
    color: "#0F172A",
    fontSize: "14px",
    lineHeight: 1.6,
    background: "#fff",
    maxWidth: "900px",
    margin: "50px auto",
    padding: "0 24px 60px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #ECECEC",
    paddingBottom: "12px",
    marginBottom: "30px",
  },
  logo: {
    height: "28px",
    width: "auto",
    objectFit: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 28,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#6d37d5",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: ".6px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ECECEC",
    borderRadius: 14,
    overflow: "hidden",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
    borderTop: "1px solid #ECECEC",
    paddingTop: 18,
    marginTop: 40,
  },
};

const labelCell: React.CSSProperties = {
  width: 220,
  color: "#6d37d5",
  fontWeight: 500,
  fontSize: 13,
  whiteSpace: "nowrap",
  padding: "10px 14px",
  verticalAlign: "top",
};

const valueCell: React.CSSProperties = {
  color: "#0F172A",
  fontSize: 14,
  fontWeight: 400,
  padding: "10px 14px",
  verticalAlign: "top",
};

export default DepositInstructions;
