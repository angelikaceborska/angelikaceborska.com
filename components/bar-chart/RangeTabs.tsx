"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { BarChartRange } from "./RangeSelect";

interface RangeTabsProps {
  ranges: BarChartRange[];
  value: string;
  onChange: (value: string) => void;
  /** Tab ids are `${idPrefix}-tab-${value}`, so the chart can point back at the selected tab. */
  idPrefix: string;
  /** Id of the element the tabs control (the chart). */
  controls?: string;
  /** Off: the tabs still respond to the mouse but Tab skips them. */
  focusable?: boolean;
}

/**
 * Segmented control with a sliding pill — transitions.dev "Tabs sliding" (16-tabs-sliding.md).
 * The pill's position and width are measured from the selected tab; CSS owns the tween.
 */
export function RangeTabs({
  ranges,
  value,
  onChange,
  idPrefix,
  controls,
  focusable = true,
}: RangeTabsProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indexRef = useRef(0);
  const placed = useRef(false);

  const selectedIndex = Math.max(
    0,
    ranges.findIndex((r) => r.value === value),
  );

  // From the recipe: animate on selection; snap (no transition) on first paint and resize.
  const moveTo = (animate: boolean) => {
    const pill = pillRef.current;
    const tab = tabRefs.current[indexRef.current];
    if (!pill || !tab) return;
    const apply = () => {
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    };
    if (animate) {
      apply();
      return;
    }
    const prev = pill.style.transition;
    pill.style.transition = "none";
    apply();
    void pill.offsetWidth; // reflow so the snap lands before the transition comes back
    pill.style.transition = prev;
  };

  useLayoutEffect(() => {
    indexRef.current = selectedIndex;
    moveTo(placed.current);
    placed.current = true;
  }, [selectedIndex]);

  // Tab widths change when the web font loads or the card resizes: re-place without animating.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const ro = new ResizeObserver(() => moveTo(false));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);

  const select = (i: number) => {
    const next = ranges[i];
    if (!next) return;
    if (next.value !== value) onChange(next.value);
    tabRefs.current[i]?.focus();
  };

  // Arrow keys move between tabs and select them (automatic activation).
  const onKeyDown = (e: KeyboardEvent) => {
    const last = ranges.length - 1;
    const next =
      e.key === "ArrowRight"
        ? selectedIndex === last
          ? 0
          : selectedIndex + 1
        : e.key === "ArrowLeft"
          ? selectedIndex === 0
            ? last
            : selectedIndex - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    select(next);
  };

  return (
    <div
      ref={barRef}
      className="t-tabs"
      role="tablist"
      aria-label="Date range"
      onKeyDown={onKeyDown}
    >
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {ranges.map((r, i) => (
        <button
          key={r.value}
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          id={`${idPrefix}-tab-${r.value}`}
          type="button"
          className="t-tab"
          role="tab"
          aria-selected={i === selectedIndex}
          aria-controls={controls}
          tabIndex={focusable && i === selectedIndex ? 0 : -1}
          onClick={() => select(i)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
