// ACH → solo US
export const ACH_COUNTRIES = [
  { code: "US", label: "🇺🇸 Estados Unidos", currency: "USD" },
];

// Retiros locales (según doc de Takenos)
export const LOCAL_WITHDRAW_COUNTRIES = [
  { code: "AR", label: "🇦🇷 Argentina", currency: "ARS" },
  { code: "BO", label: "🇧🇴 Bolivia",   currency: "BOB" },
  { code: "BR", label: "🇧🇷 Brasil",    currency: "BRL" },
  { code: "MX", label: "🇲🇽 México",    currency: "MXN" },
];

// SWIFT (retiro global, lista acotada y razonable)
export const SWIFT_COUNTRIES = [
  // LATAM con moneda local
  { code: "BR", label: "🇧🇷 Brasil",    currency: "BRL" },
  { code: "PE", label: "🇵🇪 Perú",      currency: "PEN" },
  { code: "BO", label: "🇧🇴 Bolivia",   currency: "BOB" },
  { code: "AR", label: "🇦🇷 Argentina", currency: "ARS" },

  // USD
  { code: "US", label: "🇺🇸 Estados Unidos", currency: "USD" },
  { code: "PA", label: "🇵🇦 Panamá",          currency: "USD" },
  { code: "MX", label: "🇲🇽 México",          currency: "USD" }, // MXN local, pero SWIFT USD

  // EUR (Europa)
  { code: "ES", label: "🇪🇸 España",        currency: "EUR" },
  { code: "FR", label: "🇫🇷 Francia",       currency: "EUR" },
  { code: "DE", label: "🇩🇪 Alemania",      currency: "EUR" },
  { code: "IT", label: "🇮🇹 Italia",        currency: "EUR" },
  { code: "NL", label: "🇳🇱 Países Bajos", currency: "EUR" },
  { code: "PT", label: "🇵🇹 Portugal",     currency: "EUR" },
  { code: "IE", label: "🇮🇪 Irlanda",      currency: "EUR" },

  // Otros → USD
  { code: "CL", label: "🇨🇱 Chile",        currency: "USD" },
  { code: "UY", label: "🇺🇾 Uruguay",      currency: "USD" },
  { code: "CO", label: "🇨🇴 Colombia",     currency: "USD" },
  { code: "HK", label: "🇭🇰 Hong Kong",    currency: "USD" },
  { code: "CN", label: "🇨🇳 China",        currency: "USD" },
  { code: "GB", label: "🇬🇧 Reino Unido",  currency: "USD" },
];

// Lista unificada de todos los países (sin duplicados)
export const COUNTRIES = (() => {
  const seen = new Set<string>();
  const all: { code: string; label: string; currency: string }[] = [];
  
  for (const c of [...ACH_COUNTRIES, ...LOCAL_WITHDRAW_COUNTRIES, ...SWIFT_COUNTRIES]) {
    if (!seen.has(c.code)) {
      seen.add(c.code);
      all.push(c);
    }
  }
  return all.sort((a, b) => a.label.localeCompare(b.label));
})();

// Si querés un map genérico país → moneda:
export const COUNTRY_CURRENCY_MAP: Record<string, string> = Object.fromEntries(
  [
    ...ACH_COUNTRIES,
    ...LOCAL_WITHDRAW_COUNTRIES,
    ...SWIFT_COUNTRIES,
  ].map((c) => [c.code, c.currency])
);