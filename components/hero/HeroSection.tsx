import { Headline } from "./Headline";
import { Subtitle } from "./Subtitle";
import { Carousel } from "./Carousel";
import { Teams } from "./Teams";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center gap-12 py-20 overflow-hidden">
      <div className="flex flex-col items-center gap-4 px-6">
        <Headline />
        <Subtitle />
      </div>
      <Carousel />
      <Teams />
    </section>
  );
}
