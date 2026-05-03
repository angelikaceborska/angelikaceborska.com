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
- **Hover-pause and reduced-motion** are JS-driven (mouseenter/leave on the container, `matchMedia("(prefers-reduced-motion: reduce)")`). Don't add `hover:[animation-play-state:paused]` — pausing a CSS-animated transform also caused a sub-pixel right-shift from GPU layer demotion.
- **Video playback.** `LazyVideo` is the single video primitive (`CarouselCard` and `ThemedVideo` both go through it). It uses an `IntersectionObserver` to call `play()` when a video first becomes visible and **never pauses afterwards** — pausing/resuming caused a poster-flash (~200–500ms) at the loop boundary, and browsers (notably Safari) cap concurrent autoplaying videos. It also keeps a module-level `peers` registry keyed by `src` and snaps `currentTime` to a playing peer on intersection so duplicated video instances stay frame-aligned across the two tracks.

### Card data
`carousel-data.ts` is a discriminated union over `{ type: "image" | "video" } × { themed: true | false }`. `CarouselCard` switches on these fields and renders all cards full-bleed (no inner frame).

### Fonts
One font variable wired in `app/layout.tsx`: `--font-ppmori` (local woff in `app/fonts/`). Exposed to Tailwind as `font-sans` via `@theme` in `globals.css`. PP Mori is the only font on the site.
