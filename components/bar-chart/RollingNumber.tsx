"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import "./RollingNumber.css";

/* ══ Rolling number ═══════════════════════════════════════
   Adapted from Bencho's "Rolling counter" — MIT licensed,
   bencho.dev/licence. Only the rolling digits are kept: no
   slab, no minus/plus buttons, no holding or dragging. The
   number comes from the `value` prop and rolls whenever it
   changes. Comments below are Bencho's unless marked
   "(bar chart)".

   Every digit is a strip of 0–9 behind a window, and changing
   the number rolls the strips to their new digits like an
   odometer.

   ── EACH COLUMN COUNTS, IT DOES NOT SHOW ───────────────
   A column's target is not its digit but the number of whole
   tens, hundreds… in the value: 1284 is 1284 for the ones
   column, 128 for the tens, 12 for the hundreds. So 9 → 10 is
   the ones column moving FORWARD one more step (9 → 0) and the
   tens moving forward one — never a strip running back down
   through eight digits to reach zero. The strip is 0–9 and a
   second 0, and where it sits is the count taken round ten.

   ── ONE SPRING PER COLUMN, AND THEY GO IN TURN ─────────
   A change reaches the ones first and each column to the left
   a little later — Stagger — so a carry reads as a carry,
   rippling up the number, rather than the whole row jumping. */

/* ── inlined from lab/spring ──────────────────────── */
/* ── one spring, for everything that settles ───────────────
   Frames, not milliseconds. `dt` is expressed in sixtieths of
   a second and the damping is RAISED to it rather than
   multiplied by it, so a dropped frame decays the same amount
   of energy as the two frames it replaced. Multiplying is the
   version that makes a spring behave differently on a busy
   page, which is the hardest kind of bug to see.

   The loop parks itself the moment the value has settled. */

/* 0..100 into the two numbers a spring actually has.

   Both ends have to be usable, which is what fixes the range:
   at 0 it is slow and heavy and still arrives, at 100 it is
   quick with a visible overshoot, and nowhere in between does
   it ring for longer than it takes to read. */
/* The pair is chosen by DAMPING RATIO and then written back
   as stiffness and decay, because the ratio is the thing a
   person is actually setting and the two numbers on their own
   do not say what they add up to.

     zeta = -ln(d) / (2 * sqrt(k))

   The first version of this ran 0.06..0.26 stiffness against
   0.93..0.74 decay, which reads as a sensible spread and is
   not one: it puts zeta between 0.15 and 0.16 across the
   WHOLE range, so every setting overshot by about sixty per
   cent and the knob only changed how fast it did it.

     0   → zeta ~0.85, heavy, arrives without a ring
     50  → zeta ~0.41
     100 → zeta ~0.20, lively, two visible rebounds

   Both ends shippable, which is the constraint that fixed the
   numbers rather than taste. */
const springOf = (tune: number) => ({
  /* stiffness: how hard it is pulled toward the target */
  k: 0.08 + (tune / 100) * 0.16,
  /* decay, per frame: how much of the velocity survives */
  d: 0.62 + (tune / 100) * 0.2,
});

/* Read once. A preference, not a live input. */
const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* (bar chart) up to 9,999,999; unused leading columns sit at width 0 */
const PLACES = 7;
const MAX = 10 ** PLACES - 1;
/* the window a digit is seen through — (bar chart) the headline's 40px line height */
const CELL = 40;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

type Col = {
  pos: number;
  vel: number;
  target: number;
  due: number[];
  next: number[];
};

export function RollingNumber({
  value,
  /* how lively a digit lands, 0..100 */
  bounce = 45,
  /* ms between one column moving and the next, 0..120 */
  stagger = 45,
  /* how much a spinning digit smears, 0..100 */
  blur = 50,
  className,
}: {
  value: number;
  bounce?: number;
  stagger?: number;
  blur?: number;
  className?: string;
}) {
  const v = clamp(Math.round(value), 0, MAX);
  const strips = useRef<(HTMLSpanElement | null)[]>([]);
  const cols = useRef<Col[]>(
    Array.from({ length: PLACES }, (_, p) => {
      const n = Math.floor(v / 10 ** p);
      return { pos: n, vel: 0, target: n, due: [], next: [] };
    }),
  );
  const raf = useRef(0);
  const knobs = useRef({ bounce, stagger, blur });
  const settled = useRef(v);

  /* ── paint ─────────────────────────────────────────────── */
  const paint = () => {
    cols.current.forEach((c, p) => {
      const el = strips.current[p];
      if (!el) return;
      const m = ((c.pos % 10) + 10) % 10;
      const smear =
        Math.min(3, Math.abs(c.vel) * 2.4) * (knobs.current.blur / 50);
      el.style.transform = `translateY(${-m * CELL}px)`;
      el.style.filter = smear > 0.15 ? `blur(${smear.toFixed(2)}px)` : "";
    });
  };

  const run = () => {
    if (raf.current) return;
    let prev = 0;
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1;
      prev = t;
      const { k, d } = springOf(knobs.current.bounce);
      const now = performance.now();
      let busy = false;
      for (const c of cols.current) {
        /* targets that have waited their turn */
        while (c.due.length && c.due[0] <= now) {
          c.due.shift();
          c.target = c.next.shift()!;
        }
        if (c.due.length) busy = true;
        /* a column far from home jumps most of the way in whole
           turns first — it looks the same, and a flick does not
           leave the ones column spinning for a second */
        const gap = c.target - c.pos;
        if (Math.abs(gap) > 24)
          c.pos += Math.round((gap - Math.sign(gap) * 24) / 10) * 10;
        c.vel += (c.target - c.pos) * k * dt;
        c.vel *= Math.pow(d, dt);
        c.pos += c.vel * dt;
        if (Math.abs(c.target - c.pos) < 0.004 && Math.abs(c.vel) < 0.004) {
          c.pos = c.target;
          c.vel = 0;
        } else busy = true;
      }
      paint();
      raf.current = busy ? requestAnimationFrame(tick) : 0;
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    knobs.current = { bounce, stagger, blur };
    paint();
  }, [bounce, stagger, blur]);

  /* (bar chart) place the strips before first paint, so nothing flashes "0" */

  useLayoutEffect(() => paint(), []);

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    [],
  );

  /* ── the one way the number changes ────────────────────── */
  /* (bar chart) Bencho's bump(), driven by the prop instead of the buttons */
  useEffect(() => {
    if (v === settled.current) return;
    settled.current = v;
    const still = stillness();
    const now = performance.now();
    cols.current.forEach((c, p) => {
      const to = Math.floor(v / 10 ** p);
      if (still) {
        c.pos = c.target = to;
        c.vel = 0;
        c.due = [];
        c.next = [];
        return;
      }
      c.due.push(now + p * knobs.current.stagger);
      c.next.push(to);
    });
    if (still) paint();
    else run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  const shown = Math.max(1, String(v).length);

  return (
    <span className={["rct", className].filter(Boolean).join(" ")}>
      {/* (bar chart) screen readers get the plain number, not ten digits per column */}
      <span className="rct-sr">{v.toLocaleString("en-US")}</span>
      <span
        className="rct-num"
        style={{ "--rct-cell": `${CELL}px` } as CSSProperties}
        aria-hidden="true"
      >
        {Array.from({ length: PLACES }, (_, i) => {
          const p = PLACES - 1 - i;
          return (
            <span key={p} className="rct-pair">
              <span className="rct-col" data-on={p < shown || undefined}>
                <span
                  className="rct-strip"
                  ref={(el) => {
                    strips.current[p] = el;
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
                    <span key={j}>{d}</span>
                  ))}
                </span>
              </span>
              {(p === 3 || p === 6) && (
                <span className="rct-sep" data-on={shown > p || undefined}>
                  ,
                </span>
              )}
            </span>
          );
        })}
      </span>
    </span>
  );
}
