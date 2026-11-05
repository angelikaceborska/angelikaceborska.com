"use client";

/* Small decorative SVGs from the Figma file: next/image adds nothing for these. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { assetUrl } from "./asset";
import filterListIcon from "./icons/filter-list.svg";
import arrowDownIcon from "./icons/keyboard-arrow-down.svg";

export interface BarChartRange {
  value: string;
  label: string;
}

interface RangeSelectProps {
  ranges: BarChartRange[];
  value: string;
  onChange: (value: string) => void;
  /** Off: the button still responds to the mouse but Tab skips it. */
  focusable?: boolean;
}

/** The "Last 7 days" button from the design, opening a listbox of ranges. */
export function RangeSelect({
  ranges,
  value,
  onChange,
  focusable = true,
}: RangeSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  // -1 = nothing highlighted (menu opened with the mouse, pointer not over an option yet)
  const [highlight, setHighlight] = useState(-1);

  const selectedIndex = Math.max(
    0,
    ranges.findIndex((r) => r.value === value),
  );
  const last = ranges.length - 1;

  const openMenu = (index: number) => {
    setHighlight(index);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const choose = (i: number) => {
    if (ranges[i] && ranges[i].value !== value) onChange(ranges[i].value);
    close();
  };

  // Move focus into the list so arrow keys work straight away.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // Click or tap anywhere else closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onButtonKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(selectedIndex);
    }
  };

  const onListKeyDown = (e: KeyboardEvent) => {
    const from = highlight < 0 ? selectedIndex : highlight;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight(highlight < 0 ? from : Math.min(from + 1, last));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight(highlight < 0 ? from : Math.max(from - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(last);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(from);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className="bc-range">
      <button
        ref={buttonRef}
        type="button"
        className="bc-range-button"
        tabIndex={focusable ? undefined : -1}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        // A keyboard "click" (Enter/Space) has detail 0: highlight the current range for arrow keys.
        onClick={(e) =>
          open ? close() : openMenu(e.detail === 0 ? selectedIndex : -1)
        }
        onKeyDown={onButtonKeyDown}
      >
        <img
          className="bc-icon"
          src={assetUrl(filterListIcon)}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
        {ranges[selectedIndex]?.label}
        <img
          className="bc-icon bc-range-arrow"
          src={assetUrl(arrowDownIcon)}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      </button>

      <ul
        ref={listRef}
        id={`${id}-list`}
        className="bc-range-menu"
        role="listbox"
        aria-label="Date range"
        tabIndex={-1}
        data-open={open}
        aria-activedescendant={
          open && highlight >= 0 ? `${id}-opt-${highlight}` : undefined
        }
        onKeyDown={onListKeyDown}
        onPointerLeave={() => setHighlight(-1)}
      >
        {ranges.map((r, i) => (
          <li
            key={r.value}
            id={`${id}-opt-${i}`}
            className="bc-range-option"
            role="option"
            aria-selected={i === selectedIndex}
            data-highlighted={i === highlight}
            onPointerMove={() => highlight !== i && setHighlight(i)}
            onClick={() => choose(i)}
          >
            {r.label}
            {i === selectedIndex && (
              <svg
                className="bc-range-check"
                width={16}
                height={16}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
