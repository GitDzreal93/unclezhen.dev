"use client";

import Link from "next/link";
import Newspaper from "@/components/Newspaper";
import Reveal from "@/components/Reveal";
import type { IssueWithSections } from "@/lib/data";
import { t, type Locale } from "@/lib/i18n/dict";

// Public detail: renders the newspaper layout from the issue's visible
// sections. v1 supports masthead, lead, colophon; other kinds show as
// labelled placeholders inside the same wrapper.
export default function WeeklyDetailClient({
  issue,
  locale,
}: {
  issue: IssueWithSections;
  locale: Locale;
}) {
  return (
    <div className="weekly-page">
      <div className="wrap weekly-back">
        <Link href="/weekly" className="back-btn btn btn--ghost btn--sm">
          {t(locale, "weekly.back")}
        </Link>
      </div>
      <div className="weekly-page__paper">
        {/* 报纸"落定"：下落 + 微转正 + 淡入，一次性 */}
        <Reveal as="div" className="weekly-page__paper-inner" y={36} rotate={-1.5} delay={0.1} start="top 92%" blur>
          <Newspaper sections={issue.sections} mode="public" />
        </Reveal>
      </div>
    </div>
  );
}
