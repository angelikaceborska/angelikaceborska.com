"use client";

import Image from "next/image";
import { useId, useImperativeHandle, useRef, useState, type Ref } from "react";
import { flushSync } from "react-dom";
import type { Sticker } from "./stickers";

export type StickerNoteHandle = { open: (sticker: Sticker) => void };

// The card that opens when a sticker is clicked or tapped (Figma 862:857).
// A native modal <dialog>: it sits in the top layer above the whole page,
// traps focus, closes on Escape, and hands focus back to the sticker.
export function StickerNote({ ref }: { ref: Ref<StickerNoteHandle> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Kept after closing so the card doesn't empty out during its exit fade.
  const [sticker, setSticker] = useState<Sticker | null>(null);
  // The backdrop only closes the card when the whole click happened on it. A
  // touch tap that opens the card is followed by a compatibility click at the
  // same spot, which now lands on the backdrop and must not close it again.
  const pressedBackdrop = useRef(false);
  const labelId = useId();
  const noteId = useId();

  useImperativeHandle(
    ref,
    () => ({
      open(next) {
        const dialog = dialogRef.current;
        if (!dialog) return;
        flushSync(() => setSticker(next));
        if (dialog.open) return;
        dialog.showModal();
        // The page stays put behind the card. The gutter keeps the layout from
        // shifting where the scrollbar takes up space.
        const root = document.documentElement;
        root.style.overflow = "hidden";
        root.style.scrollbarGutter = "stable";
      },
    }),
    [],
  );

  const onClose = () => {
    const root = document.documentElement;
    root.style.overflow = "";
    root.style.scrollbarGutter = "";
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelId}
      aria-describedby={noteId}
      onClose={onClose}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) e.currentTarget.close();
        pressedBackdrop.current = false;
      }}
      // fixed + inset-0 + m-auto: stays centered while it fades out, even in
      // browsers that drop it from the top layer the moment it closes.
      className="fixed inset-0 m-auto h-fit max-h-none w-[min(440px,calc(100%-32px))] max-w-none overflow-visible bg-transparent p-0 text-neutral-900 outline-none dark:text-neutral-50 [transform:scale(0.96)] opacity-0 transition-[opacity,transform,display,overlay] transition-discrete duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] open:[transform:none] open:opacity-100 open:duration-200 starting:open:[transform:scale(0.96)] starting:open:opacity-0 backdrop:bg-black/20 backdrop:opacity-0 backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-150 open:backdrop:opacity-100 open:backdrop:duration-200 starting:open:backdrop:opacity-0 motion-reduce:transition-none motion-reduce:backdrop:transition-none dark:backdrop:bg-black/50"
    >
      {sticker && (
        <div
          className={`relative flex max-h-[calc(100dvh-32px)] flex-col items-start gap-12 overflow-y-auto overscroll-contain rounded-[32px] p-8 md:gap-16 md:rounded-[40px] md:p-10 ${sticker.bg}`}
        >
          <Image
            src={sticker.src}
            alt=""
            width={400}
            height={400}
            sizes="(min-width: 48rem) 120px, 96px"
            loading="eager"
            draggable={false}
            className="size-24 select-none md:size-30"
          />
          <p
            id={noteId}
            className="self-stretch font-semibold text-[28px] md:text-[32px] leading-[1.28] tracking-[-0.03em]"
          >
            {sticker.note}
          </p>
          {/* leading-[1.4]: Figma's "auto" line height for PP Mori. The
              browser's `normal` comes out tighter (1.25). */}
          <p id={labelId} className="text-[16px] md:text-[20px] leading-[1.4] uppercase">
            {sticker.label}
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
            // Light pill with a dark × on the light card; flipped in dark mode,
            // where the card goes deep and the text goes white.
            className="absolute top-6 right-6 flex size-10 items-center justify-center rounded-full bg-neutral-50 text-neutral-900 outline-none transition-opacity [-webkit-tap-highlight-color:transparent] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 dark:focus-visible:outline-neutral-50"
          >
            {/* The icon file is drawn in dark gray, so it's used as a mask and
                filled with the button's text color to follow the theme. */}
            <span
              aria-hidden="true"
              className="size-6 bg-current [mask:url(/footer/close.svg)_center/contain_no-repeat]"
            />
          </button>
        </div>
      )}
    </dialog>
  );
}
