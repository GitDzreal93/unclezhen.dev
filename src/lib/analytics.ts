// Server-only analytics queries. Consumed directly by the admin page
// (server component) and by /api/admin/analytics (for API token access).
// No HTTP hop when called from the admin page — just a few parameterized
// SQL queries against the page_views / page_visitor_paths tables.
import { query } from "./db";

export type AnalyticsRange = { from: string; to: string; path?: string };

export type AnalyticsResult = {
  total: { pv: number; uv: number; visitors: number };
  byPath: Array<{ path: string; pv: number; uv: number; lastSeen: string }>;
  daily: Array<{ date: string; pv: number; uv: number }>;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function defaultRange(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { from: isoDate(from), to: isoDate(to) };
}

export async function getAnalytics(input: AnalyticsRange): Promise<AnalyticsResult> {
  const { from, to, path } = input;

  // totals: per-path-filter vs global. Two pairs of count queries.
  const totalsPromise = (async () => {
    if (path) {
      const pvRows = await query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM page_views
         WHERE path = $1
           AND created_at >= $2::date
           AND created_at < ($3::date + 1)`,
        [path, from, to],
      );
      const uvRows = await query<{ c: string }>(
        `SELECT COUNT(*)::text AS c FROM page_visitor_paths
         WHERE path = $1 AND visit_date BETWEEN $2::date AND $3::date`,
        [path, from, to],
      );
      return { pv: Number(pvRows[0]?.c ?? 0), uv: Number(uvRows[0]?.c ?? 0) };
    }
    const pvRows = await query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM page_views
       WHERE created_at >= $1::date AND created_at < ($2::date + 1)`,
      [from, to],
    );
    const uvRows = await query<{ c: string }>(
      `SELECT COUNT(*)::text AS c FROM page_visitor_paths
       WHERE visit_date BETWEEN $1::date AND $2::date`,
      [from, to],
    );
    return { pv: Number(pvRows[0]?.c ?? 0), uv: Number(uvRows[0]?.c ?? 0) };
  })();

  // Distinct visitors in the window (cross-path).
  const visitorsPromise = query<{ c: string }>(
    `SELECT COUNT(DISTINCT visitor_id)::text AS c FROM page_views
     WHERE created_at >= $1::date AND created_at < ($2::date + 1)`,
    [from, to],
  );

  // Top 50 paths by PV. The UV sub-select per row is intentional — using
  // a JOIN would multiply PV and break the count. With 50 rows this stays
  // cheap; if traffic grows we can switch to a CTE+LATERAL.
  const byPathPromise = query<{ path: string; pv: string; uv: string; last_seen: string }>(
    `SELECT
       v.path,
       COUNT(*)::text AS pv,
       (SELECT COUNT(*)::text FROM page_visitor_paths pvp
          WHERE pvp.path = v.path
            AND pvp.visit_date BETWEEN $1::date AND $2::date) AS uv,
       MAX(v.created_at) AS last_seen
     FROM page_views v
     WHERE v.created_at >= $1::date AND v.created_at < ($2::date + 1)
     GROUP BY v.path
     ORDER BY COUNT(*) DESC
     LIMIT 50`,
    [from, to],
  );

  // Daily series: fill missing days with 0 via generate_series LEFT JOIN.
  // visit_date is stored, not derived, so this is a simple index scan. The
  // series alias is `day` to avoid colliding with the subquery `d` column.
  const dailyPromise = query<{ date: string; pv: string; uv: string }>(
    `SELECT day::date::text AS date,
            COALESCE(pv.c, 0)::text AS pv,
            COALESCE(uv.c, 0)::text AS uv
     FROM generate_series($1::date, $2::date, '1 day') AS day
     LEFT JOIN (
       SELECT (created_at AT TIME ZONE 'UTC')::date AS d, COUNT(*) AS c
       FROM page_views
       WHERE created_at >= $1::date AND created_at < ($2::date + 1)
       GROUP BY 1
     ) pv ON pv.d = day
     LEFT JOIN (
       SELECT visit_date AS d, COUNT(*) AS c
       FROM page_visitor_paths
       WHERE visit_date BETWEEN $1::date AND $2::date
       GROUP BY 1
     ) uv ON uv.d = day
     ORDER BY day ASC`,
    [from, to],
  );

  const [totals, visitorsRows, byPathRows, dailyRows] = await Promise.all([
    totalsPromise,
    visitorsPromise,
    byPathPromise,
    dailyPromise,
  ]);

  return {
    total: { ...totals, visitors: Number(visitorsRows[0]?.c ?? 0) },
    byPath: byPathRows.map((r) => ({
      path: r.path,
      pv: Number(r.pv),
      uv: Number(r.uv),
      lastSeen: new Date(r.last_seen).toISOString(),
    })),
    daily: dailyRows.map((r) => ({
      date: r.date,
      pv: Number(r.pv),
      uv: Number(r.uv),
    })),
  };
}
