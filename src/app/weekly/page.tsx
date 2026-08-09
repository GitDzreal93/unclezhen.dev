import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getVisibleIssues, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import WeeklyListClient from "./WeeklyListClient";
import "./weekly.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: t(locale, "weekly.meta.title"),
    description: t(locale, "weekly.meta.desc"),
  };
}

export default async function WeeklyPage() {
  if (!(await isNavItemVisible("blog"))) notFound();
  const [issues, items, locale, theme] = await Promise.all([
    getVisibleIssues(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} active="blog" locale={locale} theme={theme} />
      <main id="main">
        <WeeklyListClient issues={issues} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
