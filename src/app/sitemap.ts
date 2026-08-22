import type { MetadataRoute } from "next";
import { getPosts, getSeriesWithCounts, getVisibleIssues } from "@/lib/data";

// Full-site sitemap. Static routes hardcoded; every blog post, series, and
// daily/weekly issue appended with its own lastModified so Google recrawls
// fresh issues quickly. weekly/* and daily/* share the issues table — both
// routes are emitted (the frontends render whichever exists).
export const dynamic = "force-dynamic";
const BASE = "https://unclezhen.cn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/home`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/blog/series`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/daily`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/weekly`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [posts, series, issues] = await Promise.all([
    getPosts(),
    getSeriesWithCounts(),
    getVisibleIssues(),
  ]);

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.id}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${BASE}/blog/series/${s.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // One issue → both daily and weekly detail routes. publishedAt is the
  // honest lastModified (issues are published once, rarely edited).
  const issueRoutes: MetadataRoute.Sitemap = issues.flatMap((i) => {
    const lastModified = new Date(i.publishedAt);
    return [
      { url: `${BASE}/daily/${i.id}`, lastModified, changeFrequency: "daily" as const, priority: 0.8 },
      { url: `${BASE}/weekly/${i.id}`, lastModified, changeFrequency: "weekly" as const, priority: 0.6 },
    ];
  });

  return [...staticRoutes, ...postRoutes, ...seriesRoutes, ...issueRoutes];
}
