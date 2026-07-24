"use client";

import { useState } from "react";
import Modal from "./Modal";
import { toast } from "./toast";

export default function ContactCta() {
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
      toast("ping ok · 已记录");
      form.reset();
    } catch {
      toast("发送失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className="btn btn--primary" type="button" onClick={() => setOpen(true)}>
        ./ping
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="contact-title">
        <h3 id="contact-title">./ping</h3>
        <p>留下联系方式与需求。原型演示，提交后仅记录到数据库。</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="c-name">name</label>
            <input id="c-name" name="name" required placeholder="称呼" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="c-mail">contact</label>
            <input id="c-mail" name="contact" required placeholder="邮箱或微信" />
          </div>
          <div className="field">
            <label htmlFor="c-msg">message</label>
            <textarea id="c-msg" name="msg" placeholder="内训 / 定制 / 课程合作…"></textarea>
          </div>
          <div className="modal__actions">
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              onClick={() => setOpen(false)}
            >
              cancel
            </button>
            <button className="btn btn--primary btn--sm" type="submit" disabled={submitting}>
              send
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
