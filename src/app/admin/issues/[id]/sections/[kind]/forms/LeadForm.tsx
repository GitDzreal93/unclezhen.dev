"use client";

import { useState } from "react";
import type { LeadBody } from "@/lib/issues-types";

export default function LeadForm({ initial }: { initial: LeadBody }) {
  const [body, setBody] = useState<LeadBody>(initial);

  function update<K extends keyof LeadBody>(key: K, value: LeadBody[K]) {
    setBody((b) => ({ ...b, [key]: value }));
  }

  return (
    <div className="section-form">
      <h3 style={{ marginBottom: 12, fontSize: 14 }}>头条</h3>

      <div className="row2">
        <div className="field">
          <label>栏目标签</label>
          <input
            type="text"
            value={body.kicker || ""}
            onChange={(e) => update("kicker", e.target.value)}
            placeholder="头 条"
          />
        </div>
        <div className="field">
          <label>封面图 URL</label>
          <input
            type="text"
            value={body.image || ""}
            onChange={(e) => update("image", e.target.value)}
            placeholder="/assets/weekly/lead.png"
          />
        </div>
      </div>

      <div className="field">
        <label>封面图说明</label>
        <input
          type="text"
          value={body.imageCaption || ""}
          onChange={(e) => update("imageCaption", e.target.value)}
          placeholder="本报特约画师 臻叔 制图"
        />
      </div>

      <div className="field">
        <label>主标题（用 \n 换行）</label>
        <input
          type="text"
          value={body.title || ""}
          onChange={(e) => update("title", e.target.value)}
          placeholder="大模型再破天际\n万亿参数落地寻常百姓家"
        />
      </div>

      <div className="field">
        <label>副标题</label>
        <input
          type="text"
          value={body.subtitle || ""}
          onChange={(e) => update("subtitle", e.target.value)}
          placeholder="—— 据本报驻硅谷特约员电：…"
        />
      </div>

      <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 14 }}>正文段落（首段自动加 drop cap）</h3>
      {(body.paragraphs || []).map((p, i) => (
        <div className="field" key={i}>
          <label>第 {i + 1} 段</label>
          <textarea
            value={p}
            onChange={(e) => {
              const next = [...(body.paragraphs || [])];
              next[i] = e.target.value;
              update("paragraphs", next);
            }}
            rows={3}
          />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => update("paragraphs", [...(body.paragraphs || []), ""])}
        >
          + 增加段落
        </button>
        {(body.paragraphs || []).length > 1 && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              update("paragraphs", (body.paragraphs || []).slice(0, -1))
            }
          >
            - 删除末段
          </button>
        )}
      </div>

      <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 14 }}>本期导读</h3>
      {(body.toc || []).map((t, i) => (
        <div className="row2" key={i}>
          <div className="field">
            <label>标签 {i + 1}</label>
            <input
              type="text"
              value={t.label}
              onChange={(e) => {
                const next = [...(body.toc || [])];
                next[i] = { ...next[i], label: e.target.value };
                update("toc", next);
              }}
              placeholder="要闻"
            />
          </div>
          <div className="field">
            <label>文字 {i + 1}</label>
            <input
              type="text"
              value={t.text}
              onChange={(e) => {
                const next = [...(body.toc || [])];
                next[i] = { ...next[i], text: e.target.value };
                update("toc", next);
              }}
              placeholder="万亿参数模型落地，消费级显卡即可推理"
            />
          </div>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => update("toc", [...(body.toc || []), { label: "", text: "" }])}
        >
          + 增加条目
        </button>
        {(body.toc || []).length > 0 && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => update("toc", (body.toc || []).slice(0, -1))}
          >
            - 删除末项
          </button>
        )}
      </div>

      <input type="hidden" name="body" value={JSON.stringify(body)} />
    </div>
  );
}
