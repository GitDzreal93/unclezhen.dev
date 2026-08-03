import { cookies } from "next/headers";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "./dict";

const COOKIE = "locale";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

// Server-only reader. Validate against the supported list so a tampered
// cookie can't crash the site — an unsupported value falls back to the
// default. This file is only imported by server components and server
// actions; client components import the t() helper directly from dict.ts
// and never see this module, which keeps next/headers out of the client
// bundle.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(COOKIE)?.value;
  if (v && (SUPPORTED_LOCALES as string[]).includes(v)) return v as Locale;
  return DEFAULT_LOCALE;
}
