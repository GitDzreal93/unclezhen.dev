"use client";

import { useEffect, useMemo, useRef } from "react";
import type { NavItem } from "@/lib/data";
import type { Locale } from "@/lib/i18n/dict";
import { navLabel, t } from "@/lib/i18n/dict";
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

// Canvas-specific layout for the four room portals. "game" intentionally has
// no entry — the game lives on this page, so a self-portal would be
// nonsensical. If you add a new nav_items row, give it a LAYOUT entry or the
// canvas will silently skip it.
const LAYOUT: Record<string, { x: number; y: number; r: number; hue: number; descKey: string }> = {
  home:     { x: 248, y: 200, r: 22, hue: 145, descKey: "game.portal.home" },
  blog:     { x: 585, y: 145, r: 22, hue: 160, descKey: "game.portal.blog" },
  projects: { x: 878, y: 327, r: 22, hue: 130, descKey: "game.portal.projects" },
  shop:     { x: 720, y: 255, r: 22, hue: 175, descKey: "game.portal.shop" },
};

export default function GameClient({
  items,
  embedded = false,
  locale,
  onActiveChange,
  onFoundChange,
}: {
  items: NavItem[];
  embedded?: boolean;
  locale?: Locale;
  onActiveChange?: (id: string | null) => void;
  onFoundChange?: (ids: string[]) => void;
}) {
  const currentLocale = locale ?? "zh";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeCb = useRef(onActiveChange);
  const foundCb = useRef(onFoundChange);
  activeCb.current = onActiveChange;
  foundCb.current = onFoundChange;

  // Project the visible nav rows through the code-owned LAYOUT map. Items
  // with no LAYOUT entry are dropped (e.g. "game"). Memoize on items ref so
  // the effect's [portals] dep doesn't churn on every parent render.
  const portals = useMemo<Portal[]>(() => {
    const out: Portal[] = [];
    for (const it of items) {
      const lay = LAYOUT[it.key];
      if (!lay) continue;
      out.push({
        id: it.key,
        name: navLabel(currentLocale, it.key, it.label),
        href: it.href,
        desc: t(currentLocale, lay.descKey),
        x: lay.x,
        y: lay.y,
        r: lay.r,
        hue: lay.hue,
        found: false,
      });
    }
    return out;
  }, [items, currentLocale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width;
    const H = canvas.height;

    const wall = 28;
    const room = { x: wall, y: wall, w: W - wall * 2, h: H - wall * 2 };

    const obstacles = [
      { x: 90, y: 64, w: 180, h: 64, label: t(currentLocale, "game.furniture.sofa") },
      { x: 788, y: 82, w: 158, h: 82, label: t(currentLocale, "game.furniture.desk") },
      { x: 810, y: 182, w: 101, h: 45, label: t(currentLocale, "game.furniture.chair") },
      { x: 135, y: 382, w: 225, h: 73, label: t(currentLocale, "game.furniture.bed") },
      { x: 473, y: 273, w: 101, h: 82, label: t(currentLocale, "game.furniture.table") },
      { x: 630, y: 436, w: 203, h: 50, label: t(currentLocale, "game.furniture.tv") },
      { x: 338, y: 109, w: 56, h: 145, label: t(currentLocale, "game.furniture.shelf") },
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
    let battery = 100;
    let raf = 0;
    let activeId: string | null = null;
    let activePortal: Portal | null = null;

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
      if (e.key === "Enter" && activePortal) {
        const t = e.target as HTMLElement | null;
        if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
        e.preventDefault();
        window.location.assign(activePortal.href);
        return;
      }
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
      if (tt) tt.textContent = t(currentLocale, "game.portal.title", { name: p.name });
      if (td) td.textContent = p.desc;
      if (link) {
        link.href = p.href;
        link.textContent = t(currentLocale, "game.goto", { name: p.name });
      }
      toast?.classList.add("is-show");
      const live = document.getElementById("sr-live");
      if (live) live.textContent = t(currentLocale, "game.portal.live", { name: p.name });
    }

    function hidePortal() {
      document.getElementById("portal-toast")?.classList.remove("is-show");
    }

    function update(dt: number) {
      let vx = 0, vy = 0;
      if (keys.left) vx -= 1;
      if (keys.right) vx += 1;
      if (keys.up) vy -= 1;
      if (keys.down) vy += 1;
      const moving = vx !== 0 || vy !== 0;

      const mag = moving ? Math.hypot(vx, vy) : 0;
      if (moving) {
        vx = (vx / mag) * bot.maxSpeed;
        vy = (vy / mag) * bot.maxSpeed;
      }
      const nx = bot.x + vx;
      const ny = bot.y + vy;
      if (!blocked(nx, ny)) {
        bot.x = nx;
        bot.y = ny;
      }
      if (moving) {
        bot.angle = Math.atan2(vy, vx);
        bot.brush += dt * 6;
      }
      bot.speed = mag;

      if (moving && Math.random() < 0.6) {
        trail.push({ x: bot.x, y: bot.y, life: 1 });
        if (trail.length > 60) trail.shift();
      }
      for (const t of trail) t.life -= dt * 0.6;
      while (trail.length && trail[0].life <= 0) trail.shift();

      // Brush clears dust.
      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i];
        if (Math.hypot(d.x - bot.x, d.y - bot.y) < bot.r + d.s) {
          dust.splice(i, 1);
        }
      }

      // Battery slowly drains; recharging when idle in the corner.
      battery -= moving ? dt * 1.6 : -dt * 0.6;
      if (battery < 0) battery = 100;
      if (battery > 100) battery = 100;

      let closest: Portal | null = null;
      let closestDist = Infinity;
      for (const p of portals) {
        const dx = p.x - bot.x;
        const dy = p.y - bot.y;
        const dist = Math.hypot(dx, dy);
        if (dist < p.r + bot.r) {
          if (!p.found) {
            p.found = true;
            foundCb.current?.(portals.filter((x) => x.found).map((x) => x.id));
            renderFoundList();
          }
        }
        if (dist < closestDist) {
          closestDist = dist;
          closest = p;
        }
      }
      const newActive = closest && closestDist < 80 ? closest : null;
      if (newActive?.id !== activeId) {
        activeId = newActive?.id ?? null;
        activePortal = newActive;
        activeCb.current?.(activeId);
        if (activePortal) {
          showPortal(activePortal);
        } else {
          hidePortal();
        }
      }
    }

    function drawWalls() {
      ctx.strokeStyle = "rgba(100,255,160,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      ctx.fillStyle = "rgba(100,255,160,0.04)";
      ctx.fillRect(room.x, room.y, room.w, room.h);
    }

    function drawFurniture() {
      ctx.fillStyle = "rgba(140,180,150,0.10)";
      ctx.strokeStyle = "rgba(140,180,150,0.45)";
      ctx.lineWidth = 1;
      for (const o of obstacles) {
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "rgba(180,220,190,0.55)";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.textAlign = "center";
        ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 3);
        ctx.fillStyle = "rgba(140,180,150,0.10)";
      }
    }

    function drawDust() {
      for (const d of dust) {
        ctx.fillStyle = "rgba(220,230,210," + d.a * 0.6 + ")";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2);
        ctx.fill();
      }
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
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      dpadCleanups.forEach((fn) => fn());
    };
    // Re-run on portal set change so the canvas picks up the new portal
    // positions. Trade-off: in-progress game state (found portals, bot
    // position, dust) is reset. Acceptable for the admin-only toggle flow.
  }, [portals]);

  return (
    <div className={embedded ? "game-page game-page--embed" : "game-page"} id="game-main">
      {!embedded && (
        <header className="game-hero">
          <div>
            <div className="eyebrow">// game</div>
            <h1>{t(currentLocale, "game.heading")}</h1>
            <p className="lead">
              {t(currentLocale, "game.lead")}
            </p>
          </div>
          <div className="hud-stats" aria-live="polite">
            <span>{t(currentLocale, "game.found")} <b id="stat-found">0</b>/<b id="stat-total">{portals.length}</b></span>
            <span>{t(currentLocale, "game.battery")} <b id="stat-bat">100%</b></span>
            <span>{t(currentLocale, "game.mode")} <b id="stat-mode">{t(currentLocale, "game.idle")}</b></span>
          </div>
        </header>
      )}

      <div className="game-stage-wrap">
        {embedded && (
          <div className="hud-stats hud-stats--embed" aria-live="polite">
            <span>{t(currentLocale, "game.found")} <b id="stat-found">0</b>/<b id="stat-total">{portals.length}</b></span>
            <span>{t(currentLocale, "game.battery")} <b id="stat-bat">100%</b></span>
            <span>{t(currentLocale, "game.mode")} <b id="stat-mode">{t(currentLocale, "game.idle")}</b></span>
          </div>
        )}
        <div className="stage-frame">
          <canvas
            id="room"
            ref={canvasRef}
            width={1080}
            height={600}
            role="img"
            aria-label={t(currentLocale, "game.aria")}
          ></canvas>
          <div className="stage-overlay" aria-hidden="true"></div>
          <div className="portal-toast" id="portal-toast" role="dialog" aria-live="polite">
            <strong id="toast-title">{t(currentLocale, "game.portal.title", { name: "" })}</strong>
            <span id="toast-desc"></span>
            <div>
              <a id="toast-link" href="/home">{t(currentLocale, "game.goto", { name: "" })}</a>
            </div>
            <span className="portal-toast__hint"><kbd>Enter</kbd> {t(currentLocale, "game.portal.enter")}</span>
          </div>

          {/* D-pad overlays the room map itself — semi-transparent, lights up on press. */}
          <div className="dpad" aria-label={t(currentLocale, "game.heading")}>
            <span className="spacer"></span>
            <button type="button" className="u" data-dir="up" aria-label="Up">▲</button>
            <span className="spacer"></span>
            <button type="button" className="l" data-dir="left" aria-label="Left">◀</button>
            <button type="button" className="d" data-dir="down" aria-label="Down">▼</button>
            <button type="button" className="r" data-dir="right" aria-label="Right">▶</button>
          </div>
        </div>

        <p className="game-hint">
          {t(currentLocale, "game.hint")}
        </p>

        {!embedded && <div className="found-list" id="found-list" aria-label={t(currentLocale, "game.found")}></div>}
        <p className="sr-live" id="sr-live" aria-live="polite"></p>
      </div>
    </div>
  );
}
