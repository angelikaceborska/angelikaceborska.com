"use client";

/* NowPlaying — a now-playing bar that opens into a player card.
   Figma: Portfolio › Assets › NowPlaying (829:843). */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Heart, SkipBack, SkipForward } from "lucide-react";
import "./NowPlaying.css";

/* ── how fast the shape changes, as one number ─────────────
   The `morph` prop runs 0..100 and 50 is the tuned speed, so
   the default is the middle rather than a number somebody has
   to remember. Both ends stay usable: 0 is a little over half
   again as slow, 100 is two and a half times as fast. */
const rate = (speed: number) => 1.6 - (speed / 100) * 1.2;

/* Reduced motion, read on render: a preference, not a live
   input. */
const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* Three episodes, from the portfolio's Figma (NowPlaying,
   829:843) — State=Previous, Current and Next. The arrows step
   through them and wrap at either end, and it opens on the
   middle one, as the Figma tile does. The covers are the Figma
   artwork cropped square at 256px: the sleeve is never drawn
   wider than about 150 device pixels, even on the largest hero
   tile. */
const TRACKS = [
  {
    title: "Tech stocks are carrying the market again today",
    by: "Business",
    cover: "/now-playing/business.jpg",
  },
  {
    title: "The endless cycle of history in Nolan’s Odyssey ending",
    by: "Culture",
    cover: "/now-playing/culture.jpg",
  },
  {
    title: "Democrats debate direction after sweeping midterm wins",
    by: "Politics",
    cover: "/now-playing/politics.jpg",
  },
] as const;
const FIRST = 1;
/* Where every episode starts: 0:52, as all six variants draw it.
   Each keeps its own place after that, the way a podcast app
   resumes an episode, so skipping away and back does not lose
   it — and a skip lands on the frame Figma drew rather than on
   an empty rail. */
const START = 52;

/* ══ NowPlaying ═══════════════════════════════════════════
   A now-playing bar that opens into a player.

   ONE NUMBER IS THE STATE. A single tween runs 0 → 1, and
   every position, size, radius and type size below is read
   off it. Nothing has a transition of its own and nothing is
   on a clock — which is the whole reason the change reads as
   one object changing rather than as several elements that
   were told to move at the same time. With eight CSS
   transitions there are eight chances for one of them to
   arrive early; with one tween there are none.

   THE COVER IS THE HINGE. It is the only thing on the bar
   big enough to be recognised, so it is the thing the eye
   tracks, and it never disappears or crossfades while the
   shape changes — it grows from a 40px square on the bar to a
   64px square on the card. Everything else takes its lead
   from where the cover went.

   The width never changes. A bar that also got wider would
   be growing in two directions at once, and the second one
   adds nothing: what a player does when it opens is show you
   more, downward. Holding the width still also means the
   right-hand controls only have to travel, not resize and
   travel — they slide in from the end of the bar and settle
   into a row under the art. */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── eased, NOT sprung ─────────────────────────────────────
   A spring is the wrong tool here, and the reason is the
   corner. A spring past its target takes every value derived
   from it along, so the radius would dip under its own end
   value and come back. That is a wobble, not a bounce.

   So: a curve that is quick off the mark and lands without
   ever passing the number it is going to. Quart-out is
   cubic-bezier(0.22, 1, 0.36, 1) in all but name, the same
   curve the hero's bar chart moves on.

   It reads its start from wherever it currently IS, so
   pressing again mid-flight turns the object around rather
   than snapping it to an end it never reached. */
const BASE = 460;

const QUART = (t: number) => 1 - (1 - t) ** 4;
/* the swell's clock — see the note where it is used */
const FLAT = (t: number) => t;
/* in AND out, for the one thing here that is a round trip
   between two shapes rather than an arrival at one */
const SWING = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

function useTween(to: number, ms: number, instant = false, ease = QUART) {
  const [at, setAt] = useState(to);
  const cur = useRef(to);
  const raf = useRef(0);

  /* Reduced motion lands at once. Set while rendering rather
     than from the effect, which is React's own pattern for state
     that follows a prop, and keeps react-hooks/set-state-in-effect
     quiet without a suppression. */
  if (instant && at !== to) setAt(to);

  useEffect(() => {
    if (instant) {
      cur.current = to;
      return;
    }
    const from = cur.current;
    if (from === to) return;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      cur.current = from + (to - from) * ease(t);
      setAt(cur.current);
      raf.current = t < 1 ? requestAnimationFrame(step) : 0;
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [to, ms, instant, ease]);

  return at;
}

/* One width for both states, and the frame's width too. */
const W = 260;
/* The bar, and the card. The component's own frame is sized
   to the CARD, so the box grows inside a frame that never
   changes size, and whatever lays the component out never
   has to re-fit it mid-morph. */
/* 78: the track needs a band of its own at the foot. Any
   shorter and it crowds the sleeve rather than reading as a
   line of its own. */
const SHUT = 78;
/* ── the card is the bar, grown ────────────────────────────
   The arrangement is the same at both ends: sleeve left,
   words beside it, and the only thing that MOVES between the
   two is the transport — from the end of the row down to the
   middle, which is the one change worth reading. Everything
   else simply gets bigger. A different layout at the far end
   would have the words travelling while the cover moves and
   grows, which is a transition you watch rather than an
   object you opened.

   Its HEIGHT is declared under the stack it falls out of. */

/* ── ONE margin, both states ───────────────────────────────
   Not one per state: a margin that changed would slide the
   sleeve, the track and the transport inward as the thing
   opened — a fourth motion on top of the three that are the
   point. The object grows; its frame does not move.

   Everything answers to it: the sleeve's inset, the rail's
   inset, where the transport row ends, and the room under it.

   The sleeve is square, so one number is its width and its
   height at each end — and on the card it is the number the
   whole stack below is measured from. */
const PAD = 10;
const ART = { s: [40, 64] } as const;

/* ── the two corners, and they are CONCENTRIC ──────────────
   The box's radius is the sleeve's plus the margin between
   them. That is not a preference, it is what makes a corner
   hug what is inside it: two curves offset by a constant
   distance stay parallel, and any other pair pinches at 45°.
   The card's 26 = 16 + 10 hugs its sleeve, and the bar's
   20 = 10 + 10 does the same at its own size.

   The `corner` prop sets the SLEEVE, and the box is derived
   from it — `sleeve + PAD` — so the two corners stay
   concentric at every value and no setting pinches.

   It runs to 32 and stops there because that is where the
   64px sleeve becomes a circle; there is nothing past it but
   the same shape with a bigger number. The bar's sleeve
   scales by the ratio of the two squares, so it reaches its
   own circle at exactly the same value. */
const CORNER = 16;
const CORNER_MAX = 32;

/* ── the card's stack, measured from the sleeve down ───────
   Each gap is the distance from the thing above it, and the
   card's HEIGHT falls out of the sum rather than being a
   number somebody kept in step by hand. Change the sleeve and
   the rail, the times, the transport and the foot all follow.

   The bar needs none of this: it is one row and a track, and
   both are placed off the same margin. */
const RAIL_GAP = 22;
const CLOCK_GAP = 8;   /* also .snd-bar's own gap */
const OPS_GAP = 16;
const RAIL_H = 3;
const CLOCK_H = 10;
const LEAD = 46;       /* the play button, opened */

const RAIL_Y = PAD + ART.s[1] + RAIL_GAP;
const OPS_Y = RAIL_Y + RAIL_H + CLOCK_GAP + CLOCK_H + OPS_GAP + LEAD / 2;
/* the transport's own bottom, and one more margin under it */
const OPEN = Math.round(OPS_Y + LEAD / 2 + PAD);

const TOTAL = 214;

/* ── the play mark is DRAWN, not swapped ───────────────────
   Two icons exchanged is a cut, however short you make the
   crossfade, and a transport button is the one control here
   you press more than once — a cut you see forty times is the
   thing you end up looking at.

   So both marks are the SAME two quadrilaterals, and the
   difference between them is where eight points are. The
   pause is a pair of bars; the play is that pair with the
   inner edges pulled to the middle and collapsed to a point,
   which is a triangle split down its own axis. Nothing
   appears and nothing leaves — the shapes are continuous the
   whole way, so there is no frame where the button is
   ambiguous about what it does.

   The points are lucide's own, so it sits at the same weight
   as the skip glyphs beside it: bars at x 6..10 and 14..18,
   a triangle from 6.5 to 20, stroked 2 with a round join,
   which is where the softened corners come from.

   Wound the same way in both — top-left, top-right,
   bottom-right, bottom-left — or the halves would turn
   inside out on the way across. The play's right half is a
   triangle written as a quad with its two right points on
   top of each other. */
const PAUSE_L = [6, 4, 10, 4, 10, 20, 6, 20] as const;
const PLAY_L = [6.5, 4, 13.25, 8, 13.25, 16, 6.5, 20] as const;
const PAUSE_R = [14, 4, 18, 4, 18, 20, 14, 20] as const;
const PLAY_R = [13.25, 8, 20, 12, 20, 12, 13.25, 16] as const;

const quad = (a: readonly number[], b: readonly number[], t: number) => {
  let d = "";
  for (let i = 0; i < 8; i += 2)
    d += `${i ? "L" : "M"}${mix(a[i], b[i], t).toFixed(2)} ${mix(
      a[i + 1],
      b[i + 1],
      t,
    ).toFixed(2)}`;
  return `${d}Z`;
};

export function Mark({
  playing,
  size,
  still,
}: {
  playing: boolean;
  size: number;
  still: boolean;
}) {
  /* 0 is the pause, 1 is the play. Eased both ends, unlike
     the box's own move: this one leaves a shape as well as
     arriving at one, and a curve that only softens the
     landing snaps out of the shape it was. */
  const t = useTween(playing ? 0 : 1, 300, still, SWING);

  /* ── the goo ─────────────────────────────────────────────
     Zero at both ends and one in the middle, so everything
     below is a bulge on the way rather than a difference
     between the two states — press twice and it lands on
     exactly what it started as.

     Three things ride it, and they are all the same idea:
     the mark squashes across as it stretches up, the two
     halves lean into each other until they touch, and the
     whole thing tips a few degrees and comes back level. A
     shape that changes size without ever changing volume is
     what makes something read as soft rather than as
     redrawn. The tilt swaps sign with the direction, so
     pausing is not just playing run backwards. */
  const goo = Math.sin(clamp(t, 0, 1) * Math.PI);
  const pull = 1.6 * goo;
  const tip = (playing ? -9 : 9) * goo;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      strokeLinecap="round"
      /* per cent, not pixels: this is the element's own box
         and the box is whatever size the morph is at. */
      style={{
        transformOrigin: "50% 50%",
        transform: `rotate(${tip}deg) scale(${1 - 0.13 * goo}, ${1 + 0.11 * goo})`,
      }}
    >
      <path d={quad(PAUSE_L, PLAY_L, t)} transform={`translate(${pull} 0)`} />
      <path d={quad(PAUSE_R, PLAY_R, t)} transform={`translate(${-pull} 0)`} />
    </svg>
  );
}

/* the heart's box, and the room the words give up for it */
const LIKE = 30;

/* ── the title's scroll, as numbers ────────────────────────
   From the portfolio's Figma, which clips the title rather than
   truncating it and lays a 33px fade over the edge. The holds
   are the brief: a second at the start, so the title is read as
   it is before it moves, and half a second at the far end. PACE
   is a constant speed, so a longer title takes longer rather
   than moving faster — 35, down from 60 and then 45, both of
   which read as a little hurried. The travel eases in and out
   the same way, so the way back is the way out run in reverse. */
const HOLD_START = 1000;
const HOLD_END = 500;
const PACE = 35; /* px a second */
const MIN_TRAVEL = 600;
const FADE = 33;
const SWAY = "cubic-bezier(0.37, 0, 0.63, 1)";
const SETTLE = "cubic-bezier(0.22, 1, 0.36, 1)";

const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export interface NowPlayingProps {
  morph?: number;
  corner?: number;
  focusable?: boolean;
  defaultOpen?: boolean;
}

export function NowPlaying({
  /* how quickly the shape changes, 0..100 — 50 is the tuned
     460ms, and neither end is broken: 736 reads as deliberate
     and 184 as brisk. */
  morph = 50,
  /* the sleeve's corner on the card, 0..32, and the box's
     corner follows it — see the note above */
  corner = CORNER,
  /* false where the player is drawn more than once — the hero
     strip renders four copies — so the page does not get four
     sets of tab stops for one control */
  focusable = true,
  /* open as the card from the first paint — the hero's demo
     starts there */
  defaultOpen = false,
}: NowPlayingProps = {}) {
  const skin = useRef<HTMLDivElement | null>(null);
  const titleBox = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [going, setGoing] = useState(false);
  /* which episode, and which way the last skip went: the new
     sleeve and words come in from that side */
  const [track, setTrack] = useState(FIRST);
  const [skip, setSkip] = useState<"next" | "prev" | null>(null);
  /* the cover on its way out, while it is still in the window,
     and a count of skips, so every skip mounts a fresh pair */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [hop, setHop] = useState(0);
  /* each episode keeps its own place and its own heart */
  const [marks, setMarks] = useState<number[]>(() => TRACKS.map(() => START));
  const [likes, setLikes] = useState<boolean[]>(() => TRACKS.map(() => false));
  const now = TRACKS[track];
  const at = marks[track];
  const liked = likes[track];
  const tab = focusable ? undefined : -1;
  const still = stillness();

  const dur = BASE * rate(clamp(morph, 0, 100));

  /* the sleeve's corner at each end, and the box's from it.
     The bar's sleeve is the smaller square, so it takes the
     same fraction of its own side — a 16 on a 64 and a 10 on
     a 40 are the same corner at two sizes. */
  const cr = clamp(corner, 0, CORNER_MAX);
  const artR = [(cr * ART.s[0]) / ART.s[1], cr] as const;

  /* ── the offset FADES IN, it is not a constant ───────────
     `outer = inner + margin` is the right rule for a corner
     hugging what is inside it, but applied flat it would put
     ten pixels of offset on every corner, including none: a
     perfectly sharp picture inside a card that is still
     visibly rounded — geometrically concentric and, to look
     at, two different decisions in the same object. At radius
     zero there is no curve to stay parallel to.

     So the offset is scaled by the corner, and reaches its
     full ten at the default. Below that the two corners
     converge until they are both square together; above it the
     rule takes over, which is where it earns its keep — a
     mismatch at 32 pinches, a mismatch at 2 is just a card
     that did not follow.

     At the default of 16 the offset is exactly 10, and at 32
     it is capped there. */
  const off = PAD * Math.min(1, cr / CORNER);
  const boxR = [artR[0] + off, artR[1] + off] as const;

  /* 0 shut, 1 open. Tweened once, read everywhere. */
  const p = useTween(open ? 1 : 0, dur, still);

  /* ── the swell, and why it is a SECOND number ────────────
     The bounce is not put into `p` (see "eased, NOT sprung"
     above): a value past its target takes everything derived
     from it along, and what is derived here is the corner. So
     `p` stays monotonic and the composition stays internally
     consistent at every frame — the sleeve, the box and the
     margin between them are always in the ratio that makes the
     corners concentric.

     What bounces is the whole object, uniformly. A scale
     takes the box, the sleeve, the corners and the type
     together, so nothing can get out of step with anything
     else: it is the same picture, briefly smaller. All the
     life, none of the wobble.

     It rides its own LINEAR clock rather than `p`, because
     `p` is quart-out and near its end for most of the move —
     a swell read off it would spike in the first two frames
     and be flat for the rest. And the peak is pushed late
     (^1.5 puts it at 0.63) so the object gathers on the way
     and releases as it lands, which is what reads as a
     bounce rather than as a pulse.

     Zero at BOTH ends by construction, so it costs the
     resting shape nothing — sin(0) and sin(π) are the same
     number.

     ── ON THE CLOSE ONLY ────────────────────────────────────
     Opening already HAS its event: the box goes from 78 to 189
     and that is the whole thing you are meant to watch. A
     scale on top of it would be a second size change running
     at the same time in the same direction, and two of those
     do not add up to more life — they read as the card being
     unsure how big it is.

     Closing is the opposite problem. The card collapses into
     a bar and most of it simply stops existing, so there is
     nothing to watch except the disappearance. The dip gives
     it a gather to go with it — the object pulls in on itself
     before it lands — and because it is subtractive it is
     working WITH the shrink rather than against it.

     An object coming towards you and one folding away are not
     the same move run backwards. */
  const u = useTween(open ? 1 : 0, dur, still, FLAT);
  const swell = Math.sin(Math.PI * clamp(u, 0, 1) ** 1.5);
  const zoom = open ? 1 : 1 - 0.035 * swell;

  /* ── the clock ───────────────────────────────────────────
     Nothing moves until somebody presses play, which is the
     difference between a component and a screensaver. It is
     also why the hero can draw four of these: at rest this
     component has no timer at all. */
  useEffect(() => {
    if (!going) return;
    const id = window.setInterval(
      () =>
        setMarks((m) =>
          m.map((s, i) => (i !== track ? s : s >= TOTAL ? 0 : s + 1)),
        ),
      1000,
    );
    return () => window.clearInterval(id);
  }, [going, track]);

  /* The other sleeves, fetched ahead, so a skip never shows the
     gradient ground while a cover decodes. Three small files,
     once; the browser shares them between copies. */
  useEffect(() => {
    TRACKS.forEach((t) => {
      new Image().src = t.cover;
    });
  }, []);

  const step = (dir: 1 | -1) => {
    setSkip(dir > 0 ? "next" : "prev");
    setLeaving(track);
    setHop((h) => h + 1);
    setTrack((track + dir + TRACKS.length) % TRACKS.length);
  };

  /* ── outside closes it ───────────────────────────────────
     Only while it is open, and only for a press that started
     outside the box. `pointerdown` rather than click: a press
     that begins outside and drifts in is still somebody
     reaching past this component, and waiting for the click
     lets it land on whatever is underneath first.

     Bound on the document because the player has no idea what
     is around it, and nothing around it should have to know
     it can be open. */
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      /* ── isTrusted ─────────────────────────────────────────
         Scripted pointer events — a demo driving something on
         the page — bubble to the document like any other, and
         would read as somebody reaching past this player. Only
         a real hand dismisses it. */
      if (!e.isTrusted) return;
      const el = skin.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    /* the next tick, or the press that opened it closes it */
    const id = window.setTimeout(
      () => document.addEventListener("pointerdown", away),
      0,
    );
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("pointerdown", away);
    };
  }, [open]);

  /* ── the title reads itself out ──────────────────────────
     A title that does not fit is clipped, not cut short, and
     after HOLD_START it scrolls left until its last letter
     reaches the edge, holds for HOLD_END, and comes back the
     same way — then again, for as long as it is there. One
     fade per side: the left one grows in as the text slides
     under it and the right one clears as the end arrives, so
     the far end of the scroll is the start in a mirror.

     Only while the shape is at REST. The morph changes the
     title's width and its size every frame, so the distance is
     measured once the shape has landed, and a scroll that is
     under way when the shape starts to move folds back to the
     start rather than being cut.

     The Web Animations API rather than a stylesheet, because
     the distance — and so the timing — belongs to each title.
     Transform and opacity only, which the compositor runs on
     its own (Safari included: a transform, not the `translate`
     property), and inside no rounded clip: none of this wakes
     React or a repaint once a frame, which matters on a strip
     that draws four copies. */
  const rest = p === 0 || p === 1;
  useLayoutEffect(() => {
    const box = titleBox.current;
    const clip = box?.querySelector<HTMLElement>(".snd-title-clip");
    const run = box?.querySelector<HTMLElement>(".snd-title-run");
    const fadeL = box?.querySelector<HTMLElement>('.snd-fade[data-side="left"]');
    const fadeR = box?.querySelector<HTMLElement>('.snd-fade[data-side="right"]');
    if (!box || !clip || !run || !fadeL || !fadeR) return;
    let anims: Animation[] = [];
    let dead = false;

    const start = () => {
      if (dead) return;
      anims.forEach((a) => a.cancel());
      anims = [];
      const over = clip.scrollWidth - clip.clientWidth;
      box.toggleAttribute("data-overflow", over > 0);
      if (over <= 0 || !rest || still) return;

      const travel = Math.max(MIN_TRAVEL, (over / PACE) * 1000);
      const total = HOLD_START + travel + HOLD_END + travel;
      const at = (ms: number) => ms / total;
      const out = HOLD_START; /* leaves the start */
      const far = HOLD_START + travel; /* reaches the end */
      const back = far + HOLD_END; /* leaves the end */
      /* How far into a travel the hidden part of the title is a
         fade wide. The travel is an ease-in-out, close enough to
         (1 - cos πt) / 2 to solve for t; the fades ride that, so
         each one is opaque exactly when there is text under it. */
      const edge =
        (Math.acos(1 - 2 * Math.min(1, FADE / over)) / Math.PI) * travel;
      const timing = { duration: total, iterations: Infinity };

      anims = [
        run.animate(
          [
            { offset: 0, transform: "translateX(0px)" },
            { offset: at(out), transform: "translateX(0px)", easing: SWAY },
            { offset: at(far), transform: `translateX(${-over}px)` },
            { offset: at(back), transform: `translateX(${-over}px)`, easing: SWAY },
            { offset: 1, transform: "translateX(0px)" },
          ],
          timing,
        ),
        fadeL.animate(
          [
            { offset: 0, opacity: 0 },
            { offset: at(out), opacity: 0 },
            { offset: at(out + edge), opacity: 1 },
            { offset: at(total - edge), opacity: 1 },
            { offset: 1, opacity: 0 },
          ],
          timing,
        ),
        fadeR.animate(
          [
            { offset: 0, opacity: 1 },
            { offset: at(far - edge), opacity: 1 },
            { offset: at(far), opacity: 0 },
            { offset: at(back), opacity: 0 },
            { offset: at(back + edge), opacity: 1 },
            { offset: 1, opacity: 1 },
          ],
          timing,
        ),
      ];
    };

    start();
    /* Once more when the font arrives, if it has not yet: the
       fallback face is a different width, and so is the
       distance. */
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(start);
    }

    return () => {
      dead = true;
      /* fold back from wherever the scroll had got to */
      const from = getComputedStyle(run).transform;
      const fl = getComputedStyle(fadeL).opacity;
      const fr = getComputedStyle(fadeR).opacity;
      anims.forEach((a) => a.cancel());
      if (!run.isConnected || still || from === "none") return;
      const fold = { duration: 240, easing: SETTLE };
      run.animate([{ transform: from }, { transform: "translateX(0px)" }], fold);
      fadeL.animate([{ opacity: fl }, { opacity: 0 }], fold);
      fadeR.animate(
        [{ opacity: fr }, { opacity: getComputedStyle(fadeR).opacity }],
        fold,
      );
    };
  }, [track, rest, still]);

  const art = {
    x: PAD,
    /* At the margin in both states rather than centred in the
       bar: the bar is not symmetric top to bottom, because the
       track has a band of its own down there. The sleeve, the
       words and the transport are one row against the top
       margin; everything below them belongs to the track. */
    y: PAD,
    s: mix(ART.s[0], ART.s[1], p),
  };

  /* Everything below is derived, never stored. A second piece
     of state describing the same transformation is a second
     thing that can be out of step with the first. */
  const h = mix(SHUT, OPEN, p);

  /* ── the transport, at both ends ─────────────────────────
     All three buttons exist in both states. Shut they are
     smaller and close together — 24, 30, 24 — and the row is
     pinned to the right so the play button lands where a thumb
     goes without looking. Open they spread and the play grows.

     Placed by the row's CENTRE, because the row's own width
     changes: an edge would move even in the frames where the
     middle of it did not. */
  const side = mix(24, 34, p);
  const lead = mix(30, LEAD, p);
  /* 5 apart on the bar, not touching: three controls touching
     read as one object with three parts rather than as three
     things you press */
  const gap = mix(5, 14, p);
  /* the box, less its margin and half of the 88 the row is
     when shut */
  const opsX = mix(W - PAD - 44, W / 2, p);
  /* level with the sleeve on the bar, and under everything on
     the card, clear of the times under the rail */
  const opsY = mix(PAD + ART.s[0] / 2, OPS_Y, p);

  /* the deep half of the morph, for the things that only
     exist in the card. Held back to the last 40% so they
     arrive into a shape that has stopped growing rather than
     sliding about inside one that has not. */
  const late = clamp((p - 0.6) / 0.4, 0, 1);

  const flip = () => {
    setOpen((v) => !v);
  };

  return (
    /* data-stroke switches on the box's hairline (see .snd-box
       in the stylesheet) */
    <div className="snd" data-stroke="on" style={{ width: W, height: OPEN }}>
      <div
        className="snd-box"
        ref={skin}
        data-open={open || undefined}
        style={{
          width: W,
          height: h,
          borderRadius: mix(boxR[0], boxR[1], p),
          scale: zoom,
        }}
      >
        {/* ── the sleeve is a WINDOW, and the covers page ──────
            Spotify's player at the size of a sleeve: a skip
            pushes the cover out of the side it leaves by and
            brings the next one in from the other, the two moving
            as one strip with a gap between them. The window is
            the sleeve's own square, so nothing travels across
            the words. A track change, not the morph: the hinge
            still never crossfades while the shape moves.

            Two covers only while a skip is in flight. The one
            leaving unmounts when its animation ends, and is
            never drawn under reduced motion. */}
        <span
          className="snd-art"
          data-paging={(leaving !== null && !still) || undefined}
          aria-hidden="true"
          style={{
            left: art.x,
            top: art.y,
            width: art.s,
            height: art.s,
            /* Squared, and near enough constant: the sleeve
               belongs to the same family as the box around it,
               and a disc inside a rounded rectangle is a
               different object. */
            borderRadius: mix(artR[0], artR[1], p),
          }}
        >
          {leaving !== null && !still && (
            <span
              key={`out-${hop}`}
              className="snd-cover"
              data-leave={skip || undefined}
              style={{ backgroundImage: `url(${TRACKS[leaving].cover})` }}
              onAnimationEnd={() => setLeaving(null)}
            />
          )}
          <span
            key={`in-${hop}`}
            className="snd-cover"
            data-skip={skip || undefined}
            style={{ backgroundImage: `url(${now.cover})` }}
          />
        </span>

        <span
          key={`say-${track}`}
          className="snd-say"
          data-skip={skip || undefined}
          style={{
            /* beside the sleeve at BOTH ends — the gap grows
               with everything else and nothing reflows */
            left: mix(PAD + ART.s[0] + 10, PAD + ART.s[1] + 10, p),
            /* Level with the sleeve, and centred BY it: same
               top, same height, and the words centre themselves
               inside that, so the two are level at every size
               the morph passes through — see the note in the
               stylesheet. */
            top: PAD,
            height: art.s,
            /* what is left between the sleeve and the row, less
               the heart on the card, which lives in the corner
               the words would otherwise run into. On the bar
               there is no heart and nothing to give up. */
            width: mix(94, W - PAD - (PAD + ART.s[1] + 10) - (LIKE + 10), p),
          }}
        >
          {/* 16 and 13 on the card, per the portfolio's Figma
              (State=Current, Type=Card) */}
          {/* Clipped, not truncated: the whole title runs inside
              the clip and scrolls when it does not fit (the effect
              above). The fades are the Figma "Fade", one for each
              side, and they sit OUTSIDE the clip, overhanging it —
              see the stylesheet for why. */}
          <span
            className="snd-title"
            ref={titleBox}
            style={{ fontSize: mix(13, 16, p) }}
          >
            <span className="snd-title-clip">
              <span className="snd-title-run">{now.title}</span>
            </span>
            <span className="snd-fade" data-side="left" aria-hidden="true" />
            <span className="snd-fade" data-side="right" aria-hidden="true" />
          </span>
          <span className="snd-by" style={{ fontSize: mix(11, 13, p) }}>
            {now.by}
          </span>
        </span>

        {/* ── the track ─────────────────────────────────────
            On the bar too, along the foot, edge to edge — a bar
            with no sense of how far through it is is missing the
            one thing a bar is for.

            The TIMES are the part that only belongs to the
            card. They fade in with the deep half of the move and
            are fully transparent until then, so they cost the
            bar nothing. */}
        <span
          className="snd-bar"
          style={{
            /* Off the edge on the bar too, inset by the same
               margin as everything else: a line flush with the
               foot belongs to the box's edge, like a loading
               bar, and a track belongs to the thing playing. */
            top: mix(SHUT - PAD - RAIL_H, RAIL_Y, p),
            /* one margin, so the track's ends never move */
            left: PAD,
            width: W - PAD * 2,
          }}
        >
          <span className="snd-rail">
            <span className="snd-run" style={{ width: `${(at / TOTAL) * 100}%` }} />
          </span>
          <span className="snd-clock" style={{ opacity: late }}>
            <span>{clock(at)}</span>
            <span>−{clock(TOTAL - at)}</span>
          </span>
        </span>

        {/* ── the one thing you press to change shape ───────
            Invisible, and it is the WHOLE bar when shut — the
            track's band at the foot is part of the object, and
            a bar that only answers along the row its sleeve is
            in has a dead third nobody can see the edge of.

            Opened, it is the sleeve and the words only, so a
            player you have opened does not collapse because
            you reached for the title.

            Declared BEFORE the transport on purpose: both are
            positioned, so the later one paints on top, and the
            buttons have to win a press that lands on both. */}
        <button
          className="snd-tap"
          onClick={flip}
          tabIndex={tab}
          aria-expanded={open}
          aria-label={open ? "Collapse the player" : "Open the player"}
          style={{
            left: mix(0, PAD, p),
            top: mix(0, PAD, p),
            width: mix(W, W - PAD * 2, p),
            /* every pixel of the bar, and the sleeve's own
               height once it is a card */
            height: mix(SHUT, ART.s[1], p),
            borderRadius: mix(boxR[0], artR[1], p),
          }}
        />

        {/* ── the heart ─────────────────────────────────────
            The card's one control that is not transport, and
            the only reason the card has a top-right corner
            worth anything: everything else here is a row.

            It belongs to the card alone. On the bar there is
            no room for a fourth control beside the transport,
            and a heart is not what a bar is for — so it rides
            `late`, arriving after the box has stopped growing,
            and takes its hit area with it rather than sitting
            invisible over the words.

            After the tap, like the transport, so a press in
            the corner reaches the heart rather than closing
            the player underneath it. */}
        <button
          className="snd-like"
          data-on={liked || undefined}
          onClick={() => {
            setLikes((l) => l.map((v, i) => (i === track ? !v : v)));
          }}
          aria-label={liked ? "Remove from liked episodes" : "Add to liked episodes"}
          aria-pressed={liked}
          tabIndex={focusable && open ? 0 : -1}
          style={{
            left: W - PAD - LIKE,
            top: PAD,
            width: LIKE,
            height: LIKE,
            opacity: late,
            pointerEvents: late > 0.9 ? "auto" : "none",
          }}
        >
          <Heart size={16} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
        </button>

        <span
          className="snd-ops"
          style={{ left: opsX, top: opsY, gap }}
        >
          {/* DRAWN, not filled — unlike the play. Three solid
              marks in a short row is a lot of ink for two
              controls you press rarely, and the difference in
              weight is what says which one is the button and
              which two are beside it. */}
          <button
            className="snd-op"
            style={{ width: side, height: side }}
            onClick={() => { step(-1); }}
            tabIndex={tab}
            aria-label="Previous"
          >
            <SkipBack size={mix(14, 16, p)} strokeWidth={2} />
          </button>

          <button
            className="snd-op"
            data-lead
            style={{ width: lead, height: lead }}
            onClick={() => { setGoing((v) => !v); }}
            tabIndex={tab}
            aria-label={going ? "Pause" : "Play"}
            aria-pressed={going}
          >
            {/* ── FILLED, not drawn ─────────────────────────
                Transport marks are solid everywhere a person
                has met them, and an outlined triangle reads as
                a diagram of play rather than as play. The skip
                glyphs keep their stroke for a different
                reason: the bar beside each triangle is a line
                with no area, and dropping the stroke would
                drop the bar.

                This one is not a lucide icon at all — see
                Mark, above — because it is the only mark here
                that changes into another one. */}
            <Mark playing={going} size={mix(14, 18, p)} still={still} />
          </button>

          <button
            className="snd-op"
            style={{ width: side, height: side }}
            onClick={() => { step(1); }}
            tabIndex={tab}
            aria-label="Next"
          >
            <SkipForward size={mix(14, 16, p)} strokeWidth={2} />
          </button>
        </span>

      </div>
    </div>
  );
}

export default NowPlaying;
