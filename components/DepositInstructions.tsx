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

  return (
    <div
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif",
        color: "#0F172A",
        fontSize: "14px",
        lineHeight: 1.6,
        background: "#fff",
        maxWidth: "900px",
        margin: "50px auto",
        padding: "0 24px 60px",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ECECEC",
          paddingBottom: "12px",
          marginBottom: "30px",
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo Takenos"
            style={{ height: "28px", width: "auto", objectFit: "contain" }}
          />
        ) : (
          <div style={{ height: 28 }} />
        )}
      </header>

      {/* TITULO PRINCIPAL */}
      <main>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          {companyName}
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 28 }}>
          Utiliza estos datos para realizar transferencias a tu cuenta de
          Takenos.
        </p>

        {/* BLOQUE DE DATOS SEGÚN MÉTODO */}
        <section style={{ marginBottom: 36 }}>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#6d37d5",
              textTransform: "uppercase",
              marginBottom: 10,
              letterSpacing: ".6px",
            }}
          >
            {method === "CRYPTO"
              ? "Wallet"
              : method === "LOCAL"
              ? "Cuenta Local"
              : method === "SWIFT"
              ? "Banco Receptor (Transferencia Internacional)"
              : "Banco Receptor"}
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
              {/* 🪙 CRYPTO */}
              {method === "CRYPTO" && (
                <>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Wallet</td>
                    <td style={{ ...valueCell }}>{data.accountType}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Dirección de depósito</td>
                    <td style={{ ...valueCell, wordBreak: "break-all" }}>
                      {data.accountNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...labelCell }}>Red / Network</td>
                    <td style={{ ...valueCell }}>{data.bankName}</td>
                  </tr>
                </>
              )}

              {/* 💵 MONEDA LOCAL */}
              {method === "LOCAL" && (
                <>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Beneficiario</td>
                    <td style={{ ...valueCell }}>{data.beneficiaryName}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Banco</td>
                    <td style={{ ...valueCell }}>{data.bankName}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Número de Cuenta</td>
                    <td style={{ ...valueCell }}>{data.accountNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ ...labelCell }}>NIT o Carnet</td>
                    <td style={{ ...valueCell }}>{data.beneficiaryAddress}</td>
                  </tr>
                </>
              )}

              {/* 🌐 SWIFT */}
              {method === "SWIFT" && (
                <>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>SWIFT/BIC Code</td>
                    <td style={{ ...valueCell }}>
                      {data.routingNumber || "Solicitar"}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Nombre del Banco</td>
                    <td style={{ ...valueCell }}>{data.bankName}</td>
                  </tr>
                  <tr>
                    <td style={{ ...labelCell }}>Dirección del Banco</td>
                    <td style={{ ...valueCell, whiteSpace: "pre-line" }}>
                      {data.bankAddress}
                    </td>
                  </tr>
                </>
              )}

              {/* 🇺🇸 ACH */}
              {method === "ACH" && (
                <>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Routing Number</td>
                    <td style={{ ...valueCell }}>{data.routingNumber}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Nombre del Banco</td>
                    <td style={{ ...valueCell }}>{data.bankName}</td>
                  </tr>
                  <tr>
                    <td style={{ ...labelCell }}>Dirección del Banco</td>
                    <td style={{ ...valueCell, whiteSpace: "pre-line" }}>
                      {data.bankAddress}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>

        {/* BENEFICIARIO */}
        {!isCrypto && (
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
              Beneficiario
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
                <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                  <td style={{ ...labelCell }}>Nombre del Beneficiario</td>
                  <td style={{ ...valueCell }}>{data.beneficiaryName}</td>
                </tr>

                {/* Solo para métodos no CRYPTO */}
                <>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Número de Cuenta</td>
                    <td style={{ ...valueCell }}>{data.accountNumber}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ ...labelCell }}>Tipo de Cuenta</td>
                    <td style={{ ...valueCell }}>{data.accountType}</td>
                  </tr>
                </>

                <tr>
                  <td style={{ ...labelCell }}>Dirección del Beneficiario</td>
                  <td style={{ ...valueCell }}>{data.beneficiaryAddress}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          fontSize: 12,
          color: "#6B7280",
          borderTop: "1px solid #ECECEC",
          paddingTop: 18,
          marginTop: 40,
        }}
      >
        Takenos Business
      </footer>
    </div>
  );
};

/* ---- estilos reutilizables ---- */
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
