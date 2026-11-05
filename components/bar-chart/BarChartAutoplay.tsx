"use client";

/* The cursor is a small decorative SVG from the Figma file: next/image adds nothing here. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { assetUrl } from "./asset";
import { useReducedMotion } from "./useReducedMotion";
import { BarChart } from "./BarChart";
import type { BarChartProps } from "./BarChart";
import cursorImg from "./icons/cursor.svg";
import "./BarChartAutoplay.css";

/**
 * One step of the demo loop.
 * - `hover`: glide the cursor onto a bar (negative counts from the end: -1 is the latest day).
 * - `tab`: glide to a range tab (index into `ranges`) and click it.
 * `hold` is how long to wait afterwards, in ms.
 */
export type AutoplayStep =
  | { hover: number; hold: number }
  | { tab: number; hold: number };

// Sweep across 4–8 Jun, one bar at a time. Every range ends on 9 Jun, so these
// count back from the latest day: -6 is 4 Jun, -2 is 8 Jun.
const SWEEP: AutoplayStep[] = [
  { hover: -6, hold: 700 }, // 4 Jun
  { hover: -5, hold: 450 },
  { hover: -4, hold: 450 },
  { hover: -3, hold: 450 },
  { hover: -2, hold: 1000 }, // 8 Jun, a beat longer before heading for the next tab
];

// Tab indexes follow `ranges`: 0 = 7 days, 1 = 14 days, 2 = 30 days.
const DEFAULT_STEPS: AutoplayStep[] = [
  { tab: 2, hold: 1700 }, // 30 days: skipped when it's already showing, e.g. on the first round
  ...SWEEP,
  { tab: 1, hold: 1500 }, // 14 days
  ...SWEEP,
  { tab: 0, hold: 1500 }, // 7 days, then back to the top: 30 days again
  ...SWEEP,
];

const RESUME_AFTER = 1500; // ms after a visitor's mouse leaves before the demo carries on
const RESUME_AFTER_TOUCH = 5000; // touch has no "leave", so wait longer after the last tap
const VISIBLE_THRESHOLD = 0.3; // share of the chart on screen before the demo plays
const PRESS_MS = 140; // the cursor's click
// Where the cursor waits before the first move: level with the title, in the empty space
// before the tabs.
const REST = { x: 0.55, y: 44 };

type Point = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };

export interface BarChartAutoplayProps
  extends Omit<BarChartProps, "highlight"> {
  steps?: AutoplayStep[];
  autoplay?: boolean;
  /** Fires when a visitor starts or stops using the chart, e.g. to pause a scrolling strip. */
  onVisitorChange?: (active: boolean) => void;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
// A hand speeds up and slows down; distance sets the time, like a real pointer.
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const travelMs = (distance: number) => clamp(300 + distance * 0.8, 320, 1100);

/**
 * The bar chart playing itself: a cursor glides over the bars and clicks the range tabs.
 * The bar under the cursor is shown as hovered, exactly as with a real mouse. A visitor's
 * mouse, touch or keyboard takes over at once; the demo resumes shortly after they leave.
 * With reduced motion it holds one still frame instead of looping.
 */
export function BarChartAutoplay({
  steps = DEFAULT_STEPS,
  autoplay = true,
  onVisitorChange,
  ...chart
}: BarChartAutoplayProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLImageElement>(null);
  const pos = useRef<Point>({ x: 0, y: 0 });
  const run = useRef(0);
  const barUnder = useRef<number | null>(null);
  const resumeTimer = useRef(0);
  const latest = useRef({ steps, chart, onVisitorChange });
  useEffect(() => {
    latest.current = { steps, chart, onVisitorChange };
  });

  // Both start the same on the server and the client (motion allowed, not on screen), so
  // the server's HTML matches the first client render; the real values arrive right after.
  const reduced = useReducedMotion();
  const [onScreen, setOnScreen] = useState(false);
  const [visitor, setVisitor] = useState(false);
  const [demoBar, setDemoBar] = useState<number | null>(null);
  const playing = autoplay && onScreen && !visitor && !reduced;

  // Reduced motion: no loop, just the hover frame from the design, held still.
  const n = chart.data.length;
  const firstHover = steps.find(
    (s): s is { hover: number; hold: number } => "hover" in s,
  );
  const stillBar =
    firstHover && n
      ? clamp(
          firstHover.hover < 0 ? n + firstHover.hover : firstHover.hover,
          0,
          n - 1,
        )
      : null;
  const holdStill = reduced && autoplay && !visitor && stillBar !== null;

  /* ── geometry, relative to the wrapper ───────────────────── */
  // In the wrapper's own (unscaled) pixels. If an ancestor scales the chart, e.g. a showcase
  // tile shrinking the whole Figma frame, on-screen rects are scaled but the cursor's
  // translate isn't, so divide the scale back out.
  const box = (el: Element): Box => {
    const wrap = wrapRef.current!;
    const w = wrap.getBoundingClientRect();
    const k = w.width / wrap.offsetWidth || 1;
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - w.left) / k,
      y: (r.top - w.top) / k,
      w: r.width / k,
      h: r.height / k,
    };
  };
  const columns = () => [
    ...(wrapRef.current?.querySelectorAll(".bc-column") ?? []),
  ];
  /** Each column's full height: what a real mouse hovers. */
  const columnBoxes = () => columns().map(box);
  /** Just the visible bars, index for index with the columns (null where a day has no bar). */
  const barBoxes = () =>
    columns().map((c) => {
      const bar = c.querySelector(".bc-bar");
      return bar ? box(bar) : null;
    });
  /**
   * Where to aim for bar i. When sweeping from a neighbouring bar, keep the current height if
   * it still lands on this bar, so the cursor travels sideways like a hand instead of bobbing.
   */
  const barPoint = (i: number, keepY?: number): Point | null => {
    const col = wrapRef.current?.querySelectorAll(".bc-column")[i];
    if (!col) return null;
    const bar = col.querySelector(".bc-bar");
    if (!bar) {
      const c = box(col);
      return { x: c.x + c.w / 2, y: c.y + c.h - 100 };
    }
    const b = box(bar);
    const x = b.x + b.w / 2 + 2;
    if (keepY !== undefined && keepY >= b.y + 10 && keepY <= b.y + b.h - 10)
      return { x, y: keepY };
    // Where the Figma mockup puts it: just right of centre, a quarter of the way down the bar.
    return { x, y: b.y + Math.min(b.h * 0.3, 75) };
  };
  const tabPoint = (i: number): Point | null => {
    const tab = wrapRef.current?.querySelectorAll(".t-tab")[i];
    if (!tab) return null;
    const t = box(tab);
    return { x: t.x + t.w * 0.55, y: t.y + t.h * 0.6 };
  };
  const restPoint = (): Point => ({
    x: (wrapRef.current?.clientWidth ?? 780) * REST.x,
    y: REST.y,
  });

  /** Move the cursor; given hover areas (one per column), also hover whichever one it is over. */
  const place = (p: Point, areas?: (Box | null)[]) => {
    pos.current = p;
    const el = cursorRef.current;
    // The `translate` property, not `transform`: the click's `scale` is applied after `translate`
    // but before `transform`, so with `transform` the click would scale the whole offset and
    // pull the cursor towards the corner. This way the arrow shrinks around its own tip.
    if (el) el.style.translate = `${p.x}px ${p.y}px`;
    if (!areas) return;
    const i = areas.findIndex(
      (c) =>
        !!c && p.x >= c.x && p.x < c.x + c.w && p.y >= c.y && p.y < c.y + c.h,
    );
    const bar = i < 0 ? null : i;
    if (bar !== barUnder.current) {
      barUnder.current = bar;
      setDemoBar(bar);
    }
  };

  // Play only while the chart is on screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      {
        threshold: VISIBLE_THRESHOLD,
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ── the loop ────────────────────────────────────────────── */
  useLayoutEffect(() => {
    if (!playing) return;
    const id = ++run.current;
    const alive = () => run.current === id;
    const sleep = (ms: number) =>
      new Promise<boolean>((r) => setTimeout(() => r(alive()), ms));
    const moveTo = (to: Point) =>
      new Promise<boolean>((resolve) => {
        const from = pos.current;
        const cols = columnBoxes();
        const bars = barBoxes();
        const colAt = (p: Point) =>
          cols.findIndex(
            (c) =>
              p.x >= c.x && p.x < c.x + c.w && p.y >= c.y && p.y < c.y + c.h,
          );
        const fromCol = colAt(from);
        const toCol = colAt(to);
        // Bar to bar (a sweep) the cursor hovers whole columns like a real mouse, so the tooltip
        // glides across. To or from a tab only the visible bars count, so passing through the
        // empty space above other bars on the way doesn't light them up.
        const sweep = fromCol >= 0 && toCol >= 0;
        const areas = sweep ? cols : bars;
        // The highest bar top the move passes over, ignoring the bar it starts or ends on.
        const clearance = (skip: number) => {
          const lo = Math.min(from.x, to.x);
          const hi = Math.max(from.x, to.x);
          let top = Infinity;
          bars.forEach((b, i) => {
            if (b && i !== skip && b.x + b.w >= lo && b.x <= hi)
              top = Math.min(top, b.y);
          });
          return top - 14;
        };
        // Leaving a bar for a tab: lift straight up first. Coming from a tab onto a bar: arrive
        // from straight above. One smooth curve either way (the handle sits above the bar, just
        // high enough to clear every bar in between), heading directly at the tab rather than
        // sliding along the tab row. Sweeps are straight lines.
        const handle: Point | null = sweep
          ? null
          : fromCol >= 0
            ? { x: from.x, y: Math.min(from.y, clearance(fromCol)) }
            : toCol >= 0
              ? { x: to.x, y: Math.min(to.y, clearance(toCol)) }
              : null;
        const along = (a: number, c: number, b: number, e: number) =>
          (1 - e) ** 2 * a + 2 * e * (1 - e) * c + e ** 2 * b;
        const ms = travelMs(Math.hypot(to.x - from.x, to.y - from.y));
        const t0 = performance.now();
        const frame = (t: number) => {
          if (!alive()) return resolve(false);
          const k = Math.min(1, (t - t0) / ms);
          const e = easeInOut(k);
          place(
            handle
              ? {
                  x: along(from.x, handle.x, to.x, e),
                  y: along(from.y, handle.y, to.y, e),
                }
              : {
                  x: from.x + (to.x - from.x) * e,
                  y: from.y + (to.y - from.y) * e,
                },
            areas,
          );
          if (k < 1) requestAnimationFrame(frame);
          else resolve(true);
        };
        requestAnimationFrame(frame);
      });
    const press = () => {
      const el = cursorRef.current;
      if (!el) return;
      el.dataset.press = "";
      setTimeout(() => delete el.dataset.press, PRESS_MS);
    };

    // Fade in at rest, outside the bars, then start.
    place(restPoint());
    (async () => {
      if (!(await sleep(700))) return;
      for (let s = 0; ; s++) {
        const { steps, chart } = latest.current;
        if (!steps.length) return;
        const step = steps[s % steps.length];
        if ("hover" in step) {
          const count = chart.data.length;
          const i = clamp(
            step.hover < 0 ? count + step.hover : step.hover,
            0,
            count - 1,
          );
          const sweeping = barUnder.current !== null; // already on a bar: glide across from it
          const p = barPoint(i, sweeping ? pos.current.y : undefined);
          if (p && !(await moveTo(p))) return;
        } else {
          const r = chart.ranges?.[step.tab];
          // Already showing this range (the first round, or a visitor left it here): skip the click.
          // (The zero-length sleep keeps a script of nothing but skipped steps from freezing the page.)
          if (r && r.value === chart.range) {
            if (!(await sleep(0))) return;
            continue;
          }
          if (r) {
            const p = tabPoint(step.tab);
            if (p) {
              if (!(await moveTo(p))) return;
              press();
            }
            if (!(await sleep(PRESS_MS))) return;
            if (r.value !== latest.current.chart.range)
              latest.current.chart.onRangeChange?.(r.value);
          }
        }
        if (!(await sleep(step.hold))) return;
      }
    })();

    return () => {
      // Bumping the run id is the cancel signal for the loop above; the latest value is intended.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
      barUnder.current = null;
      setDemoBar(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Reduced motion: park the cursor on the still frame's bar, and keep it there on resize.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!holdStill || stillBar === null || !el) return;
    const park = () => {
      const p = barPoint(stillBar);
      if (p) place(p);
    };
    park();
    const ro = new ResizeObserver(park);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdStill, stillBar]);

  /* ── a visitor takes over ────────────────────────────────── */
  useEffect(() => {
    const timer = resumeTimer; // the latest pending resume, cleared on unmount
    return () => clearTimeout(timer.current);
  }, []);
  const visitorIn = () => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = 0;
    setVisitor(true);
    latest.current.onVisitorChange?.(true);
  };
  const visitorOut = (after: number) => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = 0;
      setVisitor(false);
      latest.current.onVisitorChange?.(false);
    }, after);
  };

  return (
    <div
      ref={wrapRef}
      className="bc-autoplay"
      // Movement, not entry: Safari fires a stale pointerenter (with no movement) when a tab
      // comes back into view, which would otherwise stop the demo with nobody there. A real
      // visitor always moves. Also cancels a pending resume if they came straight back.
      onPointerMove={(e) => {
        if (e.pointerType === "mouse" && (!visitor || resumeTimer.current))
          visitorIn();
      }}
      onPointerLeave={(e) =>
        e.pointerType === "mouse" && visitorOut(RESUME_AFTER)
      }
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        visitorIn();
        visitorOut(RESUME_AFTER_TOUCH);
      }}
      onFocus={visitorIn}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          visitorOut(RESUME_AFTER);
      }}
    >
      <BarChart
        {...chart}
        highlight={playing ? demoBar : holdStill ? stillBar : null}
      />
      <img
        ref={cursorRef}
        className="bc-demo-cursor"
        src={assetUrl(cursorImg)}
        alt=""
        aria-hidden="true"
        style={{ width: 11.591, height: 18.2243 }}
        data-visible={playing || holdStill}
      />
    </div>
  );
}
