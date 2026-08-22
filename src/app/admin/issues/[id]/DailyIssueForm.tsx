"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { Issue } from "@/lib/data";
import { saveDailyIssue } from "@/lib/admin";
import {
  type DailyNewsBody,
  type DailyRanksBody,
  type DailyOssBody,
  type DailySideBody,
  type DailyKnowBody,
  type DailyBioBody,
  type DailyAdsBody,
} from "@/lib/issues-types";
import { renderMarkdownPreview as renderPreview } from "@/lib/admin-markdown";

// 赛博日报 v3.0 整期编辑器。每个板块就是 1–2 个 markdown 大文本框 + 少量
// 结构化字段（hero 图、boards、stats、ads、code）。样式性字段（kicker /
// tagline / signature / rank / color）从 UI 完全移除，由渲染端从
// DAILY_DEFAULTS 读默认值。

type SectionStates = {
  news: DailyNewsBody;
  ranks: DailyRanksBody;
  oss: DailyOssBody;
  side: DailySideBody;
  know: DailyKnowBody;
  bio: DailyBioBody;
  ads: DailyAdsBody;
};

function emptySections(): SectionStates {
  return {
    news: { image: "", body: "", wire: [] },
    ranks: { intro: "", boards: [] },
    oss: { body: "", stats: [] },
    side: { body: "" },
    know: { body: "", code: "" },
    bio: { image: "", body: "", quote: "" },
    ads: { items: [] },
  };
}

const KIND_ORDER = [
  { key: "news", kind: "daily_news", no: "01", title: "头版要闻", hint: "hero image + markdown 正文 + 简讯列表" },
  { key: "ranks", kind: "daily_ranks", no: "02", title: "今日热榜", hint: "导读 + 4 个榜（每个榜 1 行 / 1 条目）" },
  { key: "oss", kind: "daily_oss", no: "03", title: "今日开源项目", hint: "markdown 介绍 + 统计" },
  { key: "side", kind: "daily_side", no: "04", title: "副业线报", hint: "1 段 markdown（建议用列表语法）" },
  { key: "know", kind: "daily_know", no: "05", title: "软件常识", hint: "markdown 解释 + 可选代码块" },
  { key: "bio", kind: "daily_bio", no: "06", title: "IT 人物志", hint: "hero image + markdown 介绍 + 金句" },
  { key: "ads", kind: "daily_ads", no: "07", title: "广告位", hint: "每行 1 条：标题│描述│联系方式" },
] as const;

export default function DailyIssueForm({ issue }: { issue?: Issue & { sections?: { kind: string; body: unknown }[] } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState<string | null>("news");

  const [id, setId] = useState(issue?.id ?? "");
  const [issueNo, setIssueNo] = useState(String(issue?.issueNo ?? ""));
  const [title, setTitle] = useState(issue?.title ?? "");
  const [weather, setWeather] = useState(issue?.weather ?? "");
  const [publishedAt, setPublishedAt] = useState(issue?.publishedAt ?? todayISO());
  const [visible, setVisible] = useState(Boolean(issue?.visible));

  const [sec, setSec] = useState<SectionStates>(() => {
    const base = emptySections();
    for (const s of issue?.sections ?? []) {
      const body = s.body as any;
      if (!body || typeof body !== "object") continue;
      if (s.kind === "daily_news") base.news = { image: body.image || "", body: body.body || "", wire: body.wire || [] };
      else if (s.kind === "daily_ranks") base.ranks = { intro: body.intro || "", boards: body.boards || [] };
      else if (s.kind === "daily_oss") base.oss = { body: body.body || "", stats: body.stats || [] };
      else if (s.kind === "daily_side") base.side = { body: body.body || "" };
      else if (s.kind === "daily_know") base.know = { body: body.body || "", code: body.code || "" };
      else if (s.kind === "daily_bio") base.bio = { image: body.image || "", body: body.body || "", quote: body.quote || "" };
      else if (s.kind === "daily_ads") base.ads = { items: body.items || [] };
    }
    return base;
  });

  function patch<K extends keyof SectionStates>(key: K, value: Partial<SectionStates[K]>) {
    setSec((s) => ({ ...s, [key]: { ...s[key], ...value } }));
  }

  // A section counts as "filled" if its headline-ish field has content.
  function isFilled(key: keyof SectionStates): boolean {
    const s = sec[key] as any;
    if (key === "news") return Boolean((s.body || "").trim() || (s.wire || []).length);
    if (key === "ranks") return Boolean((s.boards || []).some((b: any) => b.name && (b.items || []).length));
    if (key === "oss") return Boolean((s.body || "").trim());
    if (key === "side") return Boolean((s.body || "").trim());
    if (key === "know") return Boolean((s.body || "").trim() || (s.code || "").trim());
    if (key === "bio") return Boolean((s.body || "").trim());
    if (key === "ads") return Boolean((s.items || []).some((i: any) => i.title));
    return false;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const sections = KIND_ORDER
      .filter((k) => isFilled(k.key))
      .map((k) => ({ kind: k.kind, body: sec[k.key] }));
    const fd = new FormData();
    fd.set("id", id.trim());
    fd.set("issueNo", issueNo);
    fd.set("title", title);
    fd.set("weather", weather);
    fd.set("publishedAt", publishedAt);
    fd.set("visible", visible ? "true" : "false");
    fd.set("sections", JSON.stringify(sections));
    startTransition(async () => {
      try {
        await saveDailyIssue(fd);
        setSaved(true);
        router.refresh();
      } catch (err) {
        setError(String((err as Error).message || err));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="admin-form admin-form--panel">
      {error && <div className="field-error" style={{ marginBottom: 12 }}>{error}</div>}
      {saved && <div className="field-hint" style={{ marginBottom: 12, color: "var(--success)" }}>已保存 ✓（{visible ? "已发布" : "草稿"}）</div>}

      <h3 style={{ margin: "0 0 12px" }}>期号信息</h3>
      <div className="row2">
        <div className="field">
          <label>期刊 ID</label>
          <input type="text" value={id} onChange={(e) => setId(e.target.value)} required placeholder="daily-2026-08-21" />
          <span className="field-hint">约定以 daily- 开头，例 /daily/{id || "daily-xxx"}</span>
        </div>
        <div className="field">
          <label>期号</label>
          <input type="number" min={1} value={issueNo} onChange={(e) => setIssueNo(e.target.value)} required />
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label>标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="赛博日报 · 第 9 期" />
        </div>
        <div className="field">
          <label>天气</label>
          <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="晴 24–32℃" />
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label>发布日期</label>
          <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} required />
        </div>
        <div className="field">
          <label>状态</label>
          <label className="field-check" style={{ paddingTop: 8 }}>
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            <span>对外发布（不勾选 = 草稿，前台不可见）</span>
          </label>
        </div>
      </div>

      <h3 style={{ margin: "24px 0 8px" }}>板块内容（可留空）</h3>
      <p className="field-hint" style={{ margin: "0 0 12px" }}>
        写 markdown 即可——支持 <code>**粗体**</code> / <code>*斜体*</code> / <code>[链接](url)</code> / <code>![配图](url)</code> /
        列表 / 引用 / 标题（<code>##</code>）。也可以直接写 HTML 标签，渲染时会自动清洗。
      </p>
      {KIND_ORDER.map((k) => {
        const isOpen = open === k.key;
        const filled = isFilled(k.key);
        return (
          <div key={k.key} className="daily-ed-section">
            <button
              type="button"
              className="daily-ed-head"
              onClick={() => setOpen(isOpen ? null : k.key)}
              aria-expanded={isOpen}
            >
              <span className="daily-ed-no">{k.no}</span>
              <span>{k.title}</span>
              <span className="daily-ed-state">{filled ? "已填" : "空"}</span>
              <span className="daily-ed-caret">{isOpen ? "▾" : "▸"}</span>
            </button>
            {isOpen && (
              <div className="daily-ed-body">
                <p className="field-hint" style={{ margin: "0 0 10px" }}>{k.hint}</p>
                {k.key === "news" && <NewsEditor value={sec.news} onChange={(v) => patch("news", v)} />}
                {k.key === "ranks" && <RanksEditor value={sec.ranks} onChange={(v) => patch("ranks", v)} />}
                {k.key === "oss" && <OssEditor value={sec.oss} onChange={(v) => patch("oss", v)} />}
                {k.key === "side" && <SideEditor value={sec.side} onChange={(v) => patch("side", v)} />}
                {k.key === "know" && <KnowEditor value={sec.know} onChange={(v) => patch("know", v)} />}
                {k.key === "bio" && <BioEditor value={sec.bio} onChange={(v) => patch("bio", v)} />}
                {k.key === "ads" && <AdsEditor value={sec.ads} onChange={(v) => patch("ads", v)} />}
              </div>
            )}
          </div>
        );
      })}

      <div className="admin-form__actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={pending}>
          {pending ? "保存中…" : "保存整期（含未展开板块）"}
        </button>
      </div>
    </form>
  );
}

// ============ shared bits ============

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ImageField({ value, onChange, label = "配图 URL" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", f);
    fetch("/api/admin/upload-image", { method: "POST", body: fd })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "上传失败");
        onChange(data.url);
      })
      .catch((e2) => setErr(e2 instanceof Error ? e2.message : "上传失败"))
      .finally(() => {
        setUploading(false);
        if (e.target) e.target.value = "";
      });
  }
  return (
    <div className="field">
      <label>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://cdn.example.com/img.png" style={{ flex: 1 }} />
        <label className="btn btn--ghost btn--sm" style={{ cursor: uploading ? "wait" : "pointer", whiteSpace: "nowrap" }}>
          {uploading ? "上传中…" : "上传图片"}
          <input type="file" accept="image/*" onChange={onUpload} hidden disabled={uploading} />
        </label>
      </div>
      {err && <span className="field-error">{err}</span>}
    </div>
  );
}

/**
 * Markdown 编辑器：textarea + 插入图片 + 实时预览。
 * 「插入图片」调用现有的 /api/admin/upload-image，把返回的 URL 插入到光标
 * 位置，格式为 `![alt](url)`，与 markdown 渲染端一致。
 */
function MarkdownField({ value, onChange, label, rows = 8, placeholder }: { value: string; onChange: (v: string) => void; label?: string; rows?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function insertAtCursor(text: string) {
    const ta = ref.current;
    if (!ta) {
      onChange(value + text);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function onUpload(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setErr("");
    const fd = new FormData();
    fd.append("file", f);
    fetch("/api/admin/upload-image", { method: "POST", body: fd })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "上传失败");
        const alt = f.name.replace(/\.[^.]+$/, "");
        insertAtCursor(`![${alt}](${data.url})`);
      })
      .catch((e2) => setErr(e2 instanceof Error ? e2.message : "上传失败"))
      .finally(() => {
        setUploading(false);
        if (e.target) e.target.value = "";
      });
  }

  return (
    <div className="field">
      {label && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <label style={{ margin: 0 }}>{label}</label>
          <div style={{ display: "flex", gap: 6 }}>
            <label className="btn btn--ghost btn--sm" style={{ cursor: uploading ? "wait" : "pointer" }}>
              {uploading ? "上传中…" : "插入图片"}
              <input type="file" accept="image/*" onChange={onUpload} hidden disabled={uploading} />
            </label>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowPreview((v) => !v)}>
              {showPreview ? "隐藏预览" : "预览"}
            </button>
          </div>
        </div>
      )}
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
      />
      {err && <span className="field-error">{err}</span>}
      {showPreview && value.trim() && (
        <div className="dp-md" style={{ marginTop: 8, padding: 12, background: "var(--bg-soft, transparent)", border: "1px solid var(--rule, #e3e3e3)", borderRadius: 4 }}
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      )}
    </div>
  );
}

// ============ 01 头版要闻 ============

function NewsEditor({ value, onChange }: { value: DailyNewsBody; onChange: (v: Partial<DailyNewsBody>) => void }) {
  return (
    <>
      <ImageField value={value.image || ""} onChange={(url) => onChange({ image: url })} label="头版主视觉（hero image，可空）" />
      <MarkdownField
        value={value.body}
        onChange={(v) => onChange({ body: v })}
        label="正文（markdown）"
        rows={10}
        placeholder={"## 副标题\n\n第一段正文……\n\n![配图说明](https://...)\n\n> 一段引用"}
      />
      <div className="field">
        <label>简讯（每行：分类│内容；分类可空）</label>
        <textarea
          rows={5}
          value={(value.wire || []).map((w) => `${w.tag || ""}│${w.text || ""}`).join("\n")}
          onChange={(e) =>
            onChange({
              wire: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
                const [tag = "", ...rest] = line.split(/[│|]/);
                return { tag: tag.trim(), text: rest.join("│").trim() };
              }),
            })
          }
          placeholder={"具身智能│原力灵机发布 DM0.5…\ndsh 生态│dsh-routing-suite 单周 +6K star…"}
        />
      </div>
    </>
  );
}

// ============ 02 今日热榜 ============

function RanksEditor({ value, onChange }: { value: DailyRanksBody; onChange: (v: Partial<DailyRanksBody>) => void }) {
  return (
    <>
      <MarkdownField value={value.intro || ""} onChange={(v) => onChange({ intro: v })} label="导读（可空）" rows={2} />
      <div className="field">
        <label>榜单（颜色自动循环，无需配）</label>
        <div style={{ display: "grid", gap: 10 }}>
          {(value.boards || []).map((board, i) => (
            <div key={i} style={{ border: "1px solid var(--rule, #e3e3e3)", borderRadius: 6, padding: 10, display: "grid", gap: 8 }}>
              <div className="row2">
                <div className="field">
                  <label>榜单名</label>
                  <input type="text" value={board.name} onChange={(e) => {
                    const next = [...(value.boards || [])];
                    next[i] = { ...board, name: e.target.value };
                    onChange({ boards: next });
                  }} placeholder="Skills 榜" />
                </div>
                <div className="field">
                  <label>数据源</label>
                  <input type="text" value={board.source || ""} onChange={(e) => {
                    const next = [...(value.boards || [])];
                    next[i] = { ...board, source: e.target.value };
                    onChange({ boards: next });
                  }} placeholder="skills.sh 按安装量" />
                </div>
              </div>
              <div className="field">
                <label>条目（每行：名称│数值│描述│链接）</label>
                <textarea
                  rows={Math.max(3, (board.items || []).length + 1)}
                  value={(board.items || []).map((it) => [it.name, it.value, it.desc || "", it.url || ""].join("│")).join("\n")}
                  onChange={(e) => {
                    const next = [...(value.boards || [])];
                    next[i] = {
                      ...board,
                      items: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
                        const [name = "", val = "", desc = "", url = ""] = line.split("│");
                        return { name: name.trim(), value: val.trim(), desc: desc.trim(), url: url.trim() };
                      }),
                    };
                    onChange({ boards: next });
                  }}
                />
              </div>
              <div className="field">
                <label>观察（可空）</label>
                <input type="text" value={board.note || ""} onChange={(e) => {
                  const next = [...(value.boards || [])];
                  next[i] = { ...board, note: e.target.value };
                  onChange({ boards: next });
                }} />
              </div>
              <button type="button" className="btn btn--ghost btn--sm" style={{ justifySelf: "start" }} onClick={() => {
                onChange({ boards: (value.boards || []).filter((_, j) => j !== i) });
              }}>删除该榜</button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost btn--sm" style={{ justifySelf: "start" }} onClick={() => {
            onChange({ boards: [...(value.boards || []), { name: "", source: "", items: [], note: "" }] });
          }}>+ 加一个榜</button>
        </div>
      </div>
    </>
  );
}

// ============ 03 开源项目 ============

function OssEditor({ value, onChange }: { value: DailyOssBody; onChange: (v: Partial<DailyOssBody>) => void }) {
  return (
    <>
      <MarkdownField
        value={value.body}
        onChange={(v) => onChange({ body: v })}
        label="项目介绍（markdown）"
        rows={10}
        placeholder={"## yjh051108/dsh-routing-suite — 让 Agent 自己挑模型\n\n*PowerShell · 单周 +6.0K star*\n\n正文段落……"}
      />
      <div className="field">
        <label>统计（每行：标签│值）</label>
        <textarea
          rows={4}
          value={(value.stats || []).map((s) => `${s.label}│${s.value}`).join("\n")}
          onChange={(e) =>
            onChange({
              stats: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
                const [label = "", val = ""] = line.split("│");
                return { label: label.trim(), value: val.trim() };
              }),
            })
          }
          placeholder={"★│6.0K\nLang│PowerShell"}
        />
      </div>
    </>
  );
}

// ============ 04 副业线报 ============

function SideEditor({ value, onChange }: { value: DailySideBody; onChange: (v: Partial<DailySideBody>) => void }) {
  return (
    <MarkdownField
      value={value.body}
      onChange={(v) => onChange({ body: v })}
      label="副业线报（markdown 列表）"
      rows={10}
      placeholder={
        "- **AI 简历优化服务** — 用 LLM 批量诊断简历，每份 9.9 _(AI)_\n" +
        "- **DSH 插件开发** — DeepSeek Harness 生态正缺好插件 _(技术红利)_\n" +
        "- **海外问卷代填** — 单条 1–3 美元，时间灵活 _(网赚)_"
      }
    />
  );
}

// ============ 05 软件常识 ============

function KnowEditor({ value, onChange }: { value: DailyKnowBody; onChange: (v: Partial<DailyKnowBody>) => void }) {
  return (
    <>
      <MarkdownField
        value={value.body}
        onChange={(v) => onChange({ body: v })}
        label="解释（markdown）"
        rows={10}
        placeholder={"## 什么是 VLA 模型？\n\n视觉-语言-动作模型……\n\n> **小结**：一句话总结"}
      />
      <div className="field">
        <label>代码示例（可空，独立的代码块）</label>
        <textarea
          rows={6}
          value={value.code || ""}
          onChange={(e) => onChange({ code: e.target.value })}
          style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          placeholder={"# 示例代码\nfrom vla import Agent\nagent = Agent.load('dm0.5')\nagent.act(obs)"}
        />
      </div>
    </>
  );
}

// ============ 06 人物志 ============

function BioEditor({ value, onChange }: { value: DailyBioBody; onChange: (v: Partial<DailyBioBody>) => void }) {
  return (
    <>
      <ImageField value={value.image || ""} onChange={(url) => onChange({ image: url })} label="人物志配图（hero image，可空）" />
      <MarkdownField
        value={value.body}
        onChange={(v) => onChange({ body: v })}
        label="人物介绍（markdown）"
        rows={10}
        placeholder={"## 丹尼斯 · 里奇：他造了一座钟\n\n*Dennis Ritchie · 1941–2011 · C 语言与 UNIX 之父*\n\n正文……"}
      />
      <div className="field">
        <label>金句（可空）</label>
        <textarea rows={2} value={value.quote || ""} onChange={(e) => onChange({ quote: e.target.value })} placeholder="「我做的事情，就是让机器与人都能读懂这门语言。」" />
      </div>
    </>
  );
}

// ============ 07 广告位 ============

function AdsEditor({ value, onChange }: { value: DailyAdsBody; onChange: (v: Partial<DailyAdsBody>) => void }) {
  return (
    <div className="field">
      <label>广告（每行：标题│描述│联系方式；不足 10 席前台自动补默认占位）</label>
      <textarea
        rows={Math.max(5, (value.items || []).length + 1)}
        value={(value.items || []).map((a) => `${a.title}│${a.desc || ""}│${a.contact || ""}`).join("\n")}
        onChange={(e) =>
          onChange({
            items: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
              const [title = "", desc = "", contact = ""] = line.split("│");
              return { title: title.trim(), desc: desc.trim(), contact: contact.trim() };
            }),
          })
        }
        placeholder={"Agent 培训班招租│触达 3W+ 开发者│ads@saibo.daily\nGitHub 项目投放│新开源求曝光│ads@saibo.daily"}
      />
    </div>
  );
}
