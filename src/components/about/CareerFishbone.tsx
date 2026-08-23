"use client";

// Career timeline as a fishbone diagram. 6 jobs from 2016 to now, each on
// the main horizontal spine, with diagonal bones branching up/down
// carrying the company name, era and a one-line tagline. ScrollTrigger
// draws the spine and pops each node in order.

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, ScrollTrigger, EASE } from "@/lib/gsap";
import { t, type Locale } from "@/lib/i18n/dict";

type Bone = {
  year: string;
  company: string;
  tagline: string;
  highlight?: boolean;
  side: "up" | "down";
};

const BONES: Bone[] = [
  { year: "2016-17", company: "博汇科技",     tagline: "b1", side: "down" },
  { year: "2017-18", company: "作业帮",       tagline: "b2", side: "down" },
  { year: "2018-19", company: "贝壳找房",     tagline: "b3", side: "down", highlight: true },
  { year: "2019-21", company: "多点生活",     tagline: "b4", side: "down", highlight: true },
  { year: "2021-23", company: "美团外卖",     tagline: "b5", side: "up",   highlight: true },
  { year: "2023-25", company: "迈步科技",     tagline: "b6", side: "up",   highlight: true },
];

const W = 1200;
const H = 520;
const PAD = 80;
const CY = H / 2;

export default function CareerFishbone({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      const spine = root.current.querySelector<SVGPathElement>(".cf-spine");
      const nodes = root.current.querySelectorAll<SVGGElement>(".cf-node");

      if (spine) {
        const len = spine.getTotalLength();
        spine.style.strokeDasharray = String(len);
        spine.style.strokeDashoffset = String(len);
        gsap.to(spine, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 80%",
            end: "bottom 70%",
            scrub: 0.5,
          },
        });
      }
      nodes.forEach((n, i) => {
        gsap.from(n, {
          scale: 0,
          opacity: 0,
          transformOrigin: "50% 50%",
          duration: 0.5,
          ease: EASE,
          delay: i * 0.04,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
      });
    },
    { scope: root },
  );

  const xAt = (i: number) => PAD + (i * (W - 2 * PAD)) / (BONES.length - 1);

  return (
    <div ref={root} className="career-fishbone" role="img" aria-label="career timeline">
      <svg viewBox={"0 0 " + W + " " + H} className="career-fishbone__svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="cf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--accent)" />
          </marker>
        </defs>
        <path
          className="cf-spine"
          d={"M " + (PAD - 32) + " " + CY + " L " + (W - PAD + 32) + " " + CY}
          stroke="var(--accent)"
          strokeWidth="3"
          fill="none"
          markerEnd="url(#cf-arrow)"
        />
        {BONES.map((b, i) => {
          const x = xAt(i);
          const dir = b.side === "up" ? -1 : 1;
          const dy = 110 + (i % 2) * 18;
          const bx = x + dir * 24;
          const by = CY + dir * dy;
          const labelY = by + dir * 32;
          const taglineY = labelY + dir * 22;
          const tx = bx + (b.side === "up" ? -8 : 8);
          return (
            <g key={i} className="cf-node" style={{ transformBox: "fill-box", transformOrigin: x + "px " + CY + "px" }}>
              <line x1={x} y1={CY} x2={bx} y2={by} stroke="var(--muted)" strokeWidth="1.2" strokeDasharray="2 3" opacity="0.7" />
              <circle cx={x} cy={CY} r={b.highlight ? 9 : 6} fill="var(--bg)" stroke="var(--accent)" strokeWidth="2.5" />
              {b.highlight && <circle cx={x} cy={CY} r={3.5} fill="var(--accent)" />}
              <text x={tx} y={labelY} fontSize="20" fontFamily="var(--font-display)" fontWeight="600" fill="var(--fg)" textAnchor={b.side === "up" ? "end" : "start"}>
                {b.company}
              </text>
              <text x={tx} y={labelY + 22} fontSize="11" fontFamily="var(--font-mono, monospace)" fill="var(--muted)" textAnchor={b.side === "up" ? "end" : "start"}>
                {b.year}
              </text>
              <text x={tx} y={taglineY + 10} fontSize="12" fill="var(--muted)" textAnchor={b.side === "up" ? "end" : "start"}>
                {t(locale, "about.career." + b.tagline)}
              </text>
            </g>
          );
        })}
      </svg>

      <ol className="career-fishbone__list">
        {BONES.map((b, i) => (
          <li key={i} className={b.highlight ? "cf-row cf-row--hl" : "cf-row"}>
            <div className="cf-row__year">{b.year}</div>
            <div className="cf-row__dot" />
            <div className="cf-row__body">
              <div className="cf-row__company">{b.company}</div>
              <div className="cf-row__tag">{t(locale, "about.career." + b.tagline)}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
