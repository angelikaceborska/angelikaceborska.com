"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { StickerRain } from "./StickerRain";
import { StickerTrail } from "./StickerTrail";

// Devices with a real hover pointer (mouse, trackpad) get the cursor trail;
// touch devices (phones, tablets) get the physics rain instead.
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(HOVER_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export function StickerStage({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  // null on the server and during hydration, so neither effect renders until
  // the client knows which one applies.
  const canHover = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => null,
  );

  return (
    <section ref={rootRef} className={`relative overflow-hidden ${className}`}>
      {canHover === false && <StickerRain />}
      {children}
      {canHover && <StickerTrail rootRef={rootRef} />}
    </section>
  );
}
