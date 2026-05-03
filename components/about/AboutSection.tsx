import { AboutCarousel } from "./AboutCarousel";

export function AboutSection() {
  return (
    <section id="about" className="flex flex-col gap-12 md:gap-16 pt-20 pb-20 scroll-mt-24">
      <div className="md:grid md:grid-cols-8 md:gap-4 w-full max-w-[1728px] mx-auto px-6 md:px-0">
        <h2 className="md:col-start-2 md:col-span-6 font-semibold text-[28px] leading-[34px] md:text-[40px] md:leading-[44px] tracking-[-1px] text-main">
          Just a few more facts
          <br />
          about me
        </h2>
      </div>
      <AboutCarousel />
    </section>
  );
}
