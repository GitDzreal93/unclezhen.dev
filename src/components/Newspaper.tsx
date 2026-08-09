"use client";

import type {
  MastheadBody,
  LeadBody,
  ColophonBody,
} from "@/lib/issues-types";
import type { IssueSection } from "@/lib/data";

// Dispatcher: takes the sections from an issue and renders each one with its
// kind-specific component. v1 supports masthead, lead, colophon (the three
// the admin form actually implements). Unknown / future kinds render as a
// labelled placeholder so the layout doesn't break.
//
// mode = "public"  → call sites already filtered visible=true rows in the DB
// mode = "preview" → reserved for admin previews (unused for v1)

export default function Newspaper({
  sections,
  mode = "public",
}: {
  sections: IssueSection[];
  mode?: "public" | "preview";
}) {
  // For v1, masthead must render first to anchor the page. Other kinds follow
  // in their stored `position` order.
  const sorted = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div className="weekly-newspaper" data-mode={mode}>
      {sorted.map((s) => {
        switch (s.kind) {
          case "masthead":
            return <Masthead key={s.id} body={s.body as MastheadBody} />;
          case "lead":
            return <Lead key={s.id} body={s.body as LeadBody} />;
          case "colophon":
            return <Colophon key={s.id} body={s.body as ColophonBody} />;
          default:
            return (
              <div key={s.id} className="weekly-section weekly-section--todo">
                <p className="muted">[{s.kind}] v2 即将支持</p>
              </div>
            );
        }
      })}
    </div>
  );
}

// ============ Masthead ============

function Masthead({ body }: { body: MastheadBody }) {
  if (!body) return null;
  const { left, right, title, strap, dateline } = body;
  return (
    <div className="weekly-section weekly-masthead">
      <div className="weekly-masthead__grid">
        <div className="weekly-masthead__side weekly-masthead__side--left">
          <div><b>{left?.issueLabel}</b></div>
          <div>{left?.address}</div>
          <div>{left?.weather}</div>
        </div>
        <div className="weekly-masthead__title">
          <div className="weekly-masthead__title-text">{title || "赛博晚报"}</div>
          <div className="weekly-masthead__strap">{strap || "技 术 周 刊"}</div>
        </div>
        <div className="weekly-masthead__side weekly-masthead__side--right">
          <div><b>{right?.price}</b></div>
          <div>{right?.cadence}</div>
          <div>{right?.ads}</div>
        </div>
      </div>
      <div className="weekly-dateline">
        <span>{dateline?.date}</span>
        <span className="weekly-dateline__dot">●</span>
        <span>{dateline?.weekday}</span>
        <span className="weekly-dateline__dot">●</span>
        <span>{dateline?.lunar}</span>
      </div>
    </div>
  );
}

// ============ Lead ============

function Lead({ body }: { body: LeadBody }) {
  if (!body) return null;
  const { image, imageCaption, kicker, title, subtitle, paragraphs, toc } = body;
  return (
    <div className="weekly-section weekly-lead">
      <div className="weekly-lead__grid">
        <div className="weekly-lead__figure">
          {image ? (
            <img src={image} alt={imageCaption || ""} />
          ) : (
            <div className="weekly-lead__placeholder" aria-hidden="true">
              臻叔 配图
            </div>
          )}
          {imageCaption && <div className="weekly-lead__caption">{imageCaption}</div>}

          {toc && toc.length > 0 && (
            <div className="weekly-sidebox">
              <h4>本 期 导 读</h4>
              <ul>
                {toc.map((t, i) => (
                  <li key={i}>
                    <span className="weekly-sidebox__label">{t.label}</span>
                    {t.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="weekly-lead__body">
          {kicker && <span className="weekly-kicker">{kicker}</span>}
          {title && <h1 className="weekly-lead__title">{title}</h1>}
          {subtitle && <p className="weekly-lead__subtitle">{subtitle}</p>}
          <div className="weekly-body-text">
            {(paragraphs || []).filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Colophon ============

function Colophon({ body }: { body: ColophonBody }) {
  if (!body) return null;
  return (
    <div className="weekly-section weekly-colophon">
      <div className="weekly-colophon__line">
        主笔 <span className="weekly-colophon__seal">{body.editor}</span>
        {body.contact && <>　|　<span>{body.contact}</span></>}
      </div>
      {body.footer && <div className="weekly-colophon__footer">{body.footer}</div>}
    </div>
  );
}
