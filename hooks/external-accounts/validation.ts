import { z } from "zod";

// Esquemas base compartidos
const baseAccountSchema = z.object({
  nickname: z.string().min(3, "El apodo debe tener al menos 3 caracteres"),
  currency_code: z.string().min(3, "Código de moneda requerido"),
  is_default: z.boolean().optional(),
});

// Esquemas específicos por rail
export const achAccountSchema = baseAccountSchema.extend({
  rail: z.literal("ach"),
  ach: z.object({
    account_number: z.string().min(1, "Número de cuenta requerido"),
    routing_number: z.string().min(9, "Routing number debe tener 9 dígitos"),
    receiver_bank: z.string().min(1, "Banco receptor requerido"),
    beneficiary_bank_address: z.string().optional(),
    beneficiary_name: z.string().min(1, "Nombre del beneficiario requerido"),
    account_type: z.enum(["checking", "savings"]),
  }),
});

export const swiftAccountSchema = baseAccountSchema.extend({
  rail: z.literal("swift"),
  swift: z.object({
    swift_bic: z.string().min(8, "SWIFT/BIC debe tener al menos 8 caracteres"),
    account_number: z.string().min(1, "Número de cuenta requerido"),
    receiver_bank: z.string().min(1, "Banco receptor requerido"),
    beneficiary_bank_address: z.string().optional(),
    beneficiary_name: z.string().min(1, "Nombre del beneficiario requerido"),
    account_type: z.enum(["checking", "savings"]),
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
