"use client";

import { useState } from "react";

// A readonly value with a copy button. Used in the media library to hand out
// the raw URL and the Markdown image tag for an asset.
export default function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <label className="copy-field">
      <span className="copy-field__k">{label}</span>
      <input
        className="mono"
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // clipboard blocked — the readonly input is already focused-selected
          }
        }}
      >
        {copied ? "已复制" : "复制"}
      </button>
    </label>
  );
}
