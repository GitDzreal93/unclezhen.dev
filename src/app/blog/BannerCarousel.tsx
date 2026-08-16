"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@/lib/data";

// Rotating banner strip. Two variants:
//  - "wide"   : full-width 横幅 header above the post list
//  - "sidebar": 280px card in the right column (legacy)
// Auto-advances every 5s when there's more than one; dots let the reader jump.
export default function BannerCarousel({
  banners,
  variant = "sidebar",
}: {
  banners: Banner[];
  variant?: "wide" | "sidebar";
}) {
  const [i, setI] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timerReset, setTimerReset] = useState(0);
  const goTo = (index: number) => {
    setI((index + banners.length) % banners.length);
    setTimerReset((reset) => reset + 1);
  };
  const previous = () => goTo(i - 1);
  const next = () => goTo(i + 1);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const t = setTimeout(() => setI((p) => (p + 1) % banners.length), 5000);
    return () => clearTimeout(t);
  }, [banners.length, i, isPaused, timerReset]);

  if (banners.length === 0) return null;

  return (
    <div
      className={`banner-carousel banner-carousel--${variant}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="博客横幅轮播"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          previous();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          next();
        }
      }}
    >
      <div className="banner-carousel__stage">
        {banners.map((banner, idx) => {
          const isActive = idx === i;
          const className = `banner-carousel__slide${isActive ? " is-active" : ""}`;
          const image = <img src={banner.imageUrl} alt={isActive ? banner.title : ""} />;

          return banner.linkUrl ? (
            <a
              key={banner.id}
              href={banner.linkUrl}
              className={className}
              aria-label={banner.title || "banner"}
              aria-hidden={!isActive}
              tabIndex={isActive ? undefined : -1}
            >
              {image}
            </a>
          ) : (
            <div key={banner.id} className={className} aria-hidden={!isActive}>
              {image}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <>
          <button
            type="button"
            className="banner-carousel__arrow banner-carousel__arrow--prev"
            aria-label="显示上一个横幅"
            onClick={previous}
          />
          <button
            type="button"
            className="banner-carousel__arrow banner-carousel__arrow--next"
            aria-label="显示下一个横幅"
            onClick={next}
          />
          <div className="banner-carousel__dots">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                aria-label={`显示第 ${idx + 1} 个横幅`}
                aria-current={idx === i ? "true" : undefined}
                className={`banner-carousel__dot${idx === i ? " is-active" : ""}`}
                onClick={() => goTo(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
