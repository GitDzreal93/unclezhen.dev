"use client";

import { useState } from "react";
import Link from "next/link";
import GameClient from "@/components/GameClient";

type LinkItem = { href: string; idx: string; name: string; hint: string; key: string };

const LINKS: LinkItem[] = [
  { href: "/home", idx: "01", name: "/home", hint: "3D IP", key: "home" },
  { href: "/blog", idx: "02", name: "/blog", hint: "技术博客", key: "blog" },
  { href: "/projects", idx: "03", name: "/projects", hint: "项目展示", key: "projects" },
  { href: "/courses", idx: "04", name: "/courses", hint: "课程售卖", key: "courses" },
  { href: "/shop", idx: "05", name: "/shop", hint: "软件商店", key: "shop" },
];

export default function LauncherStage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [foundIds, setFoundIds] = useState<string[]>([]);

  return (
    <div className="launch-split">
      <div className="launch-shell">
        <div className="launch-chrome">
          <div className="launch-chrome__left">
            <span className="launch-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span>zhen@lab — index</span>
          </div>
          <span className="launch-status">online</span>
        </div>

        <div className="launch-body">
          <div className="launch-brand">
            <span className="brand__mark" aria-hidden="true">&gt;</span>
            <div>
              <strong className="mono" style={{ fontSize: 14, letterSpacing: "0.02em" }}>
                zhen_shu
              </strong>
              <p>hacker / builder · prototype</p>
            </div>
          </div>

          <div>
            <div className="eyebrow">site map</div>
            <h1>臻叔个人站</h1>
          </div>

          <p className="lead">
            选择模块进入。首页含滚动驱动 3D IP；博客 / 项目 / 课程 / 商店均为可交互原型，右侧开扫地机走到节点即高亮对应分类。
          </p>

          <div className="launch-actions">
            <Link className="btn btn--primary" href="/home">进入首页</Link>
            <Link className="btn btn--ghost" href="/projects">看项目</Link>
          </div>

          <ul className="launch-links" aria-label="站点页面">
            {LINKS.map((l) => {
              const cls = [
                activeId === l.key ? "is-active" : "",
                foundIds.includes(l.key) ? "is-found" : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={l.href}>
                  <Link href={l.href} className={cls || undefined}>
                    <span className="idx">{l.idx}</span>
                    <span className="name">{l.name}</span>
                    <span className="hint">{l.hint}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="launch-foot">
            <span>5 routes · exit 0</span>
            <span className="hint-keys">Tab 聚焦 · <kbd>Enter</kbd> 进入</span>
          </div>
        </div>
      </div>

      <aside className="launch-game" aria-label="扫地机小游戏">
        <div className="launch-chrome">
          <div className="launch-chrome__left">
            <span className="launch-dots" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
            <span>zhen@lab — game</span>
          </div>
          <span className="launch-status">playable</span>
        </div>
        <div className="launch-game__body">
          <GameClient embedded onActiveChange={setActiveId} onFoundChange={setFoundIds} />
        </div>
      </aside>
    </div>
  );
}
