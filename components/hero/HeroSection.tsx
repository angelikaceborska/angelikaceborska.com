import { Headline } from "./Headline";
import { Subtitle } from "./Subtitle";
import { Carousel } from "./Carousel";

export function HeroSection() {
  return (
    <section className="flex flex-col gap-[100px] pt-[176px] lg:pt-[224px] xl:pt-[272px] pb-20 overflow-hidden">
      <div className="px-6 md:px-0 md:grid md:grid-cols-8 md:gap-4 w-full max-w-[1728px] mx-auto">
        <div className="md:col-start-2 md:col-span-6 flex flex-col gap-1">
          <Headline />
          <Subtitle />
        </div>
      </div>
      <Carousel />
    </section>
  );
}
