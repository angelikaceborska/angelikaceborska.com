import { Headline } from "./Headline";
import { Subtitle } from "./Subtitle";
import { Carousel } from "./Carousel";

export function HeroSection() {
  return (
    <section className="flex flex-col gap-[100px] pt-[100px] pb-20 overflow-hidden">
      <div className="grid grid-cols-8 gap-4 w-full">
        <div className="col-start-2 col-span-5 flex flex-col">
          <Headline />
          <Subtitle />
        </div>
      </div>
      <Carousel />
    </section>
  );
}
