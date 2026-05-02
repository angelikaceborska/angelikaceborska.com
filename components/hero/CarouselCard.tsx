import Image from "next/image";
import type { CardData } from "./carousel-data";
import { ThemedImage } from "./ThemedImage";
import { ThemedVideo } from "./ThemedVideo";
import { LazyVideo } from "./LazyVideo";

export function CarouselCard({ card }: { card: CardData }) {
  const media =
    card.type === "image" ? (
      card.themed ? (
        <ThemedImage light={card.light} dark={card.dark} alt={card.alt} />
      ) : (
        <Image src={card.src} alt={card.alt} fill className="object-cover" />
      )
    ) : card.themed ? (
      <ThemedVideo light={card.light} dark={card.dark} />
    ) : (
      <LazyVideo
        key={card.src}
        src={card.src}
        poster={card.poster}
        className="w-full h-full object-cover"
      />
    );

  return (
    <div className="relative shrink-0 w-[240px] h-[240px] rounded-3xl md:w-[336px] md:h-[336px] md:rounded-[32px] lg:w-[420px] lg:h-[420px] lg:rounded-[40px] overflow-hidden">
      {media}
    </div>
  );
}
