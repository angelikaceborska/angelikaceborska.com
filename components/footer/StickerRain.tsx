"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type Matter from "matter-js";
import { StickerNote, type StickerNoteHandle } from "./StickerNote";
import { STICKERS } from "./stickers";

// How fast stickers fall (Matter.js units).
const GRAVITY_Y = 1.5;
// Bounciness: 0 = dead stop, 1 = perfectly elastic.
const RESTITUTION = 0.42;
const FRICTION = 0.12;
const FRICTION_STATIC = 0.4;
const FRICTION_AIR = 0.012;
// Sticker diameter relative to the card's short side.
const BASE_SIZE_FACTOR = 0.13;
// Stickers per drop on phones (below Tailwind's md, 48rem). Wider screens
// drop the whole set.
const COUNT_MOBILE = 24;
// Delay between each sticker's release (plus up to 80ms of jitter).
const STAGGER_MS = 90;
// Drag feel.
const MOUSE_STIFFNESS = 0.2;
const MOUSE_DAMPING = 0.1;
const RESIZE_DEBOUNCE_MS = 150;
// A press that travels further than this is a drag or scroll, not a tap.
const TAP_SLOP = 8;
// Reduced motion: simulate this many ticks off-screen, then show the pile.
const SETTLE_TICKS = 900;
const STEP_MS = 1000 / 60;
// Thick enough that a hard toss can't tunnel through in one step.
const WALL = 200;
const PARKED = "translate3d(-200vw, -200vh, 0)";

// Physics sticker pile: stickers rain into the card, can be dragged and tossed
// (touch or mouse), and tapping or clicking the empty floor drops a fresh set.
// Clicking or tapping a sticker without dragging it opens its note card.
export function StickerRain() {
  const stageRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const noteRef = useRef<StickerNoteHandle>(null);
  // Stickers (and Matter.js itself) only load once the footer is near the
  // viewport, so they cost nothing on initial page load.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setArmed(true);
        io.disconnect();
      },
      { rootMargin: "800px" },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!armed || !stage) return;
    let disposed = false;
    let teardown = () => {};
    import("matter-js").then(({ default: lib }) => {
      if (disposed) return;
      teardown = simulate(lib, stage, buttonRefs.current, (i) =>
        noteRef.current?.open(STICKERS[i]),
      );
    });
    return () => {
      disposed = true;
      teardown();
    };
  }, [armed]);

  return (
    <>
      <div
        ref={stageRef}
        role="group"
        aria-label="Stickers"
        // select-none: a mouse drag that crosses the headline doesn't select it.
        className="absolute inset-0 rounded-[inherit] select-none data-dragging:cursor-grabbing"
      >
        {armed &&
          STICKERS.map((sticker, i) => (
            <button
              key={sticker.name}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              type="button"
              aria-label={`${sticker.name} sticker`}
              aria-haspopup="dialog"
              // Parked off-screen until it drops. simulate() takes over from
              // here, and this component doesn't render again to undo it.
              inert
              // touch-none: a touch that starts on a sticker drags it instead of
              // scrolling the page. Touches on the empty card still scroll.
              // rounded-full: the grab cursor covers the same circle as the
              // physics body, so it only shows where a press would pick it up.
              className="absolute top-0 left-0 size-[var(--d)] rounded-full cursor-grab in-data-dragging:cursor-grabbing motion-reduce:cursor-pointer touch-none motion-reduce:touch-auto outline-none [-webkit-tap-highlight-color:transparent] [transform:translate3d(-200vw,-200vh,0)] will-change-transform motion-reduce:will-change-auto [--ring:var(--color-neutral-950)] dark:[--ring:var(--color-neutral-50)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] data-grabbed:[filter:drop-shadow(1.5px_0_0_var(--ring))_drop-shadow(-1.5px_0_0_var(--ring))_drop-shadow(0_1.5px_0_var(--ring))_drop-shadow(0_-1.5px_0_var(--ring))]"
            >
              <Image
                src={sticker.src}
                alt=""
                width={400}
                height={400}
                // A sticker is 13% of the card's short side: about 6% of the
                // viewport width on wider screens (where the card keeps its
                // 1696/748 shape) and 13% on phones.
                sizes="(min-width: 48rem) 6vw, 13vw"
                loading="eager"
                draggable={false}
                className="pointer-events-none size-full object-contain select-none"
              />
            </button>
          ))}
      </div>
      <StickerNote ref={noteRef} />
    </>
  );
}

type Piece = { body: Matter.Body; el: HTMLElement; r: number };

function simulate(
  lib: typeof Matter,
  stage: HTMLElement,
  figures: (HTMLElement | null)[],
  openNote: (index: number) => void,
) {
  const { Engine, Bodies, Body, Composite, Mouse, MouseConstraint, Query, Sleeping } = lib;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const md = window.matchMedia("(min-width: 48rem)");

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = GRAVITY_Y;

  // Matter's own Mouse listeners preventDefault every touchmove, which would
  // block page scrolling across the whole card. Bind it to a detached element
  // and feed it our own pointer events instead.
  const mouse = Mouse.create(document.createElement("div"));
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: MOUSE_STIFFNESS, damping: MOUSE_DAMPING },
  });
  Composite.add(engine.world, mouseConstraint);

  let width = 0;
  let height = 0;
  let walls: Matter.Body[] = [];
  let stickers: Piece[] = [];
  let timers: number[] = [];
  let pending = 0;
  let grabbed: HTMLElement | null = null;
  // Roving tab stop: the pile is a single Tab stop, and the arrow keys move
  // between stickers from left to right.
  let tabStop: HTMLElement | null = null;
  const setTabStop = (el: HTMLElement | null) => {
    if (tabStop && tabStop !== el) tabStop.tabIndex = -1;
    tabStop = el;
    if (el) el.tabIndex = 0;
  };
  const park = (el: HTMLElement) => {
    el.style.transform = PARKED;
    el.inert = true;
    el.tabIndex = -1;
  };
  let raf = 0;
  let last = 0;
  let acc = 0;

  const buildWalls = () => {
    width = stage.clientWidth;
    height = stage.clientHeight;
    Composite.remove(engine.world, walls);
    const opts = { isStatic: true, friction: FRICTION, frictionStatic: FRICTION_STATIC };
    // Side walls reach 3 card-heights above the top, so tossed stickers
    // always fall back in rather than escaping sideways.
    const sideHeight = height * 4 + WALL;
    const sideY = -height + WALL / 2;
    walls = [
      Bodies.rectangle(width / 2, height + WALL / 2, width + WALL * 2, WALL, opts),
      Bodies.rectangle(-WALL / 2, sideY, WALL, sideHeight, opts),
      Bodies.rectangle(width + WALL / 2, sideY, WALL, sideHeight, opts),
    ];
    Composite.add(engine.world, walls);
  };

  const paint = () => {
    for (const { body, el, r } of stickers) {
      el.style.transform = `translate3d(${body.position.x - r}px, ${body.position.y - r}px, 0) rotate(${body.angle}rad)`;
    }
    const el = stickers.find((s) => s.body === mouseConstraint.body)?.el ?? null;
    if (el !== grabbed) {
      if (grabbed) delete grabbed.dataset.grabbed;
      if (el) el.dataset.grabbed = "";
      stage.toggleAttribute("data-dragging", el !== null);
      grabbed = el;
    }
  };

  // Fixed-step loop that stops itself once every sticker is asleep, so a
  // settled pile costs nothing. Interactions call wake() to restart it.
  const frame = (now: number) => {
    acc += Math.min(now - last, 100);
    last = now;
    while (acc >= STEP_MS) {
      Engine.update(engine, STEP_MS);
      acc -= STEP_MS;
    }
    paint();
    const settled =
      pending === 0 && mouse.button !== 0 && stickers.every(({ body }) => body.isSleeping);
    raf = settled ? 0 : requestAnimationFrame(frame);
  };
  const wake = () => {
    if (raf || reducedMotion.matches) return;
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  };
  const settle = () => {
    for (let i = 0; i < SETTLE_TICKS; i++) Engine.update(engine, STEP_MS);
    paint();
  };

  const drop = () => {
    timers.forEach(clearTimeout);
    timers = [];
    pending = 0;
    mouse.button = -1;
    Composite.remove(engine.world, stickers.map((s) => s.body));
    stickers = [];
    for (const el of figures) if (el) park(el);
    tabStop = null;
    buildWalls();

    const d = Math.round(Math.min(width, height) * BASE_SIZE_FACTOR);
    const r = d / 2;
    const perRow = Math.max(1, Math.floor(width / d));
    // Fresh random pick and order each drop.
    const picks = shuffle(figures.filter((el): el is HTMLElement => el !== null)).slice(
      0,
      md.matches ? undefined : COUNT_MOBILE,
    );
    const bodyOptions = {
      restitution: RESTITUTION,
      friction: FRICTION,
      frictionStatic: FRICTION_STATIC,
      frictionAir: FRICTION_AIR,
    };
    const release = (el: HTMLElement, x: number, y: number) => {
      el.style.setProperty("--d", `${d}px`);
      el.inert = false;
      if (!tabStop) setTabStop(el);
      const body = Bodies.circle(x, y, r, bodyOptions);
      Composite.add(engine.world, body);
      stickers.push({ body, el, r });
      return body;
    };

    if (reducedMotion.matches) {
      // Stack the whole set in a grid above the card, settle it silently,
      // and show only the finished pile.
      picks.forEach((el, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        release(el, (col + 0.5) * (width / perRow), -r - row * d * 1.1);
      });
      settle();
      return;
    }

    picks.forEach((el, i) => {
      pending++;
      const timer = window.setTimeout(
        () => {
          pending--;
          const body = release(el, r + Math.random() * (width - d), -r);
          Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 2 + Math.random() * 3 });
          Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
          wake();
        },
        i * STAGGER_MS + Math.random() * 80,
      );
      timers.push(timer);
    });
  };

  let press: { x: number; y: number; sticker: Piece | undefined; moved: boolean } | null = null;
  const local = (e: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0) return;
    const p = local(e);
    const [hit] = Query.point(stickers.map((s) => s.body), p);
    const sticker = stickers.find((s) => s.body === hit);
    press = { ...p, sticker, moved: false };
    if (sticker && !reducedMotion.matches) {
      mouse.position.x = p.x;
      mouse.position.y = p.y;
      mouse.button = 0;
      stage.setPointerCapture(e.pointerId);
      wake();
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!press) return;
    const p = local(e);
    mouse.position.x = p.x;
    mouse.position.y = p.y;
    if (Math.hypot(p.x - press.x, p.y - press.y) > TAP_SLOP) press.moved = true;
  };
  const onPointerUp = () => {
    if (!press) return;
    // Releasing the constraint leaves the sticker with whatever velocity the
    // drag gave it, which is what makes the toss.
    mouse.button = -1;
    // A press that stayed put is a tap: on a sticker it opens the note, on
    // the empty floor it drops a fresh set.
    if (!press.moved) {
      if (press.sticker) openNote(figures.indexOf(press.sticker.el));
      else drop();
    }
    press = null;
  };
  const onPointerCancel = () => {
    mouse.button = -1;
    press = null;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    const index = figures.indexOf(el);
    if (index === -1) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openNote(index);
      return;
    }
    const order = [...stickers]
      .sort((a, b) => a.body.position.x - b.body.position.x)
      .map((s) => s.el);
    const at = order.indexOf(el);
    const next =
      e.key === "Home"
        ? order[0]
        : e.key === "End"
          ? order.at(-1)
          : e.key === "ArrowRight" || e.key === "ArrowDown"
            ? order[(at + 1) % order.length]
            : e.key === "ArrowLeft" || e.key === "ArrowUp"
              ? order[(at - 1 + order.length) % order.length]
              : undefined;
    if (!next) return;
    e.preventDefault();
    next.focus({ preventScroll: true });
  };
  // Clicking a sticker focuses it too, so Tab comes back to the last one used.
  const onFocusIn = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    if (figures.includes(el)) setTabStop(el);
  };
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointercancel", onPointerCancel);
  stage.addEventListener("keydown", onKeyDown);
  stage.addEventListener("focusin", onFocusIn);

  let resizeTimer = 0;
  const resize = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      buildWalls();
      for (const { body, r } of stickers) {
        const x = Math.min(Math.max(body.position.x, r), width - r);
        const y = Math.min(body.position.y, height - r);
        if (x !== body.position.x || y !== body.position.y) Body.setPosition(body, { x, y });
        Sleeping.set(body, false);
      }
      if (reducedMotion.matches) settle();
      else wake();
    }, RESIZE_DEBOUNCE_MS);
  });
  resize.observe(stage);

  // First rain starts when the card is actually on screen, so it's seen.
  const trigger = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      trigger.disconnect();
      drop();
    },
    { threshold: 0.3 },
  );
  trigger.observe(stage);

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    clearTimeout(resizeTimer);
    trigger.disconnect();
    resize.disconnect();
    stage.removeEventListener("pointerdown", onPointerDown);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerup", onPointerUp);
    stage.removeEventListener("pointercancel", onPointerCancel);
    stage.removeEventListener("keydown", onKeyDown);
    stage.removeEventListener("focusin", onFocusIn);
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  };
}

function shuffle<T>(items: T[]) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
