"use client";

import { useEffect, useRef } from "react";

const peers = new Map<string, Set<HTMLVideoElement>>();

export function LazyVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    let group = peers.get(src);
    if (!group) {
      group = new Set();
      peers.set(src, group);
    }
    group.add(video);

    const syncToPeer = () => {
      const others = peers.get(src);
      if (!others) return;
      for (const other of others) {
        if (other !== video && other.readyState >= 2 && !other.paused) {
          if (Math.abs(other.currentTime - video.currentTime) > 0.05) {
            video.currentTime = other.currentTime;
          }
          break;
        }
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          syncToPeer();
          video.play().catch(() => {});
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      const g = peers.get(src);
      if (g) {
        g.delete(video);
        if (g.size === 0) peers.delete(src);
      }
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      loop
      muted
      playsInline
      preload="auto"
      className={className}
    />
  );
}
