import { z } from "zod"

export const walletNetworkEnum = z.enum(["BEP20", "MATIC", "TRC20"]) // Binance Smart Chain (BEP20), Polygon (MATIC), Tron (TRC20)

export const withdrawalCategoryEnum = z.enum(["usd_bank", "crypto", "local_currency"])
export const usdMethodEnum = z.enum(["ach", "wire"]) // SWIFT/BIC se pide cuando method==='wire'
export const accountOwnershipEnum = z.enum(["yo", "otra_persona", "empresa"])
export const accountTypeEnum = z.enum(["checking", "saving"])

const baseSchema = z.object({
  category: withdrawalCategoryEnum,     // usd_bank | crypto | local_currency
  amount: z.string().min(1, "Requerido"), // ya formateado como string, lo convertimos server-side
  reference: z.string().optional(),
  
  // Comprobante PDF para justificar el retiro
  receiptFile: z.any().optional(), // File object (legacy - un solo archivo)
  receiptFileUrl: z.string().optional(), // URL del archivo subido a Supabase (legacy)
  receiptFileName: z.string().optional(), // Nombre del archivo (legacy)
  
  // Múltiples comprobantes PDF
  receiptFiles: z.any().optional(), // Array de File objects
  receiptFileUrls: z.any().optional(), // Array de URLs de archivos subidos

  // comunes opcionales (se filtran por categoría)
  country: z.string().optional(),
  beneficiaryName: z.string().optional(),
  beneficiaryBank: z.string().optional(),
  accountType: accountTypeEnum.optional(),
  accountOwnership: accountOwnershipEnum.optional(),
  routingNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  method: usdMethodEnum.optional(),
  swiftBic: z.string().optional(),

  // crypto
  walletAlias: z.string().optional(),
  walletAddress: z.string().optional(),
  walletNetwork: walletNetworkEnum.optional(),

  // local currency
  localBank: z.string().optional(),
  localAccountName: z.string().optional(),
  localAccountNumber: z.string().optional(),
})

export const withdrawalSchema = baseSchema.superRefine((data, ctx) => {
  // Validar comprobante PDF (requerido para todas las categorías)
  // Aceptar tanto receiptFile (legacy) como receiptFiles (nuevo)
  const hasFiles = data.receiptFile || (data.receiptFiles && data.receiptFiles.length > 0);
  if (!hasFiles) {
    ctx.addIssue({ 
      code: z.ZodIssueCode.custom, 
      message: "Debes subir al menos un comprobante PDF que justifique el retiro", 
      path: ["receiptFile"] 
    })
  }

  // USD bank
  if (data.category === "usd_bank") {
    if (!data.method) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona tipo de transferencia (ACH/Wire)", path: ["method"] })
    if (!data.beneficiaryName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Titular requerido", path: ["beneficiaryName"] })
    if (!data.beneficiaryBank) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Banco requerido", path: ["beneficiaryBank"] })
    if (!data.accountNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número de cuenta / IBAN requerido", path: ["accountNumber"] })

    if (data.method === "ach") {
      // Para ACH requerimos tipo de cuenta y routing number
      if (!data.accountType) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tipo de cuenta requerido para ACH", path: ["accountType"] })
      if (!data.routingNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Routing number requerido para ACH", path: ["routingNumber"] })
    }
    if (data.method === "wire") {
      // Para Wire solo requerimos SWIFT/BIC, no tipo de cuenta
      if (!data.swiftBic) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SWIFT/BIC requerido para Wire", path: ["swiftBic"] })
    }
  }

  // Crypto
  if (data.category === "crypto") {
    if (!data.walletAlias) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Apodo de la billetera requerido", path: ["walletAlias"] })
    if (!data.walletAddress) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dirección de la billetera requerida", path: ["walletAddress"] })
    if (!data.walletNetwork) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecciona la red", path: ["walletNetwork"] })
  }

  // Local currency
  if (data.category === "local_currency") {
    // if (!data.country) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "País requerido", path: ["country"] })
    if (!data.localAccountName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nombre de la cuenta requerido", path: ["localAccountName"] })
    if (!data.localBank) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Banco requerido", path: ["localBank"] })
    if (!data.localAccountNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número de cuenta destino requerido", path: ["localAccountNumber"] })
  }
})

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>
