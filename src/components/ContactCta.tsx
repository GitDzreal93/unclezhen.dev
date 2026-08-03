"use client";

import { useState } from "react";
import Modal from "./Modal";
import { toast } from "./toast";
import { t, type Locale } from "@/lib/i18n/dict";

export default function ContactCta({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          contact: data.get("contact"),
          message: data.get("msg"),
        }),
      });
      setOpen(false);
      toast(t(locale, "contact.toast.ok"));
      form.reset();
    } catch {
      toast(t(locale, "contact.toast.fail"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className="btn btn--primary" type="button" onClick={() => setOpen(true)}>
        {t(locale, "home.cta.ping")}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="contact-title">
        <h3 id="contact-title">{t(locale, "contact.title")}</h3>
        <p>{t(locale, "contact.desc")}</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="c-name">{t(locale, "contact.name")}</label>
            <input id="c-name" name="name" required placeholder={t(locale, "contact.namePlaceholder")} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="c-mail">{t(locale, "contact.contact")}</label>
            <input id="c-mail" name="contact" required placeholder={t(locale, "contact.contactPlaceholder")} />
          </div>
          <div className="field">
            <label htmlFor="c-msg">{t(locale, "contact.message")}</label>
            <textarea id="c-msg" name="msg" placeholder={t(locale, "contact.messagePlaceholder")}></textarea>
          </div>
          <div className="modal__actions">
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t(locale, "contact.cancel")}
            </button>
            <button className="btn btn--primary btn--sm" type="submit" disabled={submitting}>
              {submitting ? "…" : t(locale, "contact.send")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
