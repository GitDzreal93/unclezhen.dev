"use client";

// LogoPit shell — dynamic-imports the 746-line client-only Three.js component
// (which uses three/examples/jsm/* so can't SSR). Brand icons data is inlined
// in brand-icons.ts so we don't need simple-icons at runtime.

import dynamic from "next/dynamic";
import { BRAND, type BrandIcon } from "./brand-icons";
import { t, type Locale } from "@/lib/i18n/dict";

const LogoPit = dynamic(() => import("./LogoPit"), {
  ssr: false,
  loading: () => <div className="toolpit__loading">// loading stack…</div>,
});

// Curated 35 tools in display order (matches history; e6b85db commit order).
const TOOL_KEYS: Array<keyof typeof BRAND> = [
  "python", "go", "typescript", "flutter", "java",
  "linux", "git", "javascript", "shell",
  "react", "tailwind", "antdesign", "elementui", "vue", "nextjs",
  "claudecode", "vscode", "codex", "node",
  "workbuddy", "jira", "jenkins", "kubernetes", "docker",
  "springboot", "mysql", "selectdb", "postgres",
  "kafka", "rocketmq", "elasticsearch", "rabbitmq",
  "android", "ios", "swift",
];

export default function AboutStack({ locale }: { locale: Locale }) {
  const tools: BrandIcon[] = TOOL_KEYS.map((k) => BRAND[k]).filter(Boolean) as BrandIcon[];
  return (
    <div className="toolpit">
      <h2 className="section-eyebrow">
        $ stack --interactive
        <span className="section-eyebrow__hint">{t(locale, "about.stack.lead")}</span>
      </h2>
      {/* count = tools + 1: index 0 in LogoPit is the invisible cursor influencer */}
      <LogoPit className="toolpit__bg" tools={tools} count={tools.length + 1} followCursor />
    </div>
  );
}
