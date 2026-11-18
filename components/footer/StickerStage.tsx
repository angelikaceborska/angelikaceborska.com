import type { ReactNode } from "react";
import { StickerRain } from "./StickerRain";

export function StickerStage({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    // overflow-clip, not hidden: a hidden box can still be scrolled, and
    // focusing a sticker tossed past the edge would scroll the whole pile.
    <section className={`relative overflow-clip ${className}`}>
      <StickerRain />
      {children}
    </section>
  );
}
