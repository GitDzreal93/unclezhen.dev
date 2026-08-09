"use client";

import { useState } from "react";
import type { MastheadBody } from "@/lib/issues-types";

// Form for the masthead section. Renders 6+1+1 fields and serializes the
// whole body as a hidden JSON input named `body` that the parent <form>
// posts to saveIssueSection.

export default function MastheadForm({ initial }: { initial: MastheadBody }) {
  const [body, setBody] = useState<MastheadBody>(initial);

  function update<K extends keyof MastheadBody>(key: K, value: MastheadBody[K]) {
    setBody((b) => ({ ...b, [key]: value }));
  }
  function updateNested<P extends "left" | "right" | "dateline">(
    parent: P,
    key: keyof MastheadBody[P],
    value: MastheadBody[P][keyof MastheadBody[P]]
  ) {
    setBody((b) => ({ ...b, [parent]: { ...(b[parent] as object), [key]: value } }));
  }

  return (
    <div className="section-form">
      <h3 style={{ marginBottom: 12, fontSize: 14 }}>报头</h3>

      <div className="row2">
        <div className="field">
          <label>主标题</label>
          <input
            type="text"
            value={body.title || ""}
            onChange={(e) => update("title", e.target.value)}
            placeholder="赛博晚报"
          />
        </div>
        <div className="field">
          <label>副标题（带间距）</label>
          <input
            type="text"
            value={body.strap || ""}
            onChange={(e) => update("strap", e.target.value)}
            placeholder="技 术 周 刊"
          />
        </div>
      </div>

      <div className="row3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>左侧 · 期号</label>
          <input
            type="text"
            value={body.left?.issueLabel || ""}
            onChange={(e) => updateNested("left", "issueLabel", e.target.value)}
            placeholder="第 1 期"
          />
        </div>
        <div className="field">
          <label>左侧 · 社址</label>
          <input
            type="text"
            value={body.left?.address || ""}
            onChange={(e) => updateNested("left", "address", e.target.value)}
            placeholder="中关村"
          />
        </div>
        <div className="field">
          <label>左侧 · 天气</label>
          <input
            type="text"
            value={body.left?.weather || ""}
            onChange={(e) => updateNested("left", "weather", e.target.value)}
            placeholder="晴 · 西南风 3 级"
          />
        </div>
      </div>

      <div className="row3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>右侧 · 定价</label>
          <input
            type="text"
            value={body.right?.price || ""}
            onChange={(e) => updateNested("right", "price", e.target.value)}
            placeholder="铜钱 3 文"
          />
        </div>
        <div className="field">
          <label>右侧 · 发刊</label>
          <input
            type="text"
            value={body.right?.cadence || ""}
            onChange={(e) => updateNested("right", "cadence", e.target.value)}
            placeholder="每周五发刊"
          />
        </div>
        <div className="field">
          <label>右侧 · 广告</label>
          <input
            type="text"
            value={body.right?.ads || ""}
            onChange={(e) => updateNested("right", "ads", e.target.value)}
            placeholder="广告洽：见刊底"
          />
        </div>
      </div>

      <h3 style={{ marginTop: 20, marginBottom: 12, fontSize: 14 }}>日期条</h3>
      <div className="row3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>日期</label>
          <input
            type="text"
            value={body.dateline?.date || ""}
            onChange={(e) => updateNested("dateline", "date", e.target.value)}
            placeholder="2026年8月8日"
          />
        </div>
        <div className="field">
          <label>星期</label>
          <input
            type="text"
            value={body.dateline?.weekday || ""}
            onChange={(e) => updateNested("dateline", "weekday", e.target.value)}
            placeholder="星期五"
          />
        </div>
        <div className="field">
          <label>农历</label>
          <input
            type="text"
            value={body.dateline?.lunar || ""}
            onChange={(e) => updateNested("dateline", "lunar", e.target.value)}
            placeholder="农历丙午年六月廿五"
          />
        </div>
      </div>

      <input type="hidden" name="body" value={JSON.stringify(body)} />
    </div>
  );
}
