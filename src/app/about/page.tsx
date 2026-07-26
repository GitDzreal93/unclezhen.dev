import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "./brand-icons";
import Toolbox from "./Toolbox";
import "./about.css";

export const metadata: Metadata = {
  title: "about · 臻叔",
  description: "臻叔 / zhen_shu — hacker / builder。自我介绍、GitHub 提交热力图、技术栈与联系方式。",
};

/* ────────────────────────────────────────────────────────────────────
 * 👇 在这里编辑你的真实信息（社交链接目前是占位）
 * ──────────────────────────────────────────────────────────────────── */
const GH = "GitDzreal93";

const PROFILE = {
  handle: "zhen_shu",
  name: "臻叔",
  role: "hacker / builder",
  location: "China",
  bio: [
    "写代码、做产品、玩硬件与 3D。喜欢把想法快速变成能跑起来的东西——从一行 CLI 到一个会动的 IP 形象。",
    "白天搞工程与交付，晚上折腾渲染、机器人、小游戏。这个站点本身就是一个实验场：Next.js + PostgreSQL + Three.js，手搓到底。",
  ],
  neofetch: [
    ["role", "hacker / builder"],
    ["os", "macOS · zsh"],
    ["editor", "neovim / vscode"],
    ["lang", "TS · Go · Rust"],
    ["focus", "AI · 3D · 硬件"],
    ["site", "unclezhen.dev"],
  ] as [string, string][],
};

// email has no brand logo — a filled envelope (Heroicons) in a mail-blue.
const MAIL = {
  name: "email",
  hex: "3B82F6",
  path: "M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67ZM22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z",
};

const TOOLS = [
  BRAND.python, BRAND.go, BRAND.typescript, BRAND.flutter, BRAND.java,
  BRAND.linux, BRAND.git, BRAND.javascript, BRAND.shell, BRAND.react,
  BRAND.tailwind, BRAND.antdesign, BRAND.elementui, BRAND.vue, BRAND.nextjs,
  BRAND.claudecode, BRAND.vscode, BRAND.codex, BRAND.node, BRAND.workbuddy,
  BRAND.jira, BRAND.jenkins, BRAND.kubernetes, BRAND.docker, BRAND.springboot,
  BRAND.mysql, BRAND.selectdb, BRAND.postgres, BRAND.kafka, BRAND.rocketmq,
  BRAND.elasticsearch, BRAND.rabbitmq, BRAND.android, BRAND.ios, BRAND.swift,
];

const SOCIALS = [
  { key: "mail", label: "email", href: "mailto:zhen@example.com", ...MAIL },
  { key: "github", label: "GitHub", href: `https://github.com/${GH}`, ...BRAND.github },
  { key: "bili", label: "Bilibili", href: "https://space.bilibili.com/", ...BRAND.bilibili },
  { key: "xhs", label: "小红书", href: "https://www.xiaohongshu.com/", ...BRAND.xiaohongshu },
  { key: "wechat", label: "公众号", href: "#wechat", ...BRAND.wechat },
];

const STATS_URL =
  `https://github-readme-stats.vercel.app/api?username=${GH}` +
  `&show_icons=true&include_all_commits=true&count_private=true&hide_border=true` +
  `&bg_color=00000000&title_color=64ffa0&text_color=cfe6da&icon_color=64ffa0`;

const ASCII = [
  "   ╔═══════════╗   ",
  "   ║  > zhen   ║   ",
  "   ║   _shu    ║   ",
  "   ╠═══════════╣   ",
  "   ║  ◉  >_  ◉ ║   ",
  "   ╚═══════════╝   ",
  "     ║║   ║║       ",
].join("\n");

/* ghchart.rshah.org renders a light-theme SVG (empty cells #eeeeee).
   Server-side we re-map its palette to the site's dark theme so the heatmap
   reads as native on the dark card instead of a pasted white image. */
const HEATMAP_RECOLOR: Record<string, string> = {
  "#eeeeee": "#1b2a22", // empty / no contribution
  "#c6e48b": "#1f4731", // level 1
  "#7bc96f": "#2c7a42", // level 2
  "#239a3b": "#46b85c", // level 3
  "#196127": "#64ffa0", // level 4 — brightest, matches --accent green
  "#767676": "#5f7065", // month / day labels
};

async function getHeatmap(gh: string): Promise<string> {
  const url = `https://ghchart.rshah.org/${gh}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    let svg = await res.text();
    for (const [from, to] of Object.entries(HEATMAP_RECOLOR)) {
      svg = svg.split(from).join(to);
    }
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  } catch {
    return url;
  }
}
/* ──────────────────────────────────────────────────────────────────── */

export default async function AboutPage() {
  const heatmapSrc = await getHeatmap(GH);
  return (
    <>
      <a className="skip" href="#main">跳到主要内容</a>
      <SiteNav active="about" />
      <main id="main">
        <div className="wrap">
          {/* — hero: whoami + social pills — */}
          <section className="page-hero about-hero">
            <div className="about-hero__main">
              <div className="eyebrow">// about</div>
              <h1>whoami</h1>
              <p className="lead">
                一个 hacker / builder 的自我介绍页：终端、GitHub 提交热力图、技术栈，还有怎么找到我。
              </p>
            </div>
            <ul className="socials-top" aria-label="社交链接">
              {SOCIALS.map((s) => {
                const external = s.href.startsWith("http");
                return (
                  <li key={s.key}>
                    <a
                      className="social-pill"
                      style={{ ["--brand" as string]: `#${s.hex}` } as React.CSSProperties}
                      href={s.href}
                      title={s.label}
                      aria-label={s.label}
                      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d={s.path} fill={`#${s.hex}`} />
                      </svg>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* — terminal bio — */}
          <section className="about-sec">
            <div className="about-term">
              <div className="term-chrome">
                <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
                <span className="term-title">zhen@lab: ~/about</span>
                <span className="term-tag mono">— bash</span>
              </div>
              <div className="term-body mono">
                <p className="term-line"><span className="prompt">$</span> whoami</p>
                <p className="term-out term-out--hl">
                  {PROFILE.handle} <span className="dim">·</span> {PROFILE.role} <span className="dim">·</span> {PROFILE.location}
                </p>
                <p className="term-line"><span className="prompt">$</span> cat about.md</p>
                <div className="term-out">
                  {PROFILE.bio.map((p, i) => (
                    <p key={i} className="bio-p">{p}</p>
                  ))}
                </div>
                <p className="term-line"><span className="prompt">$</span> <span className="cursor" aria-hidden="true" /></p>
              </div>
            </div>
          </section>

          {/* — github activity + neofetch — */}
          <section className="about-sec about-grid">
            <div className="card gh-card">
              <div className="card__head"><span className="eyebrow">// github activity</span></div>
              <img className="heatmap" src={heatmapSrc} alt="GitHub 每日提交热力图" />
              <img className="gh-stats" src={STATS_URL} alt="GitHub 统计" loading="lazy" />
              <Link className="gh-link mono" href={`https://github.com/${GH}`}>
                github.com/{GH} ↗
              </Link>
            </div>

            <div className="card neofetch-card">
              <div className="card__head"><span className="eyebrow">$ neofetch</span></div>
              <div className="neofetch">
                <pre className="neofetch__art" aria-hidden="true">{ASCII}</pre>
                <dl className="neofetch__stats mono">
                  {PROFILE.neofetch.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          {/* — toolbox: logo chips (my version) — */}
          <section className="about-sec about-sec--last">
            <div className="eyebrow">// toolbox</div>
            <h2 className="h2">stack · {TOOLS.length} tools</h2>
            <p className="lead" style={{ marginTop: 6 }}>
              这些图标就是物理体——移鼠标推开它们，点击让它们炸开。
            </p>
            <Toolbox tools={TOOLS} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
