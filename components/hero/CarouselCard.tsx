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
          width={300}
          height={300}
          className="w-full h-full object-cover"
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
      <div className="shrink-0 w-[300px] h-[300px] rounded-2xl overflow-hidden">
        {media}
      </div>
    );
  }

  return (
    <div className="shrink-0 w-[300px] h-[300px] rounded-2xl overflow-hidden bg-surface-secondary p-3">
      <div className="w-full h-full rounded-xl overflow-hidden">{media}</div>
    </div>
  );
}
