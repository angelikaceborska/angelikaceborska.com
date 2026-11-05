"use client";

/* Small decorative SVGs from the Figma file: next/image adds nothing for these. */
/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { assetUrl } from "./asset";
import { useReducedMotion } from "./useReducedMotion";
import infoIcon from "./icons/info.svg";
import trendingUpIcon from "./icons/trending-up.svg";
import trendingUpDarkIcon from "./icons/trending-up-dark.svg";
import dividerImg from "./icons/divider.svg";
import dividerDarkImg from "./icons/divider-dark.svg";
import { RangeSelect } from "./RangeSelect";
import type { BarChartRange } from "./RangeSelect";
import { RangeTabs } from "./RangeTabs";
import { RollingNumber } from "./RollingNumber";
import "./BarChart.css";

export type { BarChartRange };

export interface BarChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarChartDatum {
  /** ISO date, e.g. "2026-06-07" */
  date: string;
  /** Value per series key */
  values: Record<string, number>;
}

export interface BarChartProps {
  title: string;
  series: BarChartSeries[];
  data: BarChartDatum[];
  /** Headline number. Defaults to the sum of all bars. */
  total?: number;
  /** Change badge text, e.g. "+10%" */
  change?: string;
  /** Muted text next to the badge, e.g. "last 7 days" */
  changeHint?: string;
  /** Position of the AVG line. Defaults to the mean of the daily totals. */
  average?: number;
  showAverage?: boolean;
  /** Options for the range control in the top-right corner. Hidden when omitted. */
  ranges?: BarChartRange[];
  /** Selected range `value`. The parent swaps `data` when it changes. */
  range?: string;
  onRangeChange?: (value: string) => void;
  /** Sliding tabs (default) or the dropdown menu from the original design. */
  rangeControl?: "tabs" | "menu";
  /**
   * Show a bar as if it were hovered (index into `data`), e.g. for a self-playing demo.
   * Real pointer and keyboard input always win while they are active.
   */
  highlight?: number | null;
  /**
   * Whether bars and tabs take keyboard focus (default true). Turn off where the chart is
   * decorative, e.g. a showcase in a moving strip: the mouse still works, Tab skips it.
   */
  focusable?: boolean;
  formatAxisDate?: (date: Date) => string;
  formatTooltipDate?: (date: Date) => string;
  className?: string;
}

// Geometry of the plot area, taken from the Figma frame (px).
const CHART_HEIGHT = 450;
const PLOT_TOP = 28; // y of the highest gridline
const PLOT_BOTTOM = 388; // y of the zero baseline
const PLOT_LEFT = 40; // gridlines start after the y-axis labels
const BAR_MAX_WIDTH = 50;
const BAR_MIN_GUTTER = 16; // keeps bars apart when the card gets narrow…
const BAR_MIN_FILL = 0.6; // …but bars never get thinner than 60% of their column
const GROW_THRESHOLD = 0.3; // share of the card on screen before the bars grow in (Bencho's value)

const TOOLTIP_WIDTH = 180;
const TOOLTIP_GAP = 8; // space between tooltip and the hovered bar
const AXIS_LABEL_CLEARANCE = 22; // hide a tick label if the AVG pill would overlap it
const LABEL_GAP = 10; // minimum space between two date labels
const LABEL_FAMILY = "Inter, system-ui, sans-serif"; // until the card's real font is known
const LABEL_TRACKING = -0.28;

let measureCtx: CanvasRenderingContext2D | null | undefined;
/** Width of an x-axis label in px (rough estimate when there is no DOM, e.g. SSR). */
function labelWidth(text: string, family: string): number {
  if (typeof document === "undefined") return text.length * 7.5;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * 7.5;
  measureCtx.font = `400 14px ${family}`; // matches .bc-x-label
  return measureCtx.measureText(text).width + LABEL_TRACKING * text.length;
}

const monthShort = new Intl.DateTimeFormat("en", { month: "short" });

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ordinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]);
}

const defaultAxisDate = (d: Date) => `${d.getDate()} ${monthShort.format(d)}`;
const defaultTooltipDate = (d: Date) =>
  `${monthShort.format(d)} ${ordinal(d.getDate())}`;

/** Round the axis up to a friendly maximum with ~3 intervals (e.g. 12 → 0/5/10/15). */
function niceScale(max: number) {
  if (max <= 0) return { top: 5, step: 5 };
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  return { top: Math.ceil(max / step) * step, step };
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export function BarChart({
  title,
  series,
  data,
  total,
  change,
  changeHint,
  average,
  showAverage = true,
  ranges,
  range,
  onRangeChange,
  rangeControl = "tabs",
  highlight = null,
  focusable = true,
  formatAxisDate = defaultAxisDate,
  formatTooltipDate = defaultTooltipDate,
  className,
}: BarChartProps) {
  const uid = useId();
  const hasRanges = !!ranges?.length && range !== undefined && !!onRangeChange;
  const useTabs = hasRanges && rangeControl === "tabs";
  const cardRef = useRef<HTMLElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [width, setWidth] = useState(728);
  const [tooltipHeight, setTooltipHeight] = useState(174);
  const [active, setActive] = useState<number | null>(null);
  // Content stays on the last bar while the tooltip fades out.
  const [shown, setShown] = useState(0);
  // Only animate the tooltip's position when moving between bars, not when it first appears.
  const [glide, setGlide] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const days = useMemo(
    () =>
      data.map((d) => {
        const date = parseDate(d.date);
        const items = series.map((s) => ({
          ...s,
          value: d.values[s.key] ?? 0,
        }));
        return {
          dayOfMonth: date.getDate(),
          axisLabel: formatAxisDate(date),
          tooltipLabel: formatTooltipDate(date),
          items,
          total: items.reduce((sum, i) => sum + i.value, 0),
        };
      }),
    [data, series, formatAxisDate, formatTooltipDate],
  );

  // Once the web font has loaded, measure labels in the card's actual font. With next/font
  // the family has a generated name, so it's read from the card rather than hard-coded.
  const [labelFamily, setLabelFamily] = useState(LABEL_FAMILY);
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      const el = cardRef.current;
      if (!cancelled && el)
        setLabelFamily(getComputedStyle(el).fontFamily || LABEL_FAMILY);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const labelWidths = useMemo(
    () => ({
      full: Math.max(
        0,
        ...days.map((d) => labelWidth(d.axisLabel, labelFamily)),
      ),
      compact: Math.max(
        0,
        ...days.map((d) => labelWidth(String(d.dayOfMonth), labelFamily)),
      ),
    }),
    [days, labelFamily],
  );

  // A different range means a different number of bars: drop hover/focus state that
  // could point past the end (React's "adjust state while rendering" pattern).
  const [dayCount, setDayCount] = useState(days.length);
  if (dayCount !== days.length) {
    setDayCount(days.length);
    setActive(null);
    setShown(0);
    setFocusIndex(0);
  }

  // The bar shown as hovered: real input first, otherwise the `highlight` prop.
  // Whichever drives it, the tooltip appears in place and glides between bars.
  const validHighlight =
    highlight !== null && highlight >= 0 && highlight < days.length
      ? highlight
      : null;
  const current = active ?? validHighlight;
  const [lastCurrent, setLastCurrent] = useState<number | null>(null);
  if (current !== lastCurrent) {
    setLastCurrent(current);
    if (current !== null) {
      setGlide(lastCurrent !== null);
      setShown(current);
    }
  }

  /* ── Bar motion, after Bencho's "Stacked bars" (MIT, bencho.dev/licence) ──
     "The same transition grows the bars out of the baseline the first time
     the card is seen": every bar sits at 0 until 30% of the card is on screen.
     The transition itself is on .bc-bar in BarChart.css. With reduced motion the
     bars don't wait to be seen (and the CSS drops the transition). Everything starts
     at 0 on the server too, so the server's HTML matches the first client render. */
  const reduced = useReducedMotion();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || seen || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: GROW_THRESHOLD },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  // Bencho's bar count never changes; ours does with the range. Bars that exist in both
  // ranges ease to their new height; bars a longer range adds are drawn at 0 for a frame
  // first, so they grow out of the baseline the way every bar does on first view.
  const growTarget = seen || reduced ? days.length : 0;
  const [grown, setGrown] = useState(0);
  if (grown > growTarget) setGrown(growTarget);
  useEffect(() => {
    if (grown >= growTarget) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setGrown(growTarget));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [grown, growTarget]);

  const sum = days.reduce((s, d) => s + d.total, 0);
  const headline = total ?? sum;
  const avg = average ?? (days.length ? sum / days.length : 0);
  const { top, step } = niceScale(
    Math.max(0, ...days.map((d) => d.total), showAverage ? avg : 0),
  );
  const yFor = (v: number) =>
    PLOT_BOTTOM - (v / top) * (PLOT_BOTTOM - PLOT_TOP);
  const ticks = Array.from(
    { length: Math.round(top / step) + 1 },
    (_, i) => i * step,
  );
  const avgY = yFor(avg);

  // Track the chart width so the tooltip can be placed beside the hovered bar.
  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (tooltipRef.current) setTooltipHeight(tooltipRef.current.offsetHeight);
  }, [series.length]);

  // Touch: tapping outside the chart dismisses the tooltip.
  useEffect(() => {
    if (active === null) return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (!chartRef.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [active]);

  const show = (i: number) => setActive(i);
  const hide = () => setActive(null);

  const onColumnsKeyDown = (e: KeyboardEvent) => {
    const last = days.length - 1;
    const next =
      e.key === "ArrowRight"
        ? Math.min(focusIndex + 1, last)
        : e.key === "ArrowLeft"
          ? Math.max(focusIndex - 1, 0)
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next !== null) {
      e.preventDefault();
      columnRefs.current[next]?.focus();
    } else if (e.key === "Escape") {
      hide();
    }
  };

  // Tooltip sits to the left of the bar, vertically centred on its top edge;
  // it flips to the right when there is no room on the left.
  const colWidth = days.length
    ? Math.max(0, width - PLOT_LEFT) / days.length
    : 0;
  const barWidth = Math.min(
    BAR_MAX_WIDTH,
    Math.max(colWidth - BAR_MIN_GUTTER, colWidth * BAR_MIN_FILL),
  );
  // Full labels ("27 May") when they fit, day numbers ("27") when not,
  // and only every nth day number when even those would touch.
  const compactAxis = colWidth < labelWidths.full + LABEL_GAP;
  const labelEvery = compactAxis
    ? Math.ceil((labelWidths.compact + LABEL_GAP) / Math.max(colWidth, 1))
    : 1;
  const shownDay = days[shown] ?? days[0];
  const centerX = PLOT_LEFT + (shown + 0.5) * colWidth;
  const leftX = centerX - barWidth / 2 - TOOLTIP_GAP - TOOLTIP_WIDTH;
  const side = leftX >= 0 ? "left" : "right";
  const tooltipX = clamp(
    side === "left" ? leftX : centerX + barWidth / 2 + TOOLTIP_GAP,
    0,
    Math.max(0, width - TOOLTIP_WIDTH),
  );
  const tooltipY = clamp(
    yFor(shownDay?.total ?? 0) - tooltipHeight / 2,
    0,
    Math.max(0, PLOT_BOTTOM - tooltipHeight),
  );

  return (
    <section
      ref={cardRef}
      className={["bc-card", className].filter(Boolean).join(" ")}
    >
      <header className="bc-header">
        <div className="bc-header-main">
          <div className="bc-headline">
            <h2 className="bc-title">{title}</h2>
            <img
              className="bc-icon"
              src={assetUrl(infoIcon)}
              width={24}
              height={24}
              alt=""
              aria-hidden="true"
            />
          </div>
          <div className="bc-figures">
            <p className="bc-total">
              <RollingNumber value={headline} />
            </p>
            {(change || changeHint) && (
              <div className="bc-support">
                {change && (
                  <span className="bc-badge">
                    <img
                      className="bc-icon bc-only-light"
                      src={assetUrl(trendingUpIcon)}
                      width={16}
                      height={16}
                      alt=""
                      aria-hidden="true"
                    />
                    <img
                      className="bc-icon bc-only-dark"
                      src={assetUrl(trendingUpDarkIcon)}
                      width={16}
                      height={16}
                      alt=""
                      aria-hidden="true"
                    />
                    {change}
                  </span>
                )}
                {changeHint && <span className="bc-hint">{changeHint}</span>}
              </div>
            )}
          </div>
        </div>
        {hasRanges &&
          (useTabs ? (
            <RangeTabs
              ranges={ranges}
              value={range}
              onChange={onRangeChange}
              idPrefix={uid}
              controls={`${uid}-chart`}
              focusable={focusable}
            />
          ) : (
            <RangeSelect
              ranges={ranges}
              value={range}
              onChange={onRangeChange}
              focusable={focusable}
            />
          ))}
      </header>

      <div
        ref={chartRef}
        id={`${uid}-chart`}
        className="bc-chart"
        style={{ height: CHART_HEIGHT }}
        role={useTabs ? "tabpanel" : undefined}
        aria-labelledby={
          useTabs ? `${uid}-tab-${range}` : undefined /* RangeTabs' tab id */
        }
      >
        {ticks.map((v) => (
          <div
            key={v}
            className="bc-tick"
            style={{ top: yFor(v) }}
            aria-hidden="true"
          >
            {!(
              showAverage && Math.abs(yFor(v) - avgY) < AXIS_LABEL_CLEARANCE
            ) && <span className="bc-tick-label">{v}</span>}
            <span className="bc-gridline" />
          </div>
        ))}

        {showAverage && days.length > 0 && (
          <div
            className="bc-avg"
            style={{ transform: `translateY(${avgY}px)` }}
            aria-hidden="true"
          >
            <span className="bc-avg-line" />
            <span className="bc-avg-label">AVG</span>
          </div>
        )}

        <div
          className="bc-columns"
          role="list"
          aria-label={title}
          style={{
            gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          }}
          onPointerLeave={(e: PointerEvent) =>
            e.pointerType === "mouse" && hide()
          }
          onKeyDown={onColumnsKeyDown}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null))
              hide();
          }}
        >
          {days.map((day, i) => {
            const isActive = current === i;
            const height =
              i < grown ? (day.total / top) * (PLOT_BOTTOM - PLOT_TOP) : 0;
            return (
              <div
                key={i}
                ref={(el) => {
                  columnRefs.current[i] = el;
                }}
                className="bc-column"
                role="listitem"
                tabIndex={focusable && i === focusIndex ? 0 : -1}
                data-active={isActive}
                aria-label={`${day.tooltipLabel}: ${day.items
                  .map((it) => `${it.label} ${it.value}`)
                  .join(", ")}. Total ${day.total}`}
                // Movement, not entry: Safari replays a stale pointerenter when a tab comes
                // back into view, which would pop a tooltip under a mouse that isn't there.
                onPointerMove={(e) =>
                  e.pointerType === "mouse" && active !== i && show(i)
                }
                onClick={() => show(i)}
                onFocus={() => {
                  setFocusIndex(i);
                  show(i);
                }}
              >
                {day.total > 0 && (
                  <div
                    className="bc-bar"
                    data-collapsed={height === 0 || undefined}
                    style={
                      {
                        "--i": i, // stagger: each bar starts 14ms after its left neighbour
                        height,
                        width: barWidth,
                        bottom: CHART_HEIGHT - PLOT_BOTTOM,
                      } as CSSProperties
                    }
                  >
                    <div className="bc-bar-fill">
                      {day.items
                        .filter((it) => it.value > 0)
                        .map((it) => (
                          <span
                            key={it.key}
                            className="bc-segment"
                            style={{ flexGrow: it.value, background: it.color }}
                          />
                        ))}
                    </div>
                  </div>
                )}
                {/* Count from the latest day so the most recent bar is always labelled. */}
                {(days.length - 1 - i) % labelEvery === 0 && (
                  <span className="bc-x-label" aria-hidden="true">
                    {compactAxis ? day.dayOfMonth : day.axisLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {shownDay && (
          <div
            ref={tooltipRef}
            className="bc-tooltip"
            aria-hidden="true"
            data-visible={current !== null}
            data-glide={glide}
            data-side={side}
            style={{ transform: `translate(${tooltipX}px, ${tooltipY}px)` }}
          >
            <p className="bc-tooltip-date">{shownDay.tooltipLabel}</p>
            <ul className="bc-tooltip-list">
              {shownDay.items.map((it) => (
                <li key={it.key} className="bc-tooltip-row">
                  <span className="bc-tooltip-label">
                    <span className="bc-dot" style={{ background: it.color }} />
                    {it.label}
                  </span>
                  <span className="bc-tooltip-value">{it.value}</span>
                </li>
              ))}
            </ul>
            <div className="bc-tooltip-divider">
              <img
                className="bc-only-light"
                src={assetUrl(dividerImg)}
                width={156}
                height={1}
                alt=""
              />
              <img
                className="bc-only-dark"
                src={assetUrl(dividerDarkImg)}
                width={156}
                height={1}
                alt=""
              />
            </div>
            <div className="bc-tooltip-row">
              <span className="bc-tooltip-label">Total</span>
              <span className="bc-tooltip-value">{shownDay.total}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default BarChart;
