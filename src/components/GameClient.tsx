"use client";

import { useEffect, useRef } from "react";
import "./game.css";

type Portal = {
  id: string;
  name: string;
  href: string;
  desc: string;
  x: number;
  y: number;
  r: number;
  found: boolean;
  hue: number;
};

export default function GameClient({
  embedded = false,
  onActiveChange,
  onFoundChange,
}: {
  embedded?: boolean;
  onActiveChange?: (id: string | null) => void;
  onFoundChange?: (ids: string[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCb = useRef(onActiveChange);
  const foundCb = useRef(onFoundChange);
  activeCb.current = onActiveChange;
  foundCb.current = onFoundChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    const wall = 28;
    const room = { x: wall, y: wall, w: W - wall * 2, h: H - wall * 2 };

    const obstacles = [
      { x: 90, y: 64, w: 180, h: 64, label: "沙发" },
      { x: 788, y: 82, w: 158, h: 82, label: "书桌" },
      { x: 810, y: 182, w: 101, h: 45, label: "椅" },
      { x: 135, y: 382, w: 225, h: 73, label: "床" },
      { x: 473, y: 273, w: 101, h: 82, label: "茶几" },
      { x: 630, y: 436, w: 203, h: 50, label: "电视柜" },
      { x: 338, y: 109, w: 56, h: 145, label: "书架" },
    ];

    const portals: Portal[] = [
      { id: "home", name: "/home", href: "/home", desc: "3D IP 首页 · 认识臻叔", x: 248, y: 200, r: 22, found: false, hue: 145 },
      { id: "blog", name: "/blog", href: "/blog", desc: "技术博客 · 工程笔记", x: 585, y: 145, r: 22, found: false, hue: 160 },
      { id: "projects", name: "/projects", href: "/projects", desc: "项目展示 · 交付与实验", x: 878, y: 327, r: 22, found: false, hue: 130 },
      { id: "courses", name: "/courses", href: "/courses", desc: "课程售卖 · 体系化短训", x: 405, y: 455, r: 22, found: false, hue: 100 },
      { id: "shop", name: "/shop", href: "/shop", desc: "软件商店 · 模板与源码", x: 720, y: 255, r: 22, found: false, hue: 175 },
    ];

    const bot = {
      x: room.x + room.w * 0.5,
      y: room.y + room.h * 0.66,
      r: 18,
      angle: 0,
      speed: 0,
      maxSpeed: 2.6,
      brush: 0,
    };

    const keys: Record<string, boolean> = { up: false, down: false, left: false, right: false };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now();
    const dust: { x: number; y: number; a: number; s: number }[] = [];
    const trail: { x: number; y: number; life: number }[] = [];
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    let battery = 100;
    let raf = 0;
    let activeId: string | null = null;

    for (let i = 0; i < 90; i++) {
      dust.push({
        x: room.x + 20 + Math.random() * (room.w - 40),
        y: room.y + 20 + Math.random() * (room.h - 40),
        a: 0.15 + Math.random() * 0.35,
        s: 1 + Math.random() * 2,
      });
    }

    function circleRect(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number) {
      const nx = Math.max(rx, Math.min(cx, rx + rw));
      const ny = Math.max(ry, Math.min(cy, ry + rh));
      const dx = cx - nx;
      const dy = cy - ny;
      return dx * dx + dy * dy < cr * cr;
    }

    function blocked(nx: number, ny: number) {
      if (nx - bot.r < room.x || nx + bot.r > room.x + room.w) return true;
      if (ny - bot.r < room.y || ny + bot.r > room.y + room.h) return true;
      for (const o of obstacles) {
        if (circleRect(nx, ny, bot.r - 1, o.x, o.y, o.w, o.h)) return true;
      }
      return false;
    }

    function setKey(dir: string, on: boolean) {
      if (keys[dir] === undefined) return;
      keys[dir] = on;
      const btn = document.querySelector<HTMLElement>('.dpad [data-dir="' + dir + '"]');
      if (btn) btn.classList.toggle("is-on", on);
    }

    const keyMap: Record<string, string> = {
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
    };

    function onKeyDown(e: KeyboardEvent) {
      const d = keyMap[e.key];
      if (!d) return;
      const t = e.target as HTMLElement | null;
      // Don't hijack keys while typing in a form field.
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      // Otherwise the arrows/WASD drive the bot only — never scroll the page.
      e.preventDefault();
      setKey(d, true);
    }
    function onKeyUp(e: KeyboardEvent) {
      const d = keyMap[e.key];
      if (!d) return;
      setKey(d, false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const dpadCleanups: (() => void)[] = [];
    document.querySelectorAll<HTMLElement>(".dpad [data-dir]").forEach((btn) => {
      const dir = btn.getAttribute("data-dir")!;
      const start = (e: Event) => { e.preventDefault(); setKey(dir, true); };
      const end = (e: Event) => { e.preventDefault(); setKey(dir, false); };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", end);
      btn.addEventListener("pointerleave", end);
      btn.addEventListener("pointercancel", end);
      dpadCleanups.push(() => {
        btn.removeEventListener("pointerdown", start);
        btn.removeEventListener("pointerup", end);
        btn.removeEventListener("pointerleave", end);
        btn.removeEventListener("pointercancel", end);
      });
    });

    function renderFoundList() {
      const el = document.getElementById("found-list");
      if (el) {
        el.innerHTML = portals
          .map(
            (p) =>
              '<a class="' + (p.found ? "is-found" : "") + '" href="' + p.href + '">' +
              (p.found ? "✓ " : "· ") + p.name + "</a>"
          )
          .join("");
      }
      const n = portals.filter((p) => p.found).length;
      const sf = document.getElementById("stat-found");
      const st = document.getElementById("stat-total");
      if (sf) sf.textContent = String(n);
      if (st) st.textContent = String(portals.length);
    }

    function showPortal(p: Portal) {
      const toast = document.getElementById("portal-toast");
      const tt = document.getElementById("toast-title");
      const td = document.getElementById("toast-desc");
      const link = document.getElementById("toast-link") as HTMLAnchorElement | null;
      if (tt) tt.textContent = "清扫完成 · " + p.name;
      if (td) td.textContent = p.desc;
      if (link) {
        link.href = p.href;
        link.textContent = "goto " + p.name;
      }
      toast?.classList.add("is-show");
      const live = document.getElementById("sr-live");
      if (live) live.textContent = "发现传送点 " + p.name + "，" + p.desc;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast?.classList.remove("is-show");
      }, 5200);
    }

    function update(dt: number) {
      let vx = 0, vy = 0;
      if (keys.left) vx -= 1;
      if (keys.right) vx += 1;
      if (keys.up) vy -= 1;
      if (keys.down) vy += 1;
      const moving = vx !== 0 || vy !== 0;
      if (moving) {
        const len = Math.hypot(vx, vy) || 1;
        vx /= len; vy /= len;
        bot.angle = Math.atan2(vy, vx);
        bot.speed = Math.min(bot.maxSpeed, bot.speed + dt * 8);
      } else {
        bot.speed = Math.max(0, bot.speed - dt * 10);
      }

      const step = bot.speed * (dt * 60);
      if (step > 0 && moving) {
        const nx = bot.x + vx * step;
        const ny = bot.y + vy * step;
        if (!blocked(nx, bot.y)) bot.x = nx;
        if (!blocked(bot.x, ny)) bot.y = ny;
      }

      bot.brush += dt * (moving ? 14 : 3);
      if (moving) {
        battery = Math.max(12, battery - dt * 1.2);
        trail.push({ x: bot.x, y: bot.y, life: 1 });
        if (trail.length > 40) trail.shift();
      } else {
        battery = Math.min(100, battery + dt * 2);
      }
      for (let t = trail.length - 1; t >= 0; t--) {
        trail[t].life -= dt * 1.4;
        if (trail[t].life <= 0) trail.splice(t, 1);
      }

      for (let d = dust.length - 1; d >= 0; d--) {
        const du = dust[d];
        if (Math.hypot(du.x - bot.x, du.y - bot.y) < bot.r + 10) {
          dust.splice(d, 1);
        }
      }

      portals.forEach((p) => {
        if (p.found) return;
        if (Math.hypot(p.x - bot.x, p.y - bot.y) < p.r + bot.r - 4) {
          p.found = true;
          renderFoundList();
          showPortal(p);
          foundCb.current?.(portals.filter((q) => q.found).map((q) => q.id));
        }
      });

      // Active node: whichever portal the bot is hovering near, for mutual
      // highlight with the left-hand category list.
      let near: string | null = null;
      let nearDist = Infinity;
      portals.forEach((p) => {
        const d2 = Math.hypot(p.x - bot.x, p.y - bot.y);
        if (d2 < p.r + bot.r + 26 && d2 < nearDist) {
          nearDist = d2;
          near = p.id;
        }
      });
      if (near !== activeId) {
        activeId = near;
        activeCb.current?.(activeId);
      }

      const sb = document.getElementById("stat-bat");
      const sm = document.getElementById("stat-mode");
      if (sb) sb.textContent = Math.round(battery) + "%";
      if (sm) sm.textContent = moving ? "clean" : "dock";
    }

    function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function drawFloor() {
      ctx.fillStyle = "#1a261e";
      ctx.fillRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = "rgba(80,255,140,0.04)";
      ctx.lineWidth = 1;
      for (let y = room.y; y < room.y + room.h; y += 28) {
        ctx.beginPath();
        ctx.moveTo(room.x, y);
        ctx.lineTo(room.x + room.w, y);
        ctx.stroke();
      }
      for (let x = room.x; x < room.x + room.w; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, room.y);
        ctx.lineTo(x, room.y + room.h);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(40,90,60,0.25)";
      roundRect(ctx, 428, 227, 225, 127, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(100,255,160,0.12)";
      ctx.stroke();
    }

    function drawWalls() {
      ctx.fillStyle = "#0d1611";
      ctx.fillRect(0, 0, W, H);
      ctx.clearRect(room.x, room.y, room.w, room.h);
      drawFloor();
      ctx.strokeStyle = "rgba(100,255,160,0.28)";
      ctx.lineWidth = 6;
      ctx.strokeRect(room.x - 3, room.y - 3, room.w + 6, room.h + 6);
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 2;
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      ctx.fillStyle = "#0a120e";
      ctx.fillRect(W * 0.5 - 36, room.y + room.h - 4, 72, 14);
      ctx.fillStyle = "rgba(100,255,160,0.15)";
      ctx.fillRect(W * 0.5 - 36, room.y + room.h + 2, 72, 4);
    }

    function drawFurniture() {
      obstacles.forEach((o) => {
        ctx.fillStyle = "rgba(20,36,26,0.95)";
        roundRect(ctx, o.x, o.y, o.w, o.h, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(100,255,160,0.14)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "rgba(100,255,160,0.04)";
        ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, 8);
        ctx.fillStyle = "rgba(160,200,170,0.35)";
        ctx.font = "11px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 4);
      });
    }

    function drawDust() {
      dust.forEach((d) => {
        ctx.fillStyle = "rgba(180,200,170," + d.a + ")";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawPortals(time: number) {
      portals.forEach((p) => {
        const pulse = reduced ? 1 : 0.85 + Math.sin(time * 0.004 + p.x) * 0.15;
        const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r * 2.2 * pulse);
        if (p.found) {
          g.addColorStop(0, "rgba(100,255,160,0.55)");
          g.addColorStop(0.4, "rgba(100,255,160,0.12)");
          g.addColorStop(1, "rgba(100,255,160,0)");
        } else {
          g.addColorStop(0, "hsla(" + p.hue + ",80%,70%," + 0.7 * pulse + ")");
          g.addColorStop(0.35, "hsla(" + p.hue + ",70%,55%,0.25)");
          g.addColorStop(1, "hsla(" + p.hue + ",70%,40%,0)");
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2.1 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Active highlight ring — echoes the left-hand category list.
        if (p.id === activeId) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 1.35, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(140,255,190,0.95)";
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = p.found ? "rgba(100,255,160,0.9)" : "rgba(255,255,240,0.85)";
        ctx.fill();

        ctx.fillStyle = p.found ? "rgba(100,255,160,0.85)" : "rgba(200,230,210,0.7)";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.name, p.x, p.y + p.r + 14);
      });
    }

    function drawTrail() {
      trail.forEach((t) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 10 * t.life, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(80,255,140," + 0.08 * t.life + ")";
        ctx.fill();
      });
    }

    function drawBot() {
      ctx.save();
      ctx.translate(bot.x, bot.y);
      ctx.rotate(bot.angle);

      ctx.beginPath();
      ctx.ellipse(2, 4, bot.r * 1.05, bot.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, bot.r, 0, Math.PI * 2);
      const body = ctx.createRadialGradient(-4, -5, 2, 0, 0, bot.r);
      body.addColorStop(0, "#2a3d32");
      body.addColorStop(1, "#121c16");
      ctx.fillStyle = body;
      ctx.fill();
      ctx.strokeStyle = "rgba(100,255,160,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, bot.r * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(100,255,160,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, bot.r - 1, -0.55, 0.55);
      ctx.strokeStyle = "rgba(100,255,160,0.85)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bot.r * 0.35, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle =
        keys.up || keys.down || keys.left || keys.right
          ? "rgba(100,255,160,0.95)"
          : "rgba(100,255,160,0.35)";
      ctx.fill();

      if (!reduced) {
        ctx.rotate(bot.brush);
        ctx.strokeStyle = "rgba(100,255,160,0.2)";
        ctx.beginPath();
        ctx.moveTo(-bot.r * 0.35, 0);
        ctx.lineTo(bot.r * 0.35, 0);
        ctx.stroke();
      }

      ctx.restore();

      ctx.fillStyle = "rgba(160,200,170,0.55)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText("bot", bot.x, bot.y + bot.r + 14);
    }

    function drawUIChrome() {
      ctx.fillStyle = "rgba(100,255,160,0.35)";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "left";
      ctx.fillText("room_01 · top-down", room.x + 10, room.y + 18);
      ctx.textAlign = "right";
      ctx.fillText("x:" + Math.round(bot.x) + " y:" + Math.round(bot.y), room.x + room.w - 10, room.y + 18);
    }

    function loop(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);

      ctx.clearRect(0, 0, W, H);
      drawWalls();
      drawFurniture();
      drawDust();
      drawTrail();
      drawPortals(now);
      drawBot();
      drawUIChrome();

      raf = requestAnimationFrame(loop);
    }

    renderFoundList();
    raf = requestAnimationFrame(loop);

    const onPointerDown = () => {
      try { canvas.focus(); } catch {}
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.setAttribute("tabindex", "0");
    canvas.style.outline = "none";

    return () => {
      cancelAnimationFrame(raf);
      if (toastTimer) clearTimeout(toastTimer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      dpadCleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className={embedded ? "game-page game-page--embed" : "game-page"} id="game-main">
      {!embedded && (
        <header className="game-hero">
          <div>
            <div className="eyebrow">// game</div>
            <h1>扫地机器人 · 房间漫游</h1>
            <p className="lead">
              在仿真房间里扫光斑。每个光斑是一张站点传送卡——扫过即可跳转首页、博客、项目、课程或商店。
            </p>
          </div>
          <div className="hud-stats" aria-live="polite">
            <span>found <b id="stat-found">0</b>/<b id="stat-total">5</b></span>
            <span>battery <b id="stat-bat">100%</b></span>
            <span>mode <b id="stat-mode">idle</b></span>
          </div>
        </header>
      )}

      <div className="game-stage-wrap">
        {embedded && (
          <div className="hud-stats hud-stats--embed" aria-live="polite">
            <span>found <b id="stat-found">0</b>/<b id="stat-total">5</b></span>
            <span>battery <b id="stat-bat">100%</b></span>
            <span>mode <b id="stat-mode">idle</b></span>
          </div>
        )}
        <div className="stage-frame">
          <canvas
            id="room"
            ref={canvasRef}
            width={1080}
            height={600}
            role="img"
            aria-label="俯视房间：用方向键移动扫地机器人清扫光斑"
          ></canvas>
          <div className="stage-overlay" aria-hidden="true"></div>
          <div className="portal-toast" id="portal-toast" role="dialog" aria-live="polite">
            <strong id="toast-title">发现传送点</strong>
            <span id="toast-desc"></span>
            <div>
              <a id="toast-link" href="/home">前往</a>
            </div>
          </div>

          {/* D-pad overlays the room map itself — semi-transparent, lights up on press. */}
          <div className="dpad" aria-label="虚拟方向键">
            <span className="spacer"></span>
            <button type="button" className="u" data-dir="up" aria-label="上">▲</button>
            <span className="spacer"></span>
            <button type="button" className="l" data-dir="left" aria-label="左">◀</button>
            <button type="button" className="d" data-dir="down" aria-label="下">▼</button>
            <button type="button" className="r" data-dir="right" aria-label="右">▶</button>
          </div>
        </div>

        <p className="game-hint">
          方向键 <kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> / <kbd>WASD</kbd> 或点击地图内方向键，控制扫地机器人上下左右移动
        </p>

        {!embedded && <div className="found-list" id="found-list" aria-label="已发现传送点"></div>}
        <p className="sr-live" id="sr-live" aria-live="polite"></p>
      </div>
    </div>
  );
}
