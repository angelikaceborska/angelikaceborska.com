"use client";

import { useEffect, useRef, type RefObject } from "react";
import { STICKERS } from "./stickers";

// Sticker size (px) per breakpoint — Tailwind's md (48rem) and lg (64rem).
const SIZE_MOBILE = 64;
const SIZE_MD = 80;
const SIZE_LG = 100;
// Cursor travel before the next sticker spawns, as a multiple of sticker size
// (1.1 → 110px at 100px stickers). Higher = sparser trail.
const SPACING = 1.1;
// Degrees of random tilt, centred on 0 (16 → −8° to +8°).
const ROTATION_RANGE = 16;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

// Cursor-driven trail for hover devices. Renders only the sticker layer; the
// pointer listeners go on `rootRef`, the positioned stage it sits inside.
export function StickerTrail({ rootRef }: { rootRef: RefObject<HTMLElement | null> }) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    if (!root || !layer) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const md = window.matchMedia("(min-width: 48rem)");
    const lg = window.matchMedia("(min-width: 64rem)");
    const stickerSize = () => (lg.matches ? SIZE_LG : md.matches ? SIZE_MD : SIZE_MOBILE);
    let last: { x: number; y: number } | null = null;
    let i = 0;

    const spawn = (x: number, y: number, size: number) => {
      const img = document.createElement("img");
      img.src = STICKERS[i++ % STICKERS.length];
      img.alt = "";
      img.draggable = false;
      img.className =
        "absolute top-0 left-0 max-w-none select-none will-change-[transform,opacity]";
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      // Base centring for the opacity-only (reduced-motion) path; the
      // full-motion keyframes carry their own translate.
      img.style.transform = "translate(-50%, -50%)";
      layer.appendChild(img);

      const r = (Math.random() - 0.5) * ROTATION_RANGE;
      // fill: "forwards" holds the last (transparent) frame until removal, so
      // the sticker never flashes back to its base style for a frame.
      const animation = reducedMotion.matches
        ? img.animate(
            [
              { opacity: 0 },
              { opacity: 1, offset: 0.2 },
              { opacity: 1, offset: 0.7 },
              { opacity: 0 },
            ],
            { duration: 800, easing: EASING, fill: "forwards" },
          )
        : img.animate(
            [
              { transform: `translate(-50%,-50%) rotate(${r}deg) scale(0.65)`, opacity: 0 },
              { transform: `translate(-50%,-50%) rotate(${r}deg) scale(1)`, opacity: 1, offset: 0.16 },
              { transform: `translate(-50%,-50%) rotate(${r}deg) scale(1)`, opacity: 1, offset: 0.6 },
              { transform: `translate(-50%,-50%) rotate(${r}deg) translateY(-16px) scale(0.9)`, opacity: 0 },
            ],
            { duration: 1150, easing: EASING, fill: "forwards" },
          );
      animation.onfinish = () => img.remove();
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = stickerSize();
      if (last && Math.hypot(x - last.x, y - last.y) < Math.round(size * SPACING)) return;
      spawn(x, y, size);
      last = { x, y };
    };
    const onLeave = () => {
      last = null;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);

    // Warm the cache shortly before the footer scrolls into view, so the first
    // stickers don't pop in mid-fade — without adding them to initial page load.
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        for (const src of STICKERS) new Image().src = src;
        preload.disconnect();
      },
      { rootMargin: "600px" },
    );
    preload.observe(root);

    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      preload.disconnect();
    };
  }, [rootRef]);

  return <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]" />;
}
