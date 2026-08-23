import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import PageViewTracker from "@/components/PageViewTracker";
import "./globals.css";

// viewportFit=cover 让 env(safe-area-inset-*) 生效（刘海屏/手势条）。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const SITE_URL = "https://unclezhen.cn";

// 站点级 metadata 模板：metadataBase 让各页的相对 canonical/og:url 解析为
// 绝对 URL；robots 显式放开 Google 收录与大图预览（搜索结果里出头图）。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    metadataBase: new URL(SITE_URL),
    title: t(locale, "site.meta.title"),
    description: t(locale, "site.meta.desc"),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "臻叔 · unclezhen.cn",
      locale: locale === "zh" ? "zh_CN" : "en_US",
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
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
  // AdSense：无 client id 时不注入任何脚本（审核期/未开通零开销）。
  // 在 ECS 的 /opt/unclezhen/.env 加 NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxx
  // 并 docker compose up -d --build 即可全局启用。
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} data-theme={theme}>
      <body>
        <PageViewTracker />
        {children}
        {adsenseClient && (
          <Script
            id="adsense-loader"
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        )}
      </body>
    </html>
  );
}
