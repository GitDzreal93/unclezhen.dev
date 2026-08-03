import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getProjects, getVisibleNavItems, isNavItemVisible } from "@/lib/data";
import { getLocale } from "@/lib/i18n/cookie";
import { getTheme } from "@/lib/theme/cookie";
import { t } from "@/lib/i18n/dict";
import ProjectsClient from "./ProjectsClient";
import "./projects.css";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await getLocale();
  return {
    title: t(locale, "projects.meta.title"),
    description: t(locale, "projects.meta.desc"),
  };
}

export default async function ProjectsPage() {
  if (!(await isNavItemVisible("projects"))) notFound();
  const [projects, items, locale, theme] = await Promise.all([
    getProjects(),
    getVisibleNavItems(),
    getLocale(),
    getTheme(),
  ]);
  return (
    <>
      <SiteNav items={items} active="projects" locale={locale} theme={theme} />
      <main id="main">
        <ProjectsClient projects={projects} locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
