import type { Metadata } from "next";
import Link from "next/link";
import "./launcher.css";

export const metadata: Metadata = {
  title: "臻叔 · 站点导航",
  description: "臻叔个人站导航：首页 3D IP、博客、项目、课程与商店。",
};

const LINKS = [
  { href: "/home", idx: "01", name: "/home", hint: "3D IP" },
  { href: "/blog", idx: "02", name: "/blog", hint: "技术博客" },
  { href: "/projects", idx: "03", name: "/projects", hint: "项目展示" },
  { href: "/courses", idx: "04", name: "/courses", hint: "课程售卖" },
  { href: "/shop", idx: "05", name: "/shop", hint: "软件商店" },
  { href: "/game", idx: "06", name: "/game", hint: "扫地机漫游" },
];

export default function LauncherPage() {
  return (
    <>
      <a className="skip" href="#launcher">跳到导航</a>
      <main className="launch" id="launcher">
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
              选择模块进入。首页含滚动驱动 3D IP；博客 / 项目 / 课程 / 商店 / 扫地机小游戏均为可交互原型。
            </p>

            <div className="launch-actions">
              <Link className="btn btn--primary" href="/home">进入首页</Link>
              <Link className="btn btn--ghost" href="/game">玩小游戏</Link>
            </div>

            <ul className="launch-links" aria-label="站点页面">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>
                    <span className="idx">{l.idx}</span>
                    <span className="name">{l.name}</span>
                    <span className="hint">{l.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="launch-foot">
              <span>6 routes · exit 0</span>
              <span className="hint-keys">Tab 聚焦 · <kbd>Enter</kbd> 进入</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
