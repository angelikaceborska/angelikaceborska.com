# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server (Turbopack). Defaults to port 3000; falls back to 3001 if taken.
- `npm run build` — production build.
- `npm run start` — serve the production build.
- `npm run lint` — ESLint via `eslint-config-next` (core-web-vitals + TS rulesets).

There is no test runner configured.

## Stack

- Next.js 16 (App Router) + React 19, TypeScript strict.
- Tailwind v4 — configured purely via CSS (`@import "tailwindcss"`, `@theme`, `@utility`); there is **no `tailwind.config.*`**. Add tokens/utilities in `app/theme.css` or `app/globals.css`.
- Path alias: `@/*` → repo root (e.g. `@/components/hero`).

## Architecture

Single-page portfolio. `app/page.tsx` renders only `<HeroSection />` from `components/hero`. Everything interesting lives in `components/hero/`.

### Theming
Light/dark is driven by `prefers-color-scheme` + CSS `light-dark()` in `app/theme.css`. The page does not have a manual theme toggle. Two patterns coexist:
- Tokens like `bg-surface`, `text-main`, `text-muted` resolve via `light-dark()` automatically — prefer these.
- Asset-level theming ships separate light/dark sources. `ThemedImage` renders both `<Image>`s and toggles via `dark:hidden`. `ThemedVideo` reads `matchMedia("(prefers-color-scheme: dark)")` in a client effect and swaps the active source.

### Hero carousel (the load-bearing piece)
`Carousel.tsx` is a hand-rolled, `requestAnimationFrame`-driven marquee. It is **not** a CSS keyframe animation — there is intentionally no `animate-marquee` utility. The reasons are baked into the implementation and matter when modifying it:

- **Two tracks, independent transforms.** Each track is one full "set" (`[...cards, ...cards]`, sized to exceed ultrawide viewports). Both translate left at the same speed via `translate3d` on each frame. When a track exits the viewport on the left, it teleports to the right of the other track. Teleports always happen off-screen, so the seam is never visible. Do not collapse this back to a single CSS keyframe loop with `translateX(-50%)` — that produced a visible flash on every iteration because the same screen pixels were being repainted by different DOM elements at the snap, even when the math was exact.
- **Gap math.** Each track uses `flex gap-4 pr-4`. The trailing `pr-4` matches the inner gap so the two tracks abut seamlessly; removing it reintroduces a visible seam.
- **Hover-pause and reduced-motion** are JS-driven (mouseenter/leave on the container, `matchMedia("(prefers-reduced-motion: reduce)")`). Don't add `hover:[animation-play-state:paused]` — pausing a CSS-animated transform also caused a sub-pixel right-shift from GPU layer demotion. They are separate flags (`hovered`, `reducedMotion`) so leaving the strip never restarts it for reduced-motion visitors. After a tab is hidden (or the page leaves via `pagehide`), an enter alone no longer pauses: Safari replays a stale `mouseenter` for the mouse's old position when the tab returns, which froze the strip until the mouse passed over it again. The next real `mousemove` over the strip pauses it as usual.
- **Measuring Safari stutter.** Use a screen recording, not an in-page `requestAnimationFrame` timer. Safari 27 draws in a separate GPU process, so the page reports every frame on time while the screen still stutters. Crop a 1px row through the tiles with ffmpeg and find each frame's shift against the one before: at 130pt/s on a 2× screen the strip should move about 4.3px per 60fps frame, and a held frame (no movement) or a jump of 3+ frames is a stutter. Stalls that repeat every ~20s (one trip of the strip) point at a single tile.
- **Video playback.** `LazyVideo` is the single video primitive (`CarouselCard` and `ThemedVideo` both go through it). It uses an `IntersectionObserver` to call `play()` when a video first becomes visible and **never pauses afterwards** — pausing/resuming caused a poster-flash (~200–500ms) at the loop boundary, and browsers (notably Safari) cap concurrent autoplaying videos. It also keeps a module-level `peers` registry keyed by `src` and snaps `currentTime` to a playing peer on intersection so duplicated video instances stay frame-aligned across the two tracks.

### Card data
`carousel-data.ts` is a discriminated union over `{ type: "image" | "video" } × { themed: true | false }`, plus `{ type: "chart" }` for the live bar chart demo and `{ type: "player" }` for the live NowPlaying player. `CarouselCard` switches on these fields and renders all cards full-bleed (no inner frame).

### NowPlaying player (`type: "player"`)
`NowPlayingCard` lays out the Figma frame "Component" (826:789) at a third of its 1080 size (360, so the player is at 1×) and scales it to the tile, the same way as `ChartDemoCard`. The player itself is `components/now-playing/`; it is MIT-licensed third-party code, and its notice in `THIRD_PARTY_NOTICES.md` has to stay. One tween drives every size, position and radius; keep its CSS free of transitions on geometry. Its own role tokens (`--ink`, `--pane`, …) are mapped onto the site's tokens on `.snd` in `NowPlaying.css`. The three episodes and their covers (`public/now-playing/`) come from the Figma component set (829:843, State=Previous/Current/Next). Like the chart it renders four times, so the hero passes `focusable={false}` and wraps it in one `role="img"`. The box has no `backdrop-filter`: the pane is opaque here, and a blur on four moving tiles costs frames. The bar chart's Safari rule applies here too, and for the same reason (the demo folds the card while the strip moves): no `overflow: hidden` with a radius and no blurred shadow on anything the morph resizes — the box, the buttons, the rail — and the sleeve clips only while a skip is paging (`[data-paging]`). Moving things use `transform`, not the `translate` property, and the title run, its fades and the heart keep `will-change`, so the demo's folds and likes never move them on and off a GPU layer (the bar chart's tooltip stall). A title that overflows is clipped (no ellipsis) and scrolls back and forth (1s hold at the start, 0.5s at the far end, 35px/s), via the Web Animations API, only while the player is at rest; skips page the cover through the sleeve. In the hero it runs as `NowPlayingAutoplay`, the same pattern as `BarChartAutoplay` (and its cursor): it opens on the card, and a scripted cursor taps play → heart → folds to the bar → pause → opens, on a loop. Its taps are real `click()`s on the player's buttons, chosen from their `aria-*` state, so they skip anything already done; `[data-hover]`/`[data-press]` stand in for `:hover`/`:active` in `NowPlaying.css`.

### Bar chart demo (`type: "chart"`)
`ChartDemoCard` lays out the Figma frame (1080×1080: photo + 780px card) at full size and scales it to the tile with a `ResizeObserver`, so it matches Figma at every tile size. The chart itself is `components/bar-chart/` (`BarChartAutoplay` wraps `BarChart` with a scripted cursor; a real mouse takes over, and the strip's existing hover-pause keeps the tile still meanwhile). It themes itself from `prefers-color-scheme` through role tokens in `BarChart.css`; dark values come from Figma node 107:500. It renders four times (two copies per track × two tracks), so it is kept out of keyboard focus (`focusable={false}`) and exposed to assistive tech as a single `role="img"`. On touch screens it ignores input and just plays. Keep its animations cheap to draw: resting bars have no `box-shadow` and no `overflow: hidden`, and the AVG line moves by `transform`. With a shadow and rounded clipping on all 30 bars, every bar grow-in and range switch dropped the whole strip to 30fps for about a second in Safari 27 (measured from screen recordings). The tooltip also stays on its own GPU layer for good (`will-change`), and the hovered bar's shadow switches on and off without a fade: otherwise Safari moves a transitioning element onto a layer and flattens it back at the end, which inside the scaled, rounded tile redraws much of the tile, and the strip stalled 50–70ms at every step of the demo's sweep. Hover and the demo hand-off react to pointer *movement*, not entry, for the same stale-hover reason as the strip.

### Fonts
One site-wide font variable wired in `app/layout.tsx`: `--font-ppmori` (local woff in `app/fonts/`). Exposed to Tailwind as `font-sans` via `@theme` in `globals.css`. PP Mori is the site's font. The one exception is the bar chart demo, which loads Inter and Karla through `next/font/google` in `ChartDemoCard.tsx` (scoped CSS variables `--font-inter` / `--font-karla`) to match its Figma design.
