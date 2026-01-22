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
  { code: "AR", label: "🇦🇷 Argentina", currency: "ARS" },
  { code: "BO", label: "🇧🇴 Bolivia", currency: "BOB" },
  { code: "BR", label: "🇧🇷 Brasil", currency: "BRL" },
  { code: "PE", label: "🇵🇪 Perú", currency: "PEN" },

  // EUR (Eurozona + países que usan EUR)
  { code: "AD", label: "🇦🇩 Andorra", currency: "EUR" },
  { code: "AT", label: "🇦🇹 Austria", currency: "EUR" },
  { code: "BE", label: "🇧🇪 Bélgica", currency: "EUR" },
  { code: "CY", label: "🇨🇾 Chipre", currency: "EUR" },
  { code: "DE", label: "🇩🇪 Alemania", currency: "EUR" },
  { code: "EE", label: "🇪🇪 Estonia", currency: "EUR" },
  { code: "ES", label: "🇪🇸 España", currency: "EUR" },
  { code: "FI", label: "🇫🇮 Finlandia", currency: "EUR" },
  { code: "FR", label: "🇫🇷 Francia", currency: "EUR" },
  { code: "GR", label: "🇬🇷 Grecia", currency: "EUR" },
  { code: "HR", label: "🇭🇷 Croacia", currency: "EUR" },
  { code: "IE", label: "🇮🇪 Irlanda", currency: "EUR" },
  { code: "IT", label: "🇮🇹 Italia", currency: "EUR" },
  { code: "LT", label: "🇱🇹 Lituania", currency: "EUR" },
  { code: "LU", label: "🇱🇺 Luxemburgo", currency: "EUR" },
  { code: "LV", label: "🇱🇻 Letonia", currency: "EUR" },
  { code: "MC", label: "🇲🇨 Mónaco", currency: "EUR" },
  { code: "ME", label: "🇲🇪 Montenegro", currency: "EUR" },
  { code: "MT", label: "🇲🇹 Malta", currency: "EUR" },
  { code: "NL", label: "🇳🇱 Países Bajos", currency: "EUR" },
  { code: "PT", label: "🇵🇹 Portugal", currency: "EUR" },
  { code: "SM", label: "🇸🇲 San Marino", currency: "EUR" },
  { code: "SI", label: "🇸🇮 Eslovenia", currency: "EUR" },
  { code: "SK", label: "🇸🇰 Eslovaquia", currency: "EUR" },
  { code: "VA", label: "🇻🇦 Ciudad del Vaticano", currency: "EUR" },

  // USD (resto del mundo por defecto en SWIFT)
  { code: "AE", label: "🇦🇪 Emiratos Árabes Unidos", currency: "USD" },
  { code: "AF", label: "🇦🇫 Afganistán", currency: "USD" },
  { code: "AG", label: "🇦🇬 Antigua y Barbuda", currency: "USD" },
  { code: "AI", label: "🇦🇮 Anguila", currency: "USD" },
  { code: "AL", label: "🇦🇱 Albania", currency: "USD" },
  { code: "AM", label: "🇦🇲 Armenia", currency: "USD" },
  { code: "AO", label: "🇦🇴 Angola", currency: "USD" },
  { code: "AQ", label: "🇦🇶 Antártida", currency: "USD" },
  { code: "AS", label: "🇦🇸 Samoa Americana", currency: "USD" },
  { code: "AU", label: "🇦🇺 Australia", currency: "USD" },
  { code: "AW", label: "🇦🇼 Aruba", currency: "USD" },
  { code: "AZ", label: "🇦🇿 Azerbaiyán", currency: "USD" },

  { code: "BA", label: "🇧🇦 Bosnia y Herzegovina", currency: "USD" },
  { code: "BB", label: "🇧🇧 Barbados", currency: "USD" },
  { code: "BD", label: "🇧🇩 Bangladés", currency: "USD" },
  { code: "BF", label: "🇧🇫 Burkina Faso", currency: "USD" },
  { code: "BG", label: "🇧🇬 Bulgaria", currency: "USD" },
  { code: "BH", label: "🇧🇭 Baréin", currency: "USD" },
  { code: "BI", label: "🇧🇮 Burundi", currency: "USD" },
  { code: "BJ", label: "🇧🇯 Benín", currency: "USD" },
  { code: "BM", label: "🇧🇲 Bermudas", currency: "USD" },
  { code: "BN", label: "🇧🇳 Brunéi", currency: "USD" },
  { code: "BS", label: "🇧🇸 Bahamas", currency: "USD" },
  { code: "BT", label: "🇧🇹 Bután", currency: "USD" },
  { code: "BW", label: "🇧🇼 Botsuana", currency: "USD" },
  { code: "BY", label: "🇧🇾 Bielorrusia", currency: "USD" },
  { code: "BZ", label: "🇧🇿 Belice", currency: "USD" },

  { code: "CA", label: "🇨🇦 Canadá", currency: "USD" },
  { code: "CD", label: "🇨🇩 República Democrática del Congo", currency: "USD" },
  { code: "CF", label: "🇨🇫 República Centroafricana", currency: "USD" },
  { code: "CG", label: "🇨🇬 República del Congo", currency: "USD" },
  { code: "CH", label: "🇨🇭 Suiza", currency: "USD" },
  { code: "CI", label: "🇨🇮 Costa de Marfil", currency: "USD" },
  { code: "CL", label: "🇨🇱 Chile", currency: "USD" },
  { code: "CM", label: "🇨🇲 Camerún", currency: "USD" },
  { code: "CN", label: "🇨🇳 China", currency: "USD" },
  { code: "CO", label: "🇨🇴 Colombia", currency: "USD" },
  { code: "CR", label: "🇨🇷 Costa Rica", currency: "USD" },
  { code: "CU", label: "🇨🇺 Cuba", currency: "USD" },
  { code: "CV", label: "🇨🇻 Cabo Verde", currency: "USD" },
  { code: "CZ", label: "🇨🇿 Chequia", currency: "USD" },

  { code: "DJ", label: "🇩🇯 Yibuti", currency: "USD" },
  { code: "DK", label: "🇩🇰 Dinamarca", currency: "USD" },
  { code: "DM", label: "🇩🇲 Dominica", currency: "USD" },
  { code: "DO", label: "🇩🇴 República Dominicana", currency: "USD" },
  { code: "DZ", label: "🇩🇿 Argelia", currency: "USD" },

  { code: "EC", label: "🇪🇨 Ecuador", currency: "USD" },
  { code: "EG", label: "🇪🇬 Egipto", currency: "USD" },
  { code: "ER", label: "🇪🇷 Eritrea", currency: "USD" },
  { code: "ET", label: "🇪🇹 Etiopía", currency: "USD" },

  { code: "FJ", label: "🇫🇯 Fiyi", currency: "USD" },
  { code: "FM", label: "🇫🇲 Micronesia", currency: "USD" },

  { code: "GA", label: "🇬🇦 Gabón", currency: "USD" },
  { code: "GB", label: "🇬🇧 Reino Unido", currency: "USD" },
  { code: "GD", label: "🇬🇩 Granada", currency: "USD" },
  { code: "GE", label: "🇬🇪 Georgia", currency: "USD" },
  { code: "GH", label: "🇬🇭 Ghana", currency: "USD" },
  { code: "GM", label: "🇬🇲 Gambia", currency: "USD" },
  { code: "GN", label: "🇬🇳 Guinea", currency: "USD" },
  { code: "GQ", label: "🇬🇶 Guinea Ecuatorial", currency: "USD" },
  { code: "GT", label: "🇬🇹 Guatemala", currency: "USD" },
  { code: "GW", label: "🇬🇼 Guinea-Bisáu", currency: "USD" },
  { code: "GY", label: "🇬🇾 Guyana", currency: "USD" },

  { code: "HN", label: "🇭🇳 Honduras", currency: "USD" },
  { code: "HT", label: "🇭🇹 Haití", currency: "USD" },
  { code: "HU", label: "🇭🇺 Hungría", currency: "USD" },
  { code: "HK", label: "🇭🇰 Hong Kong", currency: "USD" },

  { code: "ID", label: "🇮🇩 Indonesia", currency: "USD" },
  { code: "IL", label: "🇮🇱 Israel", currency: "USD" },
  { code: "IN", label: "🇮🇳 India", currency: "USD" },
  { code: "IQ", label: "🇮🇶 Irak", currency: "USD" },
  { code: "IR", label: "🇮🇷 Irán", currency: "USD" },
  { code: "IS", label: "🇮🇸 Islandia", currency: "USD" },
  { code: "JM", label: "🇯🇲 Jamaica", currency: "USD" },
  { code: "JO", label: "🇯🇴 Jordania", currency: "USD" },
  { code: "JP", label: "🇯🇵 Japón", currency: "USD" },

  { code: "KE", label: "🇰🇪 Kenia", currency: "USD" },
  { code: "KG", label: "🇰🇬 Kirguistán", currency: "USD" },
  { code: "KH", label: "🇰🇭 Camboya", currency: "USD" },
  { code: "KI", label: "🇰🇮 Kiribati", currency: "USD" },
  { code: "KM", label: "🇰🇲 Comoras", currency: "USD" },
  { code: "KN", label: "🇰🇳 San Cristóbal y Nieves", currency: "USD" },
  { code: "KP", label: "🇰🇵 Corea del Norte", currency: "USD" },
  { code: "KR", label: "🇰🇷 Corea del Sur", currency: "USD" },
  { code: "KW", label: "🇰🇼 Kuwait", currency: "USD" },
  { code: "KZ", label: "🇰🇿 Kazajistán", currency: "USD" },

  { code: "LA", label: "🇱🇦 Laos", currency: "USD" },
  { code: "LB", label: "🇱🇧 Líbano", currency: "USD" },
  { code: "LC", label: "🇱🇨 Santa Lucía", currency: "USD" },
  { code: "LI", label: "🇱🇮 Liechtenstein", currency: "USD" },
  { code: "LK", label: "🇱🇰 Sri Lanka", currency: "USD" },
  { code: "LR", label: "🇱🇷 Liberia", currency: "USD" },
  { code: "LS", label: "🇱🇸 Lesoto", currency: "USD" },
  { code: "LY", label: "🇱🇾 Libia", currency: "USD" },

  { code: "MA", label: "🇲🇦 Marruecos", currency: "USD" },
  { code: "MD", label: "🇲🇩 Moldavia", currency: "USD" },
  { code: "MG", label: "🇲🇬 Madagascar", currency: "USD" },
  { code: "MH", label: "🇲🇭 Islas Marshall", currency: "USD" },
  { code: "MK", label: "🇲🇰 Macedonia del Norte", currency: "USD" },
  { code: "ML", label: "🇲🇱 Malí", currency: "USD" },
  { code: "MM", label: "🇲🇲 Myanmar", currency: "USD" },
  { code: "MN", label: "🇲🇳 Mongolia", currency: "USD" },
  { code: "MR", label: "🇲🇷 Mauritania", currency: "USD" },
  { code: "MU", label: "🇲🇺 Mauricio", currency: "USD" },
  { code: "MV", label: "🇲🇻 Maldivas", currency: "USD" },
  { code: "MW", label: "🇲🇼 Malaui", currency: "USD" },
  { code: "MX", label: "🇲🇽 México", currency: "USD" }, // MXN local, pero SWIFT USD
  { code: "MY", label: "🇲🇾 Malasia", currency: "USD" },
  { code: "MZ", label: "🇲🇿 Mozambique", currency: "USD" },

  { code: "NA", label: "🇳🇦 Namibia", currency: "USD" },
  { code: "NE", label: "🇳🇪 Níger", currency: "USD" },
  { code: "NG", label: "🇳🇬 Nigeria", currency: "USD" },
  { code: "NI", label: "🇳🇮 Nicaragua", currency: "USD" },
  { code: "NO", label: "🇳🇴 Noruega", currency: "USD" },
  { code: "NP", label: "🇳🇵 Nepal", currency: "USD" },
  { code: "NR", label: "🇳🇷 Nauru", currency: "USD" },
  { code: "NZ", label: "🇳🇿 Nueva Zelanda", currency: "USD" },

  { code: "OM", label: "🇴🇲 Omán", currency: "USD" },

  { code: "PA", label: "🇵🇦 Panamá", currency: "USD" },
  { code: "PG", label: "🇵🇬 Papúa Nueva Guinea", currency: "USD" },
  { code: "PH", label: "🇵🇭 Filipinas", currency: "USD" },
  { code: "PK", label: "🇵🇰 Pakistán", currency: "USD" },
  { code: "PL", label: "🇵🇱 Polonia", currency: "USD" },
  { code: "PS", label: "🇵🇸 Palestina", currency: "USD" },
  { code: "PY", label: "🇵🇾 Paraguay", currency: "USD" },

  { code: "QA", label: "🇶🇦 Catar", currency: "USD" },

  { code: "RO", label: "🇷🇴 Rumania", currency: "USD" },
  { code: "RS", label: "🇷🇸 Serbia", currency: "USD" },
  { code: "RU", label: "🇷🇺 Rusia", currency: "USD" },
  { code: "RW", label: "🇷🇼 Ruanda", currency: "USD" },

  { code: "SA", label: "🇸🇦 Arabia Saudita", currency: "USD" },
  { code: "SB", label: "🇸🇧 Islas Salomón", currency: "USD" },
  { code: "SC", label: "🇸🇨 Seychelles", currency: "USD" },
  { code: "SD", label: "🇸🇩 Sudán", currency: "USD" },
  { code: "SE", label: "🇸🇪 Suecia", currency: "USD" },
  { code: "SG", label: "🇸🇬 Singapur", currency: "USD" },
  { code: "SL", label: "🇸🇱 Sierra Leona", currency: "USD" },
  { code: "SN", label: "🇸🇳 Senegal", currency: "USD" },
  { code: "SO", label: "🇸🇴 Somalia", currency: "USD" },
  { code: "SR", label: "🇸🇷 Surinam", currency: "USD" },
  { code: "SS", label: "🇸🇸 Sudán del Sur", currency: "USD" },
  { code: "ST", label: "🇸🇹 Santo Tomé y Príncipe", currency: "USD" },
  { code: "SV", label: "🇸🇻 El Salvador", currency: "USD" },
  { code: "SY", label: "🇸🇾 Siria", currency: "USD" },
  { code: "SZ", label: "🇸🇿 Esuatini", currency: "USD" },

  { code: "TD", label: "🇹🇩 Chad", currency: "USD" },
  { code: "TG", label: "🇹🇬 Togo", currency: "USD" },
  { code: "TH", label: "🇹🇭 Tailandia", currency: "USD" },
  { code: "TJ", label: "🇹🇯 Tayikistán", currency: "USD" },
  { code: "TL", label: "🇹🇱 Timor Oriental", currency: "USD" },
  { code: "TN", label: "🇹🇳 Túnez", currency: "USD" },
  { code: "TO", label: "🇹🇴 Tonga", currency: "USD" },
  { code: "TR", label: "🇹🇷 Turquía", currency: "USD" },
  { code: "TT", label: "🇹🇹 Trinidad y Tobago", currency: "USD" },
  { code: "TV", label: "🇹🇻 Tuvalu", currency: "USD" },
  { code: "TZ", label: "🇹🇿 Tanzania", currency: "USD" },

  { code: "UA", label: "🇺🇦 Ucrania", currency: "USD" },
  { code: "UG", label: "🇺🇬 Uganda", currency: "USD" },
  { code: "US", label: "🇺🇸 Estados Unidos", currency: "USD" },
  { code: "UY", label: "🇺🇾 Uruguay", currency: "USD" },
  { code: "UZ", label: "🇺🇿 Uzbekistán", currency: "USD" },

  { code: "VC", label: "🇻🇨 San Vicente y las Granadinas", currency: "USD" },
  { code: "VE", label: "🇻🇪 Venezuela", currency: "USD" },
  { code: "VN", label: "🇻🇳 Vietnam", currency: "USD" },
  { code: "VU", label: "🇻🇺 Vanuatu", currency: "USD" },

  { code: "WS", label: "🇼🇸 Samoa", currency: "USD" },

  { code: "YE", label: "🇾🇪 Yemen", currency: "USD" },

  { code: "ZA", label: "🇿🇦 Sudáfrica", currency: "USD" },
  { code: "ZM", label: "🇿🇲 Zambia", currency: "USD" },
  { code: "ZW", label: "🇿🇼 Zimbabue", currency: "USD" },

  // América (faltantes principales)
  { code: "BZ", label: "🇧🇿 Belice", currency: "USD" },
  { code: "CU", label: "🇨🇺 Cuba", currency: "USD" },
  { code: "GY", label: "🇬🇾 Guyana", currency: "USD" },
  { code: "JM", label: "🇯🇲 Jamaica", currency: "USD" },
  { code: "PY", label: "🇵🇾 Paraguay", currency: "USD" },
  { code: "SR", label: "🇸🇷 Surinam", currency: "USD" },
  { code: "TT", label: "🇹🇹 Trinidad y Tobago", currency: "USD" },
  { code: "VE", label: "🇻🇪 Venezuela", currency: "USD" },

  // Si querés incluir Kosovo (no es ISO oficial en todos lados; se usa XK)
  // { code: "XK", label: "🏳️ Kosovo", currency: "EUR" },
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