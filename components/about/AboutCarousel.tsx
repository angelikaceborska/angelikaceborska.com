"use client";

import { useEffect, useRef } from "react";
import { aboutFacts } from "./about-data";
import { AboutCard } from "./AboutCard";

const SPEED_PX_PER_SEC = 130;

export function AboutCarousel() {
  // One "set" needs to be wider than the widest viewport (~2560px).
  // 12 cards × (~420px + 16px gap) ≈ 5200px per track — covers ultra-wide.
  const set = [...aboutFacts, ...aboutFacts];
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
    let paused = false;
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

      if (!paused) {
        const dx = SPEED_PX_PER_SEC * dt;
        xA -= dx;
        xB -= dx;

        if (xA + w <= 0) xA = xB + 2 * w;
        if (xB + 2 * w <= 0) xB = xA;

        trackA.style.transform = `translate3d(${xA}px, 0, 0)`;
        trackB.style.transform = `translate3d(${xB}px, 0, 0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
      last = performance.now();
    };
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      paused = mq.matches;
    };
    updateMotion();
    mq.addEventListener("change", updateMotion);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
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
          {set.map((fact, i) => (
            <AboutCard key={`a-${i}`} fact={fact} />
          ))}
        </div>
        <div
          ref={trackBRef}
          className="flex gap-4 pr-4"
          style={{ willChange: "transform" }}
          aria-hidden
        >
          {set.map((fact, i) => (
            <AboutCard key={`b-${i}`} fact={fact} />
          ))}
        </div>
      </div>
    </div>
  );
}
