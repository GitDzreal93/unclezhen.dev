"use client";

// OKR cards for /about. 4 curated projects, scroll-driven stagger reveal.
// Each card: O (objective) header + tech stack chips + KR list with
// checkmark draw + impact footer.

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, ScrollTrigger, EASE } from "@/lib/gsap";
import { t, type Locale } from "@/lib/i18n/dict";

type Project = {
  key: "mofang" | "meituan" | "beike" | "duodian";
  stack: string[];
};

const PROJECTS: Project[] = [
  { key: "mofang",  stack: ["Vue3", "SpringBoot", "Flutter", "Python", "PostgreSQL"] },
  { key: "meituan", stack: ["Java", "Python", "Jmeter", "Shell", "Jenkins"] },
  { key: "beike",   stack: ["Python", "Java", "Jmeter", "Appium", "MySQL"] },
  { key: "duodian", stack: ["Python", "HttpRunner", "Jmeter", "Jenkins", "ElasticSearch"] },
];

function Check() {
  return (
    <svg className="okr__check" viewBox="0 0 16 16" width="14" height="14" aria-hidden>
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProjectCard({ p, locale, idx }: { p: Project; locale: Locale; idx: number }) {
  const data = (key: string) => t(locale, `about.project.${p.key}.${key}`);
  return (
    <article className="okr" data-i={idx}>
      <header className="okr__head">
        <div className="okr__oidx">O{idx + 1}</div>
        <div className="okr__stack">
          {p.stack.map((s) => (
            <code key={s} className="okr__chip">{s}</code>
          ))}
        </div>
      </header>
      <h3 className="okr__o">{data("o")}</h3>
      <ul className="okr__list">
        {(["kr1", "kr2", "kr3", "kr4"] as const).map((k) => {
          const v = data(k);
          if (!v) return null;
          return (
            <li key={k}>
              <Check />
              <span><strong>{k.toUpperCase()}</strong> {v}</span>
            </li>
          );
        })}
      </ul>
      <footer className="okr__foot">
        <div>
          <span className="okr__footlabel">{t(locale, "about.projects.impact")}</span>
          <span className="okr__footval">{data("impact")}</span>
        </div>
        <div className="okr__footdate">{data("dates")}</div>
      </footer>
    </article>
  );
}

export default function ProjectOKR({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      const cards = root.current.querySelectorAll<HTMLElement>(".okr");
      gsap.from(cards, {
        y: 36,
        opacity: 0,
        duration: 0.7,
        ease: EASE,
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: "top 78%", once: true },
      });
      // checkmark draw
      root.current.querySelectorAll<SVGPathElement>(".okr__check path").forEach((p, i) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: 0.5,
          ease: EASE,
          delay: i * 0.05,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });
      });
    },
    { scope: root },
  );
  return (
    <div ref={root} className="okr-grid">
      {PROJECTS.map((p, i) => (
        <ProjectCard key={p.key} p={p} locale={locale} idx={i} />
      ))}
    </div>
  );
}
