"use client";

// 赛博日报阅读动效。墨迹叙事：纸张展开 → 报头浮现 → 印章落款 →
// 各板块随滚动「洇开」（blur + y），榜单行逐条浮出。
// 全部走 transform/opacity/filter，reduced-motion 直接跳过。

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, EASE } from "@/lib/gsap";

export default function DailyMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const q = gsap.utils.selector(root);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // —— 开卷：纸张展开 + 报头浮现 ——
        const intro = gsap.timeline({ defaults: { ease: EASE } });
        intro
          .fromTo(
            q(".dp-page"),
            { autoAlpha: 0, y: 30, rotate: -0.8 },
            { autoAlpha: 1, y: 0, rotate: 0, duration: 0.9 }
          )
          .fromTo(
            q(".dp-topbar, .dp-mh-side"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.5, stagger: 0.08 },
            "-=0.45"
          )
          .fromTo(
            q(".dp-mh-title"),
            { autoAlpha: 0, letterSpacing: "0.5em", y: -6 },
            { autoAlpha: 1, letterSpacing: "0.18em", y: 0, duration: 0.8 },
            "<"
          )
          .fromTo(
            q(".dp-mh-strap"),
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4 },
            "-=0.3"
          )
          // —— 印章「落款」：缩放砸下 + 微弹 ——
          .fromTo(
            q(".dp-seal"),
            { autoAlpha: 0, scale: 2.4, rotation: 8 },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: -4,
              duration: 0.45,
              ease: "back.in(1.6)",
            },
            "-=0.15"
          );
        // 中途刷新：直接跳到完成态
        if (window.scrollY > 80) intro.progress(1);

        // —— 板块洇开：滚到即入，墨迹从模糊到清晰 ——
        q(".dp-sec").forEach((sec) => {
          gsap.fromTo(
            sec,
            { autoAlpha: 0, y: 26, filter: "blur(5px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.85,
              ease: EASE,
              scrollTrigger: { trigger: sec, start: "top 88%", once: true },
            }
          );
        });

        // —— 榜单行逐条浮出（每个 rank card 内的 li）——
        q(".dp-rank-card").forEach((card) => {
          gsap.fromTo(
            card.querySelectorAll("li"),
            { autoAlpha: 0, x: -10 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.4,
              ease: EASE,
              stagger: 0.06,
              scrollTrigger: { trigger: card, start: "top 90%", once: true },
            }
          );
        });

        // —— 副业线报行同理 ——
        q(".dp-side-list").forEach((list) => {
          gsap.fromTo(
            list.querySelectorAll(".dp-side-item"),
            { autoAlpha: 0, x: -10 },
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.35,
              ease: EASE,
              stagger: 0.045,
              scrollTrigger: { trigger: list, start: "top 90%", once: true },
            }
          );
        });

        // —— 页脚落款最后浮现 ——
        gsap.fromTo(
          q(".dp-colophon"),
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.8,
            scrollTrigger: { trigger: q(".dp-colophon"), start: "top 95%", once: true },
          }
        );
      });
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
