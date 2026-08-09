"use client";

import { useState } from "react";
import type { ColophonBody } from "@/lib/issues-types";

export default function ColophonForm({ initial }: { initial: ColophonBody }) {
  const [body, setBody] = useState<ColophonBody>(initial);

  function update<K extends keyof ColophonBody>(key: K, value: ColophonBody[K]) {
    setBody((b) => ({ ...b, [key]: value }));
  }

  return (
    <div className="section-form">
      <h3 style={{ marginBottom: 12, fontSize: 14 }}>刊记</h3>

      <div className="row2">
        <div className="field">
          <label>主笔</label>
          <input
            type="text"
            value={body.editor || ""}
            onChange={(e) => update("editor", e.target.value)}
            placeholder="臻叔"
          />
        </div>
        <div className="field">
          <label>联系方式</label>
          <input
            type="text"
            value={body.contact || ""}
            onChange={(e) => update("contact", e.target.value)}
            placeholder="ads@saibo.weekly"
          />
        </div>
      </div>

      <div className="field">
        <label>底部署名行</label>
        <input
          type="text"
          value={body.footer || ""}
          onChange={(e) => update("footer", e.target.value)}
          placeholder="赛博晚报社 印行 · 2026年8月8日 · 第 1 期"
        />
      </div>

      <input type="hidden" name="body" value={JSON.stringify(body)} />
    </div>
  );
}
