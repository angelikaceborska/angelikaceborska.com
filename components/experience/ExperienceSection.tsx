import { ExperienceCard } from "./ExperienceCard";
import { experiences } from "./experience-data";

export function ExperienceSection() {
  return (
    <section id="experience" className="flex flex-col gap-12 md:gap-20 px-6 md:px-0 pt-20 pb-20 scroll-mt-24">
      <h2 className="font-semibold text-[28px] leading-[34px] md:text-[40px] md:leading-[44px] tracking-[-1px] text-main text-center">
        My path in
        <br />
        product design
      </h2>
      <div className="md:grid md:grid-cols-8 md:gap-4 w-full max-w-[1728px] mx-auto">
        <div className="md:col-start-2 md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.number} experience={experience} />
          ))}
        </div>
      </div>
    </section>
  );
}
