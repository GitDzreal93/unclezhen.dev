"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/lib/data";

// Rotating sidebar banner. Auto-advances every 5s when there's more than one;
// dots let the reader jump. Each banner is a link if linkUrl is set.
export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const cur = banners[i];

  return (
    <div className="banner-carousel">
      {cur.linkUrl ? (
        <a href={cur.linkUrl} className="banner-carousel__slide" aria-label={cur.title || "banner"}>
          <img src={cur.imageUrl} alt={cur.title} />
        </a>
      ) : (
        <div className="banner-carousel__slide">
          <img src={cur.imageUrl} alt={cur.title} />
        </div>
      )}
      {banners.length > 1 && (
        <div className="banner-carousel__dots">
          {banners.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              aria-label={`第 ${idx + 1} 个 banner`}
              className={`banner-carousel__dot${idx === i ? " is-active" : ""}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
