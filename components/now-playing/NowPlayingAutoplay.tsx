"use client";

/* The cursor is the bar chart demo's, a small decorative SVG: next/image adds nothing here. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { assetUrl } from "@/components/bar-chart/asset";
import cursorImg from "@/components/bar-chart/icons/cursor.svg";
import { useReducedMotion } from "@/components/bar-chart/useReducedMotion";
import { NowPlaying } from "./NowPlaying";
import type { NowPlayingProps } from "./NowPlaying";
import "./NowPlayingAutoplay.css";

/**
 * One tap of the demo, named by what it should leave behind rather than by the button. A tap
 * that would change nothing (already playing, already open) is skipped, so after a visitor has
 * had a go the loop carries on from wherever they left the player.
 */
type Tap = "play" | "like" | "close" | "pause" | "open";
type Step = { tap: Tap; hold: number };

// The brief: from the card, play, like, then collapse into the bar. After that it pauses on the
// bar and opens the card again, so the next round's play is a play and not a pause. The like is
// undone while the card is folded, where the heart isn't drawn, so every round gets its beat.
const LOOP: Step[] = [
  { tap: "play", hold: 1700 },
  { tap: "like", hold: 1300 },
  { tap: "close", hold: 2600 }, // long enough to see the bar's title start to scroll
  { tap: "pause", hold: 900 },
  { tap: "open", hold: 1400 },
];

const FIRST_HOLD = 1200; // the card as it is, before the cursor sets off
const RESUME_AFTER = 1500; // ms after a visitor's mouse leaves before the demo carries on
const RESUME_AFTER_TOUCH = 5000; // touch has no "leave", so wait longer after the last tap
const VISIBLE_THRESHOLD = 0.3; // share of the player on screen before the demo plays
const SETTLE_MS = 160; // a beat on the target before pressing, as a hand lands
const PRESS_MS = 140; // the cursor's click
// Where the cursor waits before its first move, as fractions of the player's box: the card's
// lower right corner, clear of every control.
const REST = { x: 0.9, y: 0.9 };

type Point = { x: number; y: number };

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);
// A hand speeds up and slows down; distance sets the time, like a real pointer. The same feel as
// the bar chart's demo: its frame is drawn at a third of this one's scale, hence 2.4 for its 0.8.
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const travelMs = (distance: number) => clamp(300 + distance * 2.4, 320, 1100);

export interface NowPlayingAutoplayProps extends NowPlayingProps {
  autoplay?: boolean;
}

/**
 * The NowPlaying player playing itself, in the manner of BarChartAutoplay: a cursor taps play,
 * then the heart, then folds the card into the bar, and round again. Its taps are real clicks on
 * the player's own buttons, so nothing here knows the player's insides beyond what its ARIA
 * attributes say. A visitor's mouse, touch or keyboard takes over at once; the demo resumes
 * shortly after they leave. With reduced motion there is no cursor and the card holds still.
 */
export function NowPlayingAutoplay({
  autoplay = true,
  ...player
}: NowPlayingAutoplayProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLImageElement>(null);
  const pos = useRef<Point>({ x: 0, y: 0 });
  const run = useRef(0);
  const hovered = useRef<HTMLElement | null>(null);
  const pressing = useRef<HTMLElement | null>(null);
  const resumeTimer = useRef(0);

  // Both start the same on the server and the client, so the HTML matches; see useReducedMotion.
  const reduced = useReducedMotion();
  const [onScreen, setOnScreen] = useState(false);
  const [visitor, setVisitor] = useState(false);
  const playing = autoplay && onScreen && !visitor && !reduced;

  /* ── reading the player ──────────────────────────────────── */
  const q = (selector: string) =>
    wrapRef.current?.querySelector<HTMLElement>(selector) ?? null;
  const isOpen = () =>
    q(".snd-tap")?.getAttribute("aria-expanded") === "true";
  const isOn = (selector: string) =>
    q(selector)?.getAttribute("aria-pressed") === "true";

  /** What a tap would press and where to aim, or null when it would change nothing. */
  const plan = (tap: Tap) => {
    const open = isOpen();
    const lead = q(".snd-op[data-lead]");
    const like = q(".snd-like");
    const fold = q(".snd-tap");
    const art = q(".snd-art");
    const on = isOn(".snd-op[data-lead]");
    switch (tap) {
      case "play":
      case "pause":
        return lead && on === (tap === "pause")
          ? { el: lead, aim: lead, hover: true }
          : null;
      case "like":
        return like && open && !isOn(".snd-like")
          ? { el: like, aim: like, hover: true }
          : null;
      case "close":
      case "open":
        // The hit area is invisible, so aim at the sleeve it covers.
        return fold && art && open === (tap === "close")
          ? { el: fold, aim: art, hover: false }
          : null;
    }
  };

  /* ── geometry, relative to the wrapper ───────────────────── */
  // In the wrapper's own (unscaled) pixels: the hero tile scales the whole frame, which scales
  // on-screen rects but not the cursor's translate, so divide the scale back out.
  const pointOn = (el: Element): Point => {
    const wrap = wrapRef.current!;
    const w = wrap.getBoundingClientRect();
    const k = w.width / wrap.offsetWidth || 1;
    const r = el.getBoundingClientRect();
    // Just right of and below centre, where a hand's tip lands rather than a bullseye.
    return {
      x: (r.left - w.left + r.width / 2) / k + 2,
      y: (r.top - w.top + r.height / 2) / k + 3,
    };
  };
  const restPoint = (): Point => {
    const wrap = wrapRef.current;
    return {
      x: (wrap?.offsetWidth ?? 260) * REST.x,
      y: (wrap?.offsetHeight ?? 189) * REST.y,
    };
  };
  const place = (p: Point) => {
    pos.current = p;
    // `translate`, not `transform`, so the click's scale shrinks the arrow around its own tip.
    if (cursorRef.current) cursorRef.current.style.translate = `${p.x}px ${p.y}px`;
  };
  const hover = (el: HTMLElement | null) => {
    if (hovered.current === el) return;
    hovered.current?.removeAttribute("data-hover");
    el?.setAttribute("data-hover", "");
    hovered.current = el;
  };
  const release = () => {
    pressing.current?.removeAttribute("data-press");
    pressing.current = null;
    delete cursorRef.current?.dataset.press;
  };

  // Play only while the player is on screen: the strip draws four of them.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setOnScreen(e.isIntersecting),
      { threshold: VISIBLE_THRESHOLD },
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
        const ms = travelMs(Math.hypot(to.x - from.x, to.y - from.y));
        const t0 = performance.now();
        const frame = (t: number) => {
          if (!alive()) return resolve(false);
          const k = Math.min(1, (t - t0) / ms);
          const e = easeInOut(k);
          place({
            x: from.x + (to.x - from.x) * e,
            y: from.y + (to.y - from.y) * e,
          });
          if (k < 1) requestAnimationFrame(frame);
          else resolve(true);
        };
        requestAnimationFrame(frame);
      });
    /** Press, hold for a click's length, then let go — which is when a click lands. */
    const press = async (el: HTMLElement) => {
      pressing.current = el;
      el.setAttribute("data-press", "");
      if (cursorRef.current) cursorRef.current.dataset.press = "";
      const ok = await sleep(PRESS_MS);
      release();
      if (ok) el.click();
      return ok;
    };

    // Fade in at rest, let the card be seen as it is, then start.
    place(restPoint());
    (async () => {
      if (!(await sleep(FIRST_HOLD))) return;
      for (let s = 0; ; s++) {
        const step = LOOP[s % LOOP.length];
        // Undo the like while the heart can't be seen, just before the card opens again.
        if (step.tap === "open" && !isOpen() && isOn(".snd-like"))
          q(".snd-like")?.click();
        const target = plan(step.tap);
        if (!target) {
          // Nothing to do (a zero-length sleep keeps an all-skipped round from freezing the page).
          if (!(await sleep(0))) return;
          continue;
        }
        hover(null);
        if (!(await moveTo(pointOn(target.aim)))) return;
        if (target.hover) hover(target.el);
        if (!(await sleep(SETTLE_MS))) return;
        if (!(await press(target.el))) return;
        if (!(await sleep(step.hold))) return;
      }
    })();

    return () => {
      // Bumping the run id is the cancel signal for the loop above; the latest value is intended.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      run.current++;
      hover(null);
      release();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* ── a visitor takes over ────────────────────────────────── */
  useEffect(() => {
    const timer = resumeTimer; // the latest pending resume, cleared on unmount
    return () => clearTimeout(timer.current);
  }, []);
  const visitorIn = () => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = 0;
    setVisitor(true);
  };
  const visitorOut = (after: number) => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      resumeTimer.current = 0;
      setVisitor(false);
    }, after);
  };

  return (
    <div
      ref={wrapRef}
      className="snd-autoplay"
      // Movement, not entry, for the same stale-hover reason as the strip and the chart: Safari
      // replays a pointerenter with no movement when a tab comes back into view.
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
      <NowPlaying {...player} />
      <img
        ref={cursorRef}
        className="snd-demo-cursor"
        src={assetUrl(cursorImg)}
        alt=""
        aria-hidden="true"
        style={{ width: 11.591, height: 18.2243 }}
        data-visible={playing}
      />
    </div>
  );
}
