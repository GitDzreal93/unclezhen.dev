import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import HomeScene from "@/components/HomeScene";
import ContactCta from "@/components/ContactCta";
import "./home.css";

export const metadata: Metadata = {
  title: "臻叔 · hacker / builder",
  description: "把 WebGL / 工程交付 / 内容商业化塞进同一个 monorepo。",
};

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function HomePage() {
  return (
    <div className="home-page">
      <a className="skip" href="#main">跳到主要内容</a>

      <HomeScene />

      <div className="hud-bar">
        <div className="hud-chip">scroll <b id="hud-scroll">0%</b></div>
        <div className="hud-chip">fps <b id="hud-fps">—</b></div>
        <div className="hud-chip">scene <b id="hud-scene">boot</b></div>
      </div>

      <SiteNav active="home" />

      <main id="main">
        <div className="scroll-track" id="scroll-track">
          <div className="scroll-sticky">
            <div className="panel-stack">
              <div className="hero-panel" id="panel-0">
                <div className="term-window">
                  <div className="term-chrome">
                    <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span>zhen@lab — zsh — 80×24</span>
                  </div>
                  <div className="term-body">
                    <div className="path-line"><span className="g">~/lab</span> <span className="g">❯</span> whoami</div>
                    <h1>我是 <span className="hl">臻叔</span><br />hacker · builder · teacher</h1>
                    <p className="lead">把 WebGL / 工程交付 / 内容商业化塞进同一个 monorepo。向下滚动——场景会跟你一起转。</p>
                    <div className="hero-actions">
                      <Link className="btn btn--primary" href="/projects">ls ./projects</Link>
                      <a className="btn btn--ghost" href="#about">cat ./about</a>
                    </div>
                    <div className="stat-row">
                      <div className="stat">
                        <div className="stat__n">10+</div>
                        <div className="stat__l">yrs eng</div>
                      </div>
                      <div className="stat">
                        <div className="stat__n">—</div>
                        <div className="stat__l">posts · todo</div>
                      </div>
                      <div className="stat">
                        <div className="stat__n">—</div>
                        <div className="stat__l">courses · todo</div>
                      </div>
                    </div>
                    <div className="scroll-hint">
                      <span>scroll to orbit</span>
                      <span className="bar"><i id="scroll-bar"></i></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-panel is-dim" id="panel-1">
                <div className="term-window">
                  <div className="term-chrome">
                    <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span>runtime · scene_01</span>
                  </div>
                  <div className="term-body">
                    <div className="path-line"><span className="g">~/lab</span> <span className="g">❯</span> ./render --ip --webgl --scroll</div>
                    <h1>IP 进场 · 轨道网络</h1>
                    <p className="lead">手绘 IP 做顶点波动；星野粒子、轨道节点连线、悬浮终端面板与网格地面随滚动推进。拖拽可覆盖旋转。</p>
                    <div className="hero-actions">
                      <Link className="btn btn--ghost" href="/blog">read ./blog</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-panel is-dim" id="panel-2">
                <div className="term-window">
                  <div className="term-chrome">
                    <span className="term-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                    <span>runtime · scene_02</span>
                  </div>
                  <div className="term-body">
                    <div className="path-line"><span className="g">~/lab</span> <span className="g">❯</span> open modules/</div>
                    <h1>四条业务线 · 同一套系统</h1>
                    <p className="lead">blog · projects · courses · shop —— 继续向下进入内容区，或直接 jump。</p>
                    <div className="hero-actions">
                      <a className="btn btn--primary" href="#modules">cd ./modules</a>
                      <Link className="btn btn--ghost" href="/shop">cd ./shop</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rest">
          <section className="section about" id="about">
            <div className="wrap about__grid">
              <div>
                <div className="eyebrow">// about</div>
                <h2>$ cat README.md</h2>
              </div>
              <div className="about__text">
                <p>我是臻叔。白天把复杂系统拆成可上线产物，晚上把坑写成教程。界面要有手感——像终端里敲对命令的那一下反馈。</p>
                <p>这个站是作品集 + 知识库 + 店铺：博客沉淀方法，项目展示交付，课程帮你少走弯路，商店放可买的软件与模板。</p>
                <div className="code-block">
                  <div><span className="k">const</span> zhen = &#123;</div>
                  <div>  role: <span className="s">&quot;creative engineer&quot;</span>,</div>
                  <div>  stack: [<span className="s">&quot;TS&quot;</span>, <span className="s">&quot;React&quot;</span>, <span className="s">&quot;WebGL&quot;</span>],</div>
                  <div>  ships: [<span className="s">&quot;product&quot;</span>, <span className="s">&quot;course&quot;</span>, <span className="s">&quot;tool&quot;</span>],</div>
                  <div>&#125;;</div>
                </div>
                <ul className="skill-list" style={{ marginTop: 20 }}>
                  <li>
                    <span>frontend</span>
                    <span className="bar-track"><i style={{ width: "92%" }}></i></span>
                    <span className="lvl">react/ts</span>
                  </li>
                  <li>
                    <span>motion/gl</span>
                    <span className="bar-track"><i style={{ width: "78%" }}></i></span>
                    <span className="lvl">three/css</span>
                  </li>
                  <li>
                    <span>ship 0→1</span>
                    <span className="bar-track"><i style={{ width: "86%" }}></i></span>
                    <span className="lvl">product</span>
                  </li>
                  <li>
                    <span>teach</span>
                    <span className="bar-track"><i style={{ width: "80%" }}></i></span>
                    <span className="lvl">course</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="section modules" id="modules">
            <div className="wrap">
              <div className="section-head">
                <div>
                  <div className="eyebrow">// modules</div>
                  <h2>$ ls -la ~/site</h2>
                </div>
                <p className="muted" style={{ maxWidth: "28ch", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                  四个入口 · 学习 / 合作 / 购买
                </p>
              </div>
              <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
                <Link className="card" href="/blog">
                  <div className="module-card">
                    <div className="module-card__icon">01</div>
                    <h3>/blog</h3>
                    <p>工程实践、动效拆解、架构笔记。可检索、可按标签过滤。</p>
                    <span className="link">open <ArrowIcon /></span>
                  </div>
                </Link>
                <Link className="card" href="/projects">
                  <div className="module-card">
                    <div className="module-card__icon">02</div>
                    <h3>/projects</h3>
                    <p>真实交付与实验场。问题 · 方案 · 技术栈 · 结果。</p>
                    <span className="link">open <ArrowIcon /></span>
                  </div>
                </Link>
                <Link className="card" href="/courses">
                  <div className="module-card">
                    <div className="module-card__icon">03</div>
                    <h3>/courses</h3>
                    <p>体系化课程与短训。大纲清晰，适合想快速上手的开发者。</p>
                    <span className="link">open <ArrowIcon /></span>
                  </div>
                </Link>
                <Link className="card" href="/shop">
                  <div className="module-card">
                    <div className="module-card__icon">04</div>
                    <h3>/shop</h3>
                    <p>工具、模板与源码包。购物车与演示结算已接好。</p>
                    <span className="link">open <ArrowIcon /></span>
                  </div>
                </Link>
                <Link className="card" href="/game">
                  <div className="module-card">
                    <div className="module-card__icon">05</div>
                    <h3>/game</h3>
                    <p>扫地机器人房间漫游。扫光斑解锁站点传送卡。</p>
                    <span className="link">play <ArrowIcon /></span>
                  </div>
                </Link>
              </div>
            </div>
          </section>

          <div className="cta-band">
            <div>
              <div className="eyebrow">// contact</div>
              <h2>ssh collab@zhen</h2>
              <p>内训 · 原型 · 动效落地 · 顾问。留言后通常 48h 内回复（原型不真实发送）。</p>
            </div>
            <ContactCta />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
