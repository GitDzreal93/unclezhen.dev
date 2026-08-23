"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { t, type Locale } from "@/lib/i18n/dict";
import type { AnalyticsResult } from "@/lib/analytics";

type Props = {
  data: AnalyticsResult;
  from: string;
  to: string;
  path: string;
  locale: Locale;
};

const PRESETS: Array<{ label: string; days: number }> = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(iso: string, delta: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + delta);
  return ymd(d);
}

// Inline styles for the trend bar — small, one component, no need to
// touch the global admin.css.
const trendTrackStyle: React.CSSProperties = {
  background: "var(--border)",
  height: 8,
  borderRadius: 4,
  overflow: "hidden",
  minWidth: 60,
};

export default function AnalyticsView({ data, from, to, path, locale }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/analytics?${qs}` : "/admin/analytics");
    });
  }

  function applyPreset(days: number) {
    const today = ymd(new Date());
    pushParams({ from: shiftDays(today, -days + 1), to: today });
  }

  const total = data.total;
  const maxDailyPv = Math.max(1, ...data.daily.map((d) => d.pv));

  return (
    <div
      className="settings-stack"
      data-pending={pending ? "true" : undefined}
      style={{ display: "grid", gap: 16, maxWidth: 900, opacity: pending ? 0.6 : 1, transition: "opacity .15s" }}
    >
      {/* Filter bar */}
      <div className="settings-card" style={{ maxWidth: "none" }}>
        <h2>{t(locale, "admin.analytics")}</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: 4, fontSize: 12, color: "var(--muted)" }}>
            {t(locale, "admin.analyticsFrom")}
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => pushParams({ from: e.target.value })}
              style={{ font: "inherit", padding: "6px 8px", background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 4 }}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, color: "var(--muted)" }}>
            {t(locale, "admin.analyticsTo")}
            <input
              type="date"
              value={to}
              min={from}
              max={ymd(new Date())}
              onChange={(e) => pushParams({ to: e.target.value })}
              style={{ font: "inherit", padding: "6px 8px", background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 4 }}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, color: "var(--muted)" }}>
            {t(locale, "admin.analyticsPath")}
            <input
              type="text"
              value={path}
              placeholder="/blog, /projects/…"
              onChange={(e) => pushParams({ path: e.target.value || undefined })}
              style={{ font: "inherit", padding: "6px 8px", background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 4 }}
            />
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="btn btn--ghost"
                onClick={() => applyPreset(p.days)}
                style={{ fontSize: 12 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <div className="settings-card" style={{ maxWidth: "none" }}>
          <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em" }}>
            {t(locale, "admin.analyticsPV")}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600 }}>
            {total.pv.toLocaleString()}
          </div>
        </div>
        <div className="settings-card" style={{ maxWidth: "none" }}>
          <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em" }}>
            {t(locale, "admin.analyticsUV")}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600 }}>
            {total.uv.toLocaleString()}
          </div>
        </div>
        <div className="settings-card" style={{ maxWidth: "none" }}>
          <div style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em" }}>
            {t(locale, "admin.analyticsVisitors")}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600 }}>
            {total.visitors.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Per-path table */}
      <div className="settings-card" style={{ maxWidth: "none" }}>
        <h2>{t(locale, "admin.analyticsByPath")}</h2>
        {data.byPath.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__title">{t(locale, "admin.analyticsEmpty")}</div>
            <p className="admin-empty__desc">{t(locale, "admin.analyticsEmptyDesc")}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t(locale, "admin.analyticsPath")}</th>
                  <th style={{ textAlign: "right" }}>PV</th>
                  <th style={{ textAlign: "right" }}>UV</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "admin.analyticsLastSeen")}</th>
                </tr>
              </thead>
              <tbody>
                {data.byPath.map((r) => (
                  <tr key={r.path}>
                    <td><code>{r.path}</code></td>
                    <td style={{ textAlign: "right" }}>{r.pv.toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>{r.uv.toLocaleString()}</td>
                    <td style={{ textAlign: "right", color: "var(--muted)", fontSize: 12 }}>
                      {new Date(r.lastSeen).toLocaleString(locale === "zh" ? "zh-CN" : "en")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily trend */}
      <div className="settings-card" style={{ maxWidth: "none" }}>
        <h2>{t(locale, "admin.analyticsDaily")}</h2>
        {data.daily.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__title">—</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t(locale, "admin.analyticsDate")}</th>
                  <th style={{ textAlign: "right" }}>PV</th>
                  <th style={{ textAlign: "right" }}>UV</th>
                  <th style={{ width: "40%" }}>{t(locale, "admin.analyticsTrend")}</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((d) => (
                  <tr key={d.date}>
                    <td><code>{d.date}</code></td>
                    <td style={{ textAlign: "right" }}>{d.pv.toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>{d.uv.toLocaleString()}</td>
                    <td>
                      <div style={trendTrackStyle}>
                        <div
                          style={{
                            width: `${Math.round((d.pv / maxDailyPv) * 100)}%`,
                            height: "100%",
                            background: "var(--accent)",
                            transition: "width .2s",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
