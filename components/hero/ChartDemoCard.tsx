"use client";

import Image from "next/image";
import { Inter, Karla } from "next/font/google";
import { useLayoutEffect, useRef, useState } from "react";
import { BarChartAutoplay } from "@/components/bar-chart";
import { changeByRange, dataByRange, ranges, series } from "./chart-demo-data";

// The chart is set in Inter, with Karla for the AVG pill, as in Figma. Both are scoped to
// this tile through CSS variables (read in components/bar-chart/BarChart.css); the rest of
// the site stays PP Mori.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});
const karla = Karla({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-karla",
});

// Figma frame "chart" (447:19182): 1080×1080, the 780px card centred on the photo
// (814:11735). The frame is laid out at full size and scaled down to the tile, so it
// matches Figma at every breakpoint (240 / 336 / 420px tiles).
const FRAME = 1080;

/**
 * The live bar chart from the portfolio's Figma, playing its own demo inside a hero tile.
 * Hovering takes over from the demo (the strip already pauses on hover). On touch screens
 * the tile is too small to use, so the chart ignores touches and just plays.
 */
export function ChartDemoCard({ alt }: { alt: string }) {
  const tileRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [range, setRange] = useState("30d"); // the demo opens on 30 days
  const rangeLabel = ranges.find((r) => r.value === range)?.label ?? "";

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
    <div
      ref={tileRef}
      role="img"
      aria-label={alt}
      className={`${inter.variable} ${karla.variable} absolute inset-0`}
    >
      <Image
        src="/hero/Chart_Demo_Background.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 420px, (min-width: 768px) 336px, 240px"
        className="object-cover"
      />
      <div
        className="absolute left-0 top-0 grid place-items-center origin-top-left [@media(hover:none)]:pointer-events-none"
        style={{
          width: FRAME,
          height: FRAME,
          transform: `scale(${scale})`,
          // Hidden for the one frame before the tile has been measured.
          visibility: scale ? "visible" : "hidden",
        }}
      >
        <BarChartAutoplay
          title="Scheduled Posts"
          series={series}
          data={dataByRange[range]}
          change={changeByRange[range]}
          changeHint={`last ${rangeLabel}`}
          ranges={ranges}
          range={range}
          onRangeChange={setRange}
          focusable={false}
        />
      </div>
    </div>
  );
}
