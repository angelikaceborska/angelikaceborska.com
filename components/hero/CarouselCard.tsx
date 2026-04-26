import Image from "next/image";
import type { CardData } from "./carousel-data";
import { ThemedImage } from "./ThemedImage";
import { ThemedVideo } from "./ThemedVideo";

export function CarouselCard({ card }: { card: CardData }) {
  const isFeatured = "featured" in card && card.featured;

  const media =
    card.type === "image" ? (
      card.themed ? (
        <ThemedImage light={card.light} dark={card.dark} alt={card.alt} />
      ) : (
        <Image
          src={card.src}
          alt={card.alt}
          fill
          className="object-cover"
        />
      )
    ) : card.themed ? (
      <ThemedVideo light={card.light} dark={card.dark} />
    ) : (
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={card.poster}
        className="w-full h-full object-cover"
      >
        <source src={card.src} type="video/mp4" />
      </video>
    );

  if (isFeatured) {
    return (
      <div className="relative shrink-0 w-[240px] h-[240px] rounded-3xl md:w-[336px] md:h-[336px] md:rounded-[32px] lg:w-[420px] lg:h-[420px] lg:rounded-[40px] overflow-hidden">
        {media}
      </div>
    );
  }

  return (
    <div className="shrink-0 w-[240px] h-[240px] rounded-3xl md:w-[336px] md:h-[336px] md:rounded-[32px] lg:w-[420px] lg:h-[420px] lg:rounded-[40px] overflow-hidden bg-surface-secondary p-3">
      <div className="relative w-full h-full rounded-xl md:rounded-[20px] lg:rounded-[28px] overflow-hidden">{media}</div>
    </div>
  );
}
