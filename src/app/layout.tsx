import type { Metadata, Viewport } from "next";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import "./globals.css";

// viewportFit=cover 让 env(safe-area-inset-*) 生效（刘海屏/手势条）。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "site.meta.title"),
    description: t(locale, "site.meta.desc"),
  };
}

// Theme + locale are read from cookies on every request and surfaced as
// the `<html data-theme="..." lang="...">` attributes. CSS variables under
// `[data-theme="..."]` in globals.css drive the look; the lang attribute
// feeds the i18n strings pulled from `t(locale, key)` in each page.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
