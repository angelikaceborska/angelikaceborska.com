import { cards } from "./carousel-data";
import { CarouselCard } from "./CarouselCard";

export function Carousel() {
  // Each half needs to be wider than the widest viewport (~2560px).
  // 10 cards × (300px + gap) ≈ 3160px per half — covers ultra-wide screens.
  const set = [...cards, ...cards];
  const doubled = [...set, ...set];

  return (
    <div className="w-full overflow-hidden">
      <div className="flex gap-4 md:gap-6 animate-marquee hover:[animation-play-state:paused] w-max">
        {doubled.map((card, i) => (
          <CarouselCard key={i} card={card} />
        ))}
      </div>
    </div>
  );
}
