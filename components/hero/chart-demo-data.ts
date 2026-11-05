import type {
  BarChartDatum,
  BarChartRange,
  BarChartSeries,
} from "@/components/bar-chart";

// Sample data for the hero's bar chart demo (ChartDemoCard). Made up, apart from 3–9 Jun.

export const series: BarChartSeries[] = [
  { key: "text", label: "Text", color: "#1877F2" },
  { key: "video", label: "Video", color: "#FE8ED9" },
  { key: "image", label: "Image", color: "#00985D" },
  { key: "carousel", label: "Carousel", color: "#6C4DFF" },
];

export const ranges: BarChartRange[] = [
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
];

/** Made-up change vs. the previous period, shown in the green badge. */
export const changeByRange: Record<string, string> = {
  "7d": "+10%",
  "14d": "+6%",
  "30d": "+14%",
};

// The last 7 days are the ones from the Figma mockup (3–9 Jun).
const lastWeek: BarChartDatum["values"][] = [
  { text: 1, video: 1, image: 1, carousel: 0 },
  { text: 1, video: 1, image: 2, carousel: 1 },
  { text: 2, video: 2, image: 1, carousel: 2 },
  { text: 1, video: 2, image: 2, carousel: 2 },
  { text: 2, video: 3, image: 3, carousel: 4 },
  { text: 1, video: 1, image: 1, carousel: 2 },
  { text: 1, video: 0, image: 2, carousel: 1 },
];

// Small seeded PRNG so the earlier days look random but never change between reloads.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function buildDays(count: number, lastDay: Date): BarChartDatum[] {
  const rand = mulberry32(7);
  const int = (max: number) => Math.floor(rand() * (max + 1));
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(lastDay);
    date.setDate(lastDay.getDate() - (count - 1 - i));
    const fromMockup = lastWeek[i - (count - lastWeek.length)];
    return {
      date: toIso(date),
      values: fromMockup ?? {
        text: int(2),
        video: int(2),
        image: int(3),
        carousel: int(2),
      },
    };
  });
}

const allDays = buildDays(30, new Date(2026, 5, 9));

export const dataByRange: Record<string, BarChartDatum[]> = {
  "7d": allDays.slice(-7),
  "14d": allDays.slice(-14),
  "30d": allDays,
};
