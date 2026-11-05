"use client";

import { useEffect, useRef } from "react";
import { cards } from "./carousel-data";
import { CarouselCard } from "./CarouselCard";

const SPEED_PX_PER_SEC = 130;

export function Carousel() {
  // One "set" needs to be wider than the widest viewport (~2560px).
  // 12 cards × (~420px + 16px gap) ≈ 5200px per track — covers ultra-wide.
  const set = [...cards, ...cards];
  const containerRef = useRef<HTMLDivElement>(null);
  const trackARef = useRef<HTMLDivElement>(null);
  const trackBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trackA = trackARef.current;
    const trackB = trackBRef.current;
    const container = containerRef.current;
    if (!trackA || !trackB || !container) return;

    let xA = 0;
    let xB = 0;
    let last = performance.now();
    // Two independent reasons to stand still. Kept apart so that moving the
    // mouse off the strip never restarts it for a reduced-motion visitor.
    let hovered = false;
    let reducedMotion = false;
    // Whether an enter event can be trusted as a real hover. See onHidden.
    let hoverTrusted = true;
    let raf = 0;

    const tick = (now: number) => {
      const w = trackA.offsetWidth;
      if (w === 0) {
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      if (!hovered && !reducedMotion) {
        const dx = SPEED_PX_PER_SEC * dt;
        xA -= dx;
        xB -= dx;

        // When a track is fully off-screen left, teleport it to the right of
        // the other track. The visible region is always covered by the track
        // that is NOT being teleported, so the snap is never seen.
        if (xA + w <= 0) xA = xB + 2 * w;
        if (xB + 2 * w <= 0) xB = xA;

        trackA.style.transform = `translate3d(${xA}px, 0, 0)`;
        trackB.style.transform = `translate3d(${xB}px, 0, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onEnter = () => {
      if (hoverTrusted) hovered = true;
    };
    // A real pointer always moves; this also catches the first real move
    // after an untrusted enter, so a visitor who is genuinely over the strip
    // still pauses it.
    const onMove = () => {
      hoverTrusted = true;
      hovered = true;
    };
    const onLeave = () => {
      hovered = false;
      last = performance.now();
    };
    // Safari restores a stale hover when a tab comes back into view (or the
    // page returns from the back/forward cache): it fires mouseenter for
    // wherever the mouse was before, with no movement, even if the mouse is
    // now elsewhere. Without this the strip froze after switching tabs,
    // until the mouse happened to pass over it again.
    const onHidden = () => {
      hovered = false;
      hoverTrusted = false;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHidden();
      else last = performance.now();
    };
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHidden);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      reducedMotion = mq.matches;
    };
    updateMotion();
    mq.addEventListener("change", updateMotion);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHidden);
      mq.removeEventListener("change", updateMotion);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div className="flex w-max">
        <div
          ref={trackARef}
          className="flex gap-4 pr-4"
          style={{ willChange: "transform" }}
        >
          {set.map((card, i) => (
            <CarouselCard key={`a-${i}`} card={card} />
          ))}
        </div>
        <div
          ref={trackBRef}
          className="flex gap-4 pr-4"
          style={{ willChange: "transform" }}
          aria-hidden
        >
          {set.map((card, i) => (
            <CarouselCard key={`b-${i}`} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
