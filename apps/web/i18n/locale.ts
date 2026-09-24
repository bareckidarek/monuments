export const supportedLocales = ["pl", "en"] as const;
export type Locale = (typeof supportedLocales)[number];

export function resolveLocale(requested?: string | null): Locale {
  return requested?.toLowerCase().startsWith("en") ? "en" : "pl";
}

export function fallbackLocale(locale: Locale): Locale {
  return locale === "en" ? "pl" : "pl";
}
