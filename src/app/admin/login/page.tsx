"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t, type Locale } from "@/lib/i18n/dict";

function AdminLoginForm({ locale }: { locale: Locale }) {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string })?.error || t(locale, "admin.login.fail"));
        return;
      }
      const from = params.get("from") || "/admin";
      router.replace(from);
      router.refresh();
    } catch {
      setError(t(locale, "admin.login.networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={onSubmit}>
        <div className="eyebrow">{t(locale, "admin.login.eyebrow")}</div>
        <h1>{t(locale, "admin.login.heading")}</h1>
        <div className="field">
          <label htmlFor="pw">{t(locale, "admin.login.password")}</label>
          <input
            id="pw"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t(locale, "admin.login.passwordPlaceholder")}
          />
        </div>
        {error && <p className="admin-login__err">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? t(locale, "admin.login.submitting") : t(locale, "admin.login.submit")}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="admin-login" />}>
      <AdminLoginForm locale="zh" />
    </Suspense>
  );
}
