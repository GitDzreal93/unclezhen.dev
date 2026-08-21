"use client";

import { useState, useTransition, type ChangeEvent } from "react";
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

// 赛博日报 v2.0 整期编辑器：7 个板块各一个可折叠卡片，一次「保存整期」。
// 板块留空 = 该板块不落库（前台直接跳过渲染）。visible 关 = 草稿。

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
    news: { image: "", imageCaption: "", kicker: "头 条", title: "", subtitle: "", paragraphs: [""], wire: [] },
    ranks: { intro: "", boards: [{ name: "", color: "#7c3aed", source: "", items: [], note: "" }] },
    oss: { rank: "#1", tagline: "TODAY'S PICK", title: "", meta: "", paragraphs: [""], stats: [] },
    side: { intro: "", items: [] },
    know: { title: "", subtitle: "", paragraphs: [""], code: "", summary: "" },
    bio: { image: "", imageCaption: "", chapter: "", title: "", enMeta: "", paragraphs: [""], quote: "", signature: "—— 臻叔 识" },
    ads: { items: [] },
  };
}

const KIND_ORDER = [
  { key: "news", kind: "daily_news", no: "01", title: "头版要闻" },
  { key: "ranks", kind: "daily_ranks", no: "02", title: "今日热榜" },
  { key: "oss", kind: "daily_oss", no: "03", title: "今日开源项目" },
  { key: "side", kind: "daily_side", no: "04", title: "副业线报" },
  { key: "know", kind: "daily_know", no: "05", title: "软件常识" },
  { key: "bio", kind: "daily_bio", no: "06", title: "IT 人物志" },
  { key: "ads", kind: "daily_ads", no: "07", title: "广告位" },
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

  // Hydrate section states from existing rows (if editing a saved issue).
  const [sec, setSec] = useState<SectionStates>(() => {
    const base = emptySections();
    for (const s of issue?.sections ?? []) {
      const body = s.body as any;
      if (!body || typeof body !== "object") continue;
      if (s.kind === "daily_news") base.news = { ...base.news, ...body };
      else if (s.kind === "daily_ranks") base.ranks = { ...base.ranks, ...body };
      else if (s.kind === "daily_oss") base.oss = { ...base.oss, ...body };
      else if (s.kind === "daily_side") base.side = { ...base.side, ...body };
      else if (s.kind === "daily_know") base.know = { ...base.know, ...body };
      else if (s.kind === "daily_bio") base.bio = { ...base.bio, ...body };
      else if (s.kind === "daily_ads") base.ads = { ...base.ads, ...body };
    }
    return base;
  });

  function patch<K extends keyof SectionStates>(key: K, value: Partial<SectionStates[K]>) {
    setSec((s) => ({ ...s, [key]: { ...s[key], ...value } }));
  }

  // A section counts as "filled" if its headline-ish field has content — empty
  // sections are dropped from the save payload entirely.
  function isFilled(key: keyof SectionStates): boolean {
    const s = sec[key] as any;
    if (key === "news") return Boolean(s.title || (s.wire && s.wire.length));
    if (key === "ranks") return Boolean(s.boards?.some((b: any) => b.name && b.items?.length));
    if (key === "oss" || key === "know" || key === "bio") return Boolean(s.title);
    if (key === "side") return Boolean(s.items?.some((i: any) => i.title || i.desc));
    if (key === "ads") return Boolean(s.items?.some((i: any) => i.title));
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

function ParagraphsField({ value, onChange, label = "正文段落" }: { value: string[]; onChange: (v: string[]) => void; label?: string }) {
  return (
    <div className="field">
      <label>{label}（每行一段）</label>
      <textarea
        rows={Math.max(3, value.length + 1)}
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n"))}
      />
    </div>
  );
}

function LinesEditor<T>({ items, onChange, blank, render, addLabel }: {
  items: T[];
  onChange: (v: T[]) => void;
  blank: () => T;
  render: (item: T, set: (v: T) => void, i: number) => React.ReactNode;
  addLabel: string;
}) {
  return (
    <div className="daily-ed-lines">
      {items.map((item, i) => (
        <div className="daily-ed-line" key={i}>
          {render(item, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            style={{ alignSelf: "flex-start" }}
          >
            删除
          </button>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange([...items, blank()])}>
        + {addLabel}
      </button>
    </div>
  );
}

// ============ 01 头版要闻 ============

function NewsEditor({ value, onChange }: { value: DailyNewsBody; onChange: (v: Partial<DailyNewsBody>) => void }) {
  return (
    <>
      <ImageField value={value.image} onChange={(url) => onChange({ image: url })} label="头版主视觉 URL" />
      <div className="field">
        <label>图片说明</label>
        <input type="text" value={value.imageCaption} onChange={(e) => onChange({ imageCaption: e.target.value })} placeholder="臻叔 绘 · 今日头版主视觉" />
      </div>
      <div className="row2">
        <div className="field">
          <label>Kicker</label>
          <input type="text" value={value.kicker} onChange={(e) => onChange({ kicker: e.target.value })} placeholder="头 条" />
        </div>
        <div className="field">
          <label>头条标题</label>
          <input type="text" value={value.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>副题</label>
        <input type="text" value={value.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} />
      </div>
      <ParagraphsField value={value.paragraphs} onChange={(v) => onChange({ paragraphs: v })} label="头条正文" />
      <div className="field">
        <label>简讯（每行一条，格式：分类│内容 或 分类|内容）</label>
        <textarea
          rows={5}
          value={value.wire.map((w) => `${w.tag}│${w.text}`).join("\n")}
          onChange={(e) =>
            onChange({
              wire: e.target.value.split("\n").filter(Boolean).map((line) => {
                const [tag, ...rest] = line.split(/[│|]/);
                return { tag: rest.length ? tag.trim() : "", text: (rest.length ? rest.join("│") : tag).trim() };
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
      <div className="field">
        <label>导读</label>
        <input type="text" value={value.intro} onChange={(e) => onChange({ intro: e.target.value })} placeholder="热榜联动速览…" />
      </div>
      <LinesEditor
        items={value.boards}
        onChange={(boards) => onChange({ boards })}
        blank={() => ({ name: "", color: "#7c3aed", source: "", items: [], note: "" })}
        addLabel="加一个榜"
        render={(board, set) => (
          <div style={{ display: "grid", gap: 8, flex: 1 }}>
            <div className="row2">
              <div className="field">
                <label>榜单名</label>
                <input type="text" value={board.name} onChange={(e) => set({ ...board, name: e.target.value })} placeholder="Skills 榜" />
              </div>
              <div className="field">
                <label>数据源</label>
                <input type="text" value={board.source} onChange={(e) => set({ ...board, source: e.target.value })} placeholder="skills.sh 按安装量" />
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>颜色</label>
                <input type="color" value={board.color || "#7c3aed"} onChange={(e) => set({ ...board, color: e.target.value })} style={{ height: 38 }} />
              </div>
              <div className="field">
                <label>观察（可空）</label>
                <input type="text" value={board.note} onChange={(e) => set({ ...board, note: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>榜单条目（每行：名称│数值│描述│链接，链接可空）</label>
              <textarea
                rows={Math.max(4, board.items.length + 1)}
                value={board.items.map((it) => [it.name, it.value, it.desc, it.url].join("│")).join("\n")}
                onChange={(e) =>
                  set({
                    ...board,
                    items: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
                      const [name = "", val = "", desc = "", url = ""] = line.split("│");
                      return { name: name.trim(), value: val.trim(), desc: desc.trim(), url: url.trim() };
                    }),
                  })
                }
                placeholder={"find-skills│2.8M│对话里搜/装社区 Skills│\ngrill-me│750K│像投资人一样拷问你的方案│"}
              />
            </div>
          </div>
        )}
      />
    </>
  );
}

// ============ 03 开源项目 ============

function OssEditor({ value, onChange }: { value: DailyOssBody; onChange: (v: Partial<DailyOssBody>) => void }) {
  return (
    <>
      <div className="row2">
        <div className="field">
          <label>角标（rank）</label>
          <input type="text" value={value.rank} onChange={(e) => onChange({ rank: e.target.value })} placeholder="#1" />
        </div>
        <div className="field">
          <label>Tagline</label>
          <input type="text" value={value.tagline} onChange={(e) => onChange({ tagline: e.target.value })} placeholder="TODAY'S PICK" />
        </div>
      </div>
      <div className="field">
        <label>项目名</label>
        <input type="text" value={value.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="yjh051108/dsh-routing-suite — 让 Agent 自己挑模型" />
      </div>
      <div className="field">
        <label>元信息</label>
        <input type="text" value={value.meta} onChange={(e) => onChange({ meta: e.target.value })} placeholder="PowerShell · 单周 +6.0K star" />
      </div>
      <ParagraphsField value={value.paragraphs} onChange={(v) => onChange({ paragraphs: v })} />
      <div className="field">
        <label>统计标签（每行：标签│值）</label>
        <textarea
          rows={4}
          value={value.stats.map((s) => `${s.label}│${s.value}`).join("\n")}
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
    <>
      <div className="field">
        <label>导读</label>
        <input type="text" value={value.intro} onChange={(e) => onChange({ intro: e.target.value })} />
      </div>
      <div className="field">
        <label>线报列表（每行：标题│描述│标签）</label>
        <textarea
          rows={Math.max(5, value.items.length + 1)}
          value={value.items.map((it) => `${it.title}│${it.desc}│${it.tag}`).join("\n")}
          onChange={(e) =>
            onChange({
              items: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
                const [title = "", desc = "", tag = ""] = line.split("│");
                return { title: title.trim(), desc: desc.trim(), tag: tag.trim() };
              }),
            })
          }
          placeholder={"AI 简历优化服务│用 LLM 批量诊断简历…│AI\nDSH 插件开发│DeepSeek Harness 生态正缺好插件│技术红利"}
        />
      </div>
    </>
  );
}

// ============ 05 软件常识 ============

function KnowEditor({ value, onChange }: { value: DailyKnowBody; onChange: (v: Partial<DailyKnowBody>) => void }) {
  return (
    <>
      <div className="field">
        <label>问题 / 标题</label>
        <input type="text" value={value.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="什么是 VLA 模型？" />
      </div>
      <div className="field">
        <label>副题</label>
        <input type="text" value={value.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} placeholder="视觉-语言-动作模型 · 具身智能的核心路线" />
      </div>
      <ParagraphsField value={value.paragraphs} onChange={(v) => onChange({ paragraphs: v })} />
      <div className="field">
        <label>代码示例（可空）</label>
        <textarea rows={6} value={value.code} onChange={(e) => onChange({ code: e.target.value })} style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
      </div>
      <div className="field">
        <label>一句话总结</label>
        <input type="text" value={value.summary} onChange={(e) => onChange({ summary: e.target.value })} />
      </div>
    </>
  );
}

// ============ 06 人物志 ============

function BioEditor({ value, onChange }: { value: DailyBioBody; onChange: (v: Partial<DailyBioBody>) => void }) {
  return (
    <>
      <ImageField value={value.image} onChange={(url) => onChange({ image: url })} label="人物志配图 URL" />
      <div className="field">
        <label>图片说明</label>
        <input type="text" value={value.imageCaption} onChange={(e) => onChange({ imageCaption: e.target.value })} />
      </div>
      <div className="row2">
        <div className="field">
          <label>回目</label>
          <input type="text" value={value.chapter} onChange={(e) => onChange({ chapter: e.target.value })} placeholder="第壹回 · 技术人物志" />
        </div>
        <div className="field">
          <label>人物标题</label>
          <input type="text" value={value.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="丹尼斯 · 里奇：他造了一座钟" />
        </div>
      </div>
      <div className="field">
        <label>英文元信息</label>
        <input type="text" value={value.enMeta} onChange={(e) => onChange({ enMeta: e.target.value })} placeholder="Dennis Ritchie · 1941–2011 · C 语言与 UNIX 之父" />
      </div>
      <ParagraphsField value={value.paragraphs} onChange={(v) => onChange({ paragraphs: v })} />
      <div className="field">
        <label>金句</label>
        <textarea rows={2} value={value.quote} onChange={(e) => onChange({ quote: e.target.value })} />
      </div>
      <div className="field">
        <label>落款</label>
        <input type="text" value={value.signature} onChange={(e) => onChange({ signature: e.target.value })} placeholder="—— 臻叔 识" />
      </div>
    </>
  );
}

// ============ 07 广告位 ============

function AdsEditor({ value, onChange }: { value: DailyAdsBody; onChange: (v: Partial<DailyAdsBody>) => void }) {
  return (
    <>
      <div className="field">
        <label>广告（每行：类型│标题│描述│联系方式；类型=agent/gh/post/default）</label>
        <textarea
          rows={Math.max(4, value.items.length + 1)}
          value={value.items.map((a) => `${a.type}│${a.title}│${a.desc}│${a.contact}`).join("\n")}
          onChange={(e) =>
            onChange({
              items: e.target.value.split("\n").filter((l) => l.trim()).map((line) => {
                const [type = "default", title = "", desc = "", contact = ""] = line.split("│");
                const t = ["agent", "gh", "post", "default"].includes(type.trim()) ? type.trim() as DailyAdsBody["items"][number]["type"] : "default";
                return { type: t, title: title.trim(), desc: desc.trim(), contact: contact.trim() };
              }),
            })
          }
          placeholder={"agent│Agent 培训班招租│此位可投…│ads@saibo.daily\ngh│awesome-dsh-plugin│DSH 插件精选│github.com/…"}
        />
        <span className="field-hint">不足 10 席前台自动补默认占位。</span>
      </div>
    </>
  );
}
