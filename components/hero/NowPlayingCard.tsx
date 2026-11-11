"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { NowPlayingAutoplay } from "@/components/now-playing";

// Figma frame "Component" (826:789): 1080×1080, the player at 3× on the iris photo, resting
// on the bar. Laid out here at a third of that, 360, so the player sits at its own 1× size
// (260 wide, 50 each side), then the whole frame is scaled to the tile (240 / 336 / 420px),
// the same way ChartDemoCard fits its frame.
const FRAME = 360;

/**
 * The NowPlaying player from the portfolio's Figma, live inside a hero tile and playing its own
 * demo (NowPlayingAutoplay): from the card, a cursor taps play, then the heart, then folds the
 * card into the bar, and round again. A real mouse takes over, and the strip already pauses on
 * hover, so the tile holds still while it is being used.
 */
export function NowPlayingCard({ alt }: { alt: string }) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setScale(entry.contentRect.width / FRAME),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // Rendered four times (two copies per track × two tracks), so, like the chart demo, it is
    // one image to assistive tech and kept out of the tab order.
    <div ref={tileRef} role="img" aria-label={alt} className="absolute inset-0">
      <Image
        src="/hero/Now_Playing_Background.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 336px, 240px"
        className="object-cover"
      />
      <div
        className="absolute left-0 top-0 grid place-items-center origin-top-left"
        style={{
          width: FRAME,
          height: FRAME,
          transform: `scale(${scale})`,
          // Hidden for the one frame before the tile has been measured.
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <NowPlayingAutoplay focusable={false} defaultOpen />
      </div>
    </div>
  );
}
