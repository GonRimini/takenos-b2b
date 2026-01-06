import { z } from "zod";

// Esquemas base compartidos
const baseAccountSchema = z.object({
  nickname: z.string().min(3, "El apodo debe tener al menos 3 caracteres"),
  currency_code: z.string().min(3, "Código de moneda requerido"),
  beneficiary_url: z
    .string()
    .min(1, "URL del beneficiario es requerida")
    .regex(
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      "Debe ser una URL válida (ej: www.example.com o https://example.com)"
    ),
  is_default: z.boolean().optional(),
});

// Esquemas específicos por rail
export const achAccountSchema = baseAccountSchema.extend({
  rail: z.literal("ach"),
  ach: z.object({
    account_number: z
      .string()
      .min(1, "Número de cuenta requerido")
      .regex(/^[0-9\-\/\s]+$/, "El número de cuenta solo puede contener números y símbolos (-, /)"),
    routing_number: z
      .string()
      .length(9, "Routing number debe tener exactamente 9 dígitos")
      .regex(/^\d{9}$/, "Routing number debe contener solo dígitos"),
    receiver_bank: z
      .string()
      .min(1, "Banco receptor requerido")
      .regex(/^[a-zA-Z0-9\s]+$/, "El nombre del banco no puede contener símbolos"),
    beneficiary_bank_address: z
      .string()
      .regex(/^[a-zA-Z0-9\s,.-]*$/, "La dirección no puede contener símbolos especiales")
      .optional()
      .or(z.literal("")),
    beneficiary_name: z.string().min(1, "Nombre del beneficiario requerido"),
    account_type: z.enum(["checking", "savings"]),
    country_code: z.string().length(2, "Código de país debe tener 2 caracteres").optional(),
  }),
});

export const swiftAccountSchema = baseAccountSchema.extend({
  rail: z.literal("swift"),
  swift: z.object({
    beneficiary_name: z
      .string()
      .min(1, "Nombre del beneficiario requerido")
      .regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras y espacios"),
    receiver_bank: z
      .string()
      .min(1, "Banco receptor requerido")
      .regex(/^[a-zA-Z0-9\s]+$/, "El nombre del banco no puede contener símbolos"),
    swift_bic: z
      .string()
      .min(8, "SWIFT/BIC debe tener 8 u 11 caracteres")
      .max(11, "SWIFT/BIC debe tener 8 u 11 caracteres")
      .regex(/^[A-Z0-9]{8}$|^[A-Z0-9]{11}$/, "SWIFT/BIC debe tener 8 u 11 caracteres (solo A-Z y 0-9)"),
    account_number: z
      .string()
      .min(1, "Número de cuenta requerido")
      .regex(/^[0-9\-\/\s]+$/, "El número de cuenta solo puede contener números y símbolos (-, /)"),
    beneficiary_bank_address: z
      .string()
      .regex(/^[a-zA-Z0-9\s,.-]*$/, "La dirección no puede contener símbolos especiales")
      .optional()
      .or(z.literal("")),
    account_type: z.enum(["checking", "savings"]),
    country_code: z.string().length(2, "Código de país debe tener 2 caracteres"),
    intermediary_bank: z
      .string()
      .regex(/^[a-zA-Z0-9\s]*$/, "El nombre del banco no puede contener símbolos")
      .optional()
      .or(z.literal("")),
    intermediary_routing_number: z
      .string()
      .regex(/^$|^\d{9}$/, "Routing number debe tener exactamente 9 dígitos")
      .optional()
      .or(z.literal("")),
    intermediary_swift_bic: z
      .string()
      .regex(/^$|^[A-Z0-9]{8}$|^[A-Z0-9]{11}$/, "SWIFT/BIC debe tener 8 u 11 caracteres (solo A-Z y 0-9)")
      .optional()
      .or(z.literal("")),
    intermediary_account_number: z
      .string()
      .regex(/^[0-9\-\/\s]*$/, "El número de cuenta solo puede contener números y símbolos (-, /)")
      .optional()
      .or(z.literal("")),
  }),
});

export const cryptoAccountSchema = baseAccountSchema.extend({
  rail: z.literal("crypto"),
  crypto: z.object({
    wallet_address: z.string().min(1, "Dirección de wallet requerida"),
    wallet_network: z.string().min(1, "Red de wallet requerida"),
  }),
});

export const localAccountSchema = baseAccountSchema.extend({
  rail: z.literal("local"),
  local: z.object({
    country_code: z.string().length(2, "Código de país debe tener 2 caracteres"),
    bank_name: z.string().min(1, "Nombre del banco requerido"),
    identifier_primary: z.string().min(1, "Identificador primario requerido"),
    identifier_secondary: z.string().optional(),
    identifier_primary_type: z.string().min(1, "Tipo de identificador primario requerido"),
    identifier_secondary_type: z.string().optional(),
    holder_id: z.string().min(1, "Identificación del titular requerida"),
    account_number: z.string().optional(),
    beneficiary_name: z.string().min(1, "Nombre del beneficiario requerido"),
  }),
});

// Schema discriminado por rail
export const externalAccountSchema = z.discriminatedUnion("rail", [
  achAccountSchema,
  swiftAccountSchema,
  cryptoAccountSchema,
  localAccountSchema,
]);

export type ExternalAccountFormData = z.infer<typeof externalAccountSchema>;
