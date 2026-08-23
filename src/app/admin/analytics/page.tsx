import { getAnalytics, defaultRange } from "@/lib/analytics";
import { getLocale } from "@/lib/i18n/cookie";
import { t } from "@/lib/i18n/dict";
import AnalyticsView from "./AnalyticsView";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const defaults = defaultRange(30);
  const from = typeof sp.from === "string" ? sp.from : defaults.from;
  const to = typeof sp.to === "string" ? sp.to : defaults.to;
  const path = typeof sp.path === "string" ? sp.path : undefined;

  const data = await getAnalytics({ from, to, path });

  return (
    <>
      <div className="admin-head">
        <h1>{t(locale, "admin.analytics")}</h1>
      </div>
      <p className="page-sub">{t(locale, "admin.analyticsDesc")}</p>
      <AnalyticsView
        data={data}
        from={from}
        to={to}
        path={path ?? ""}
        locale={locale}
      />
    </>
  );
}
