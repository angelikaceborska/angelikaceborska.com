import type { AboutFact } from "./about-data";
import { aboutIcons } from "./icons";

export function AboutCard({ fact }: { fact: AboutFact }) {
  const Icon = aboutIcons[fact.icon];
  return (
    <article
      className={`about-card flex flex-col justify-between shrink-0 w-[240px] h-[300px] rounded-3xl md:w-[336px] md:h-[420px] md:rounded-[32px] lg:w-[420px] lg:h-[525px] lg:rounded-[40px] p-6 md:p-8 lg:p-10 ${fact.bg}`}
    >
      <div className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 text-neutral-950 dark:text-neutral-50">
        <Icon className="h-full w-full block" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-sans font-semibold text-neutral-950 dark:text-neutral-50 text-[32px] leading-[36px] tracking-[-0.64px] md:text-[40px] md:leading-[44px] md:tracking-[-0.8px] lg:text-[48px] lg:leading-[52px] lg:tracking-[-0.96px]">
          {fact.title}
        </h3>
        <p className="font-sans font-normal text-neutral-950 dark:text-neutral-50 text-[18px] leading-[24px] tracking-[-0.36px] md:text-[20px] md:leading-[26px] md:tracking-[-0.4px] lg:text-[24px] lg:leading-[30px] lg:tracking-[-0.48px]">
          {fact.subtitle}
        </p>
      </div>
    </article>
  );
}
