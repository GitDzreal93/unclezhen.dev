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
          <TopPathsChart data={data.byPath.slice(0, 10)} locale={locale} />
        )}
      </div>

      {/* Daily trend — dual-line chart (PV + UV) */}
      <div className="settings-card" style={{ maxWidth: "none" }}>
        <h2>{t(locale, "admin.analyticsDaily")}</h2>
        {data.daily.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty__title">—</div>
          </div>
        ) : (
          <TrendChart data={data.daily} locale={locale} />
        )}
      </div>
    </div>
  );
}

// Dual-line SVG chart for daily PV + UV. No chart library — hand-rolled so
// the bundle stays small and colors track the design tokens. The Y axis
// covers max(PV, UV); X axis labels skip to keep ~6 labels max regardless
// of date range.
function TrendChart({
  data,
  locale,
}: {
  data: Array<{ date: string; pv: number; uv: number }>;
  locale: Locale;
}) {
  const W = 720;
  const H = 220;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxV = Math.max(1, ...data.flatMap((d) => [d.pv, d.uv]));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;
  const yOf = (v: number) => PAD_T + innerH - (v / maxV) * innerH;
  const xOf = (i: number) => PAD_L + i * stepX;
  const pathFor = (key: "pv" | "uv") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(i).toFixed(1)} ${yOf(d[key]).toFixed(1)}`)
      .join(" ");

  // ~6 evenly-spaced X labels (skip the rest to avoid overlap)
  const labelCount = Math.min(6, data.length);
  const labelStep = Math.max(1, Math.floor((data.length - 1) / Math.max(1, labelCount - 1)));
  const labelIdxs = Array.from(
    { length: Math.min(labelCount, data.length) },
    (_, k) => Math.min(k * labelStep, data.length - 1),
  );
  // Always show first and last
  const xLabelIdxs = Array.from(new Set([0, ...labelIdxs, data.length - 1])).sort((a, b) => a - b);

  // Y gridlines at 0, 25%, 50%, 75%, 100% of maxV
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(maxV * p));
  const lastDay = data[data.length - 1];
  const dateLocale = locale === "zh" ? "zh-CN" : "en";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", maxWidth: "100%", height: "auto" }}
        role="img"
        aria-label={t(locale, "admin.analyticsDaily")}
      >
        {/* Y gridlines + labels */}
        {yTicks.map((v, i) => {
          const y = yOf(v);
          return (
            <g key={`y-${i}`}>
              <line
                x1={PAD_L}
                x2={W - PAD_R}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray={i === 0 ? "0" : "2 3"}
                strokeWidth={1}
              />
              <text
                x={PAD_L - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="var(--muted)"
                style={{ fontFamily: "var(--font-mono, monospace)" }}
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {xLabelIdxs.map((i) => {
          const x = xOf(i);
          // Show MM-DD only (year is in the title), so labels stay short
          const [, m, d] = data[i].date.split("-");
          return (
            <text
              key={`x-${i}`}
              x={x}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fill="var(--muted)"
              style={{ fontFamily: "var(--font-mono, monospace)" }}
            >
              {m}-{d}
            </text>
          );
        })}

        {/* UV line (dashed, muted) — drawn first so PV sits on top */}
        <path
          d={pathFor("uv")}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* PV line (solid, accent) */}
        <path
          d={pathFor("pv")}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* End-of-range dot for each line */}
        {data.length > 0 && (
          <>
            <circle
              cx={xOf(data.length - 1)}
              cy={yOf(lastDay.uv)}
              r={2.5}
              fill="var(--muted)"
            />
            <circle
              cx={xOf(data.length - 1)}
              cy={yOf(lastDay.pv)}
              r={2.5}
              fill="var(--accent)"
            />
          </>
        )}
      </svg>

      {/* Legend + last-day summary */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: 12,
          color: "var(--muted)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 18,
              height: 2,
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
          PV · {lastDay.pv.toLocaleString()}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 18,
              height: 0,
              borderTop: "2px dashed var(--muted)",
              display: "inline-block",
            }}
          />
          UV · {lastDay.uv.toLocaleString()}
        </span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono, monospace)" }}>
          {data[0].date} → {lastDay.date} · {data.length} {t(locale, "admin.analyticsDate")}
        </span>
      </div>
    </div>
  );
}

// Top-N horizontal stacked bar chart for per-path PV/UV. Each row:
// [path label] [UV segment ███ + repeat segment ▓▓▓] [PV] [UV]
// Input is the API's PV-desc list; we reverse so the highest PV sits at
// the bottom (visually grows downward, common Pareto style). Stack
// composition: UV at the front, "PV - UV" (returns) behind it, so the
// accent color highlights unique reach and the dim extension shows loyalty.
function TopPathsChart({
  data,
  locale,
}: {
  data: AnalyticsResult["byPath"];
  locale: Locale;
}) {
  // reverse: highest PV ends up at the bottom of the chart
  const rows = [...data].reverse();
  const maxPv = Math.max(1, ...rows.map((r) => r.pv));
  const dateLocale = locale === "zh" ? "zh-CN" : "en";

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {/* Header row (matches column alignment) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(120px, 220px) 1fr 56px 56px",
          gap: 12,
          fontSize: 11,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: ".06em",
          padding: "0 2px 4px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span>{t(locale, "admin.analyticsPath")}</span>
        <span>PV · UV</span>
        <span style={{ textAlign: "right" }}>PV</span>
        <span style={{ textAlign: "right" }}>UV</span>
      </div>

      {rows.map((r) => {
        const repeat = Math.max(0, r.pv - r.uv);
        const uvPct = (r.uv / maxPv) * 100;
        const repeatPct = (repeat / maxPv) * 100;
        const lastSeen = new Date(r.lastSeen);
        const lastSeenStr = lastSeen.toLocaleString(dateLocale, {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <div
            key={r.path}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 220px) 1fr 56px 56px",
              gap: 12,
              alignItems: "center",
              fontSize: 12,
              padding: "4px 2px",
            }}
            title={`${r.path}\nPV ${r.pv} · UV ${r.uv}\n最近访问 ${lastSeenStr}`}
          >
            <code
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--fg)",
              }}
            >
              {r.path}
            </code>
            <div
              style={{
                display: "flex",
                height: 18,
                background: "var(--border)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {/* UV segment (solid accent — unique reach) */}
              <div
                style={{
                  width: `${uvPct}%`,
                  background: "var(--accent)",
                  transition: "width .2s",
                }}
              />
              {/* Repeat segment (dimmer accent — PV beyond UV) */}
              <div
                style={{
                  width: `${repeatPct}%`,
                  background: "color-mix(in oklch, var(--accent) 35%, var(--border))",
                  transition: "width .2s",
                }}
              />
            </div>
            <span
              style={{
                textAlign: "right",
                fontFamily: "var(--font-mono, monospace)",
                fontWeight: 600,
              }}
            >
              {r.pv.toLocaleString()}
            </span>
            <span
              style={{
                textAlign: "right",
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--muted)",
              }}
            >
              {r.uv.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
