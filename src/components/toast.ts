"use client";

// Lightweight imperative toast, mirroring the prototype's unclezhen.toast.
let toastEl: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function toast(msg: string) {
  if (typeof document === "undefined") return;
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  // force reflow so re-trigger animates
  void toastEl.offsetWidth;
  toastEl.classList.add("is-show");
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toastEl?.classList.remove("is-show");
  }, 2400);
}
