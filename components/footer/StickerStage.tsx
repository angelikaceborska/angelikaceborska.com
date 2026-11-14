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
    <section className={`relative overflow-hidden ${className}`}>
      <StickerRain />
      {children}
    </section>
  );
}
