import type { Metadata } from "next";
import LauncherStage from "@/components/LauncherStage";
import { getVisibleNavItems } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import "./launcher.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "launcher.meta.title"),
    description: t(locale, "launcher.meta.desc"),
  };
}

export const dynamic = "force-dynamic";

export default async function LauncherPage() {
  const [items, locale, theme] = await Promise.all([
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <main className="launch" id="launcher">
      <LauncherStage items={items} locale={locale} theme={theme} />
    </main>
  );
}
