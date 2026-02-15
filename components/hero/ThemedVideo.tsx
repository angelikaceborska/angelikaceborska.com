"use client";

import { useEffect, useState } from "react";

export function ThemedVideo({
  light,
  dark,
}: {
  light: { src: string; poster: string };
  dark: { src: string; poster: string };
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const active = isDark ? dark : light;

  return (
    <video
      key={active.src}
      autoPlay
      loop
      muted
      playsInline
      poster={active.poster}
      className="w-full h-full object-cover"
    >
      <source src={active.src} type="video/mp4" />
    </video>
  );
}
