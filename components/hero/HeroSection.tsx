import { Headline } from "./Headline";
import { Subtitle } from "./Subtitle";
import { Carousel } from "./Carousel";

export function HeroSection() {
  return (
    <section className="flex flex-col gap-[100px] pt-[100px] pb-20 overflow-hidden">
      <div className="px-6 md:px-0 md:grid md:grid-cols-8 md:gap-4 w-full">
        <div className="md:col-start-2 md:col-span-5 flex flex-col">
          <Headline />
          <Subtitle />
        </div>
      </div>
      <Carousel />
    </section>
  );
}
