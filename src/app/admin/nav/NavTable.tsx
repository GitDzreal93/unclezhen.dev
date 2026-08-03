"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NavItem } from "@/lib/data";
import { setNavItemVisibility } from "@/lib/admin";
import { toast } from "@/components/toast";

// Per-key blurb shown in the 简介 column. Mirrors the presentation copy used
// in the home module-card grid and LauncherStage (HINT_KEYS).
// Kept in code because it's "how we describe it", not config.
const HINTS: Record<string, string> = {
  home: "3D IP 首页 · 认识臻叔",
  blog: "工程笔记 · 动效拆解",
  projects: "项目交付与实验",
  shop: "数字商品 · 模板与源码",
  about: "关于本站 / 设计思路",
};

// /home and / (the launcher) can never be hidden — they ARE the site
// landing. Hiding either strands the visitor. The server action enforces
// this too; this list controls only the UI affordance.
const LOCKED_KEYS = new Set(["home", "game"]);

function VisibilityCell({ item }: { item: NavItem }) {
  // Optimistic state: flip locally, then sync. On failure, revert and toast.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const visible = optimistic !== null ? optimistic : item.visible;

  function flip(next: boolean) {
    if (pending || visible === next) return;
    setOptimistic(next);
    const fd = new FormData();
    fd.set("key", item.key);
    fd.set("visible", String(next));
    startTransition(async () => {
      try {
        await setNavItemVisibility(fd);
        router.refresh();
      } catch (err) {
        setOptimistic(null);
        toast(err instanceof Error ? err.message : "切换失败");
      }
    });
  }

  return (
    <div className="seg" role="radiogroup" aria-label={`${item.label} 显隐`}>
      <label>
        <input
          type="radio"
          name={`vis-${item.key}`}
          value="true"
          checked={visible}
          onChange={() => flip(true)}
          disabled={pending}
        />{" "}
        显示
      </label>
      <label>
        <input
          type="radio"
          name={`vis-${item.key}`}
          value="false"
          checked={!visible}
          onChange={() => flip(false)}
          disabled={pending}
        />{" "}
        隐藏
      </label>
    </div>
  );
}

function LockedCell({ item }: { item: NavItem }) {
  return (
    <span
      className="admin-pill admin-pill--ok"
      title={`${item.label} 是固定入口,不可隐藏`}
    >
      始终显示
    </span>
  );
}

export default function NavTable({ items }: { items: NavItem[] }) {
  if (items.length === 0) {
    return (
      <div className="admin-empty">
        <div className="admin-empty__title">还没有导航条目</div>
        <p className="admin-empty__desc">
          请先在终端跑一次 <code>npm run db:setup</code> 创建 <code>nav_items</code> 表。
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col" style={{ width: 56 }}>序号</th>
            <th scope="col" style={{ width: 120 }}>路径</th>
            <th scope="col" style={{ width: 100 }}>显示名</th>
            <th scope="col">简介</th>
            <th scope="col" style={{ width: 160 }}>显隐</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => {
            const isGame = it.key === "game";
            const locked = LOCKED_KEYS.has(it.key);
            return (
              <tr key={it.key}>
                <td className="mono">{String(i + 1).padStart(2, "0")}</td>
                <td className="mono">{it.href}</td>
                <td>{it.label}</td>
                <td style={{ color: "var(--muted)" }}>
                  {HINTS[it.key] ?? "—"}
                  {isGame && (
                    <span
                      className="hint"
                      style={{ display: "block", marginTop: 2 }}
                    >
                      提示：启动器本身即游戏页,该入口始终指向 <code>/</code>
                    </span>
                  )}
                </td>
                <td>
                  {locked ? <LockedCell item={it} /> : <VisibilityCell item={it} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
