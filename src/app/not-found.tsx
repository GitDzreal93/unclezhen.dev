import { ErrorTerminal } from "./_components/ErrorTerminal";
import { getLocale } from "@/lib/i18n/cookie";

// Server component (no "use client") so it can call cookies() via
// getLocale. not-found.tsx is rendered for any unmatched route AND for
// `notFound()` calls within a page, so this file runs on the server.
export default async function NotFound() {
  const locale = await getLocale();
  return <ErrorTerminal variant="not-found" locale={locale} resetHref="/" />;
}
