import Image from "next/image";
import type { Experience } from "./experience-data";

export function ExperienceCard({ experience }: { experience: Experience }) {
  return (
    <article className="flex flex-col gap-6 rounded-3xl md:rounded-[28px] lg:rounded-[32px] bg-surface-secondary p-6 md:p-8 lg:p-10">
      <span
        aria-hidden
        className="font-sans font-semibold text-[48px] leading-none md:text-[56px] lg:text-[64px] text-neutral-200 dark:text-neutral-800"
      >
        {experience.number}
      </span>

      <div className="flex items-center gap-2 flex-wrap">
        <Image
          src={experience.logo}
          alt={`${experience.company} logo`}
          width={32}
          height={32}
          className="h-5 w-5 md:h-[22px] md:w-[22px] lg:h-8 lg:w-8 rounded-full"
        />
        <span className="font-sans font-semibold text-neutral-900 dark:text-neutral-50 text-[22px] leading-[28px] md:text-[24px] md:leading-[30px] lg:text-[28px] lg:leading-[34px]">
          {experience.company}
        </span>
        <span className="font-sans text-[13px] lg:text-sm text-muted rounded-[40px] border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-950 px-2.5 py-0.5">
          {experience.tag}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="font-sans font-semibold text-neutral-900 dark:text-neutral-50 text-[16px] leading-[22px] md:text-[17px] md:leading-[23px] lg:text-[18px] lg:leading-[24px]">
          {experience.role}
        </h3>
        <p className="font-sans font-normal text-[14px] leading-[20px] lg:text-[15px] lg:leading-[22px] text-neutral-400 dark:text-neutral-500">
          {experience.period}
        </p>
      </div>

      <div className="h-px bg-border" />

      <ul className="flex flex-col gap-3">
        {experience.achievements.map((item, i) => (
          <li
            key={i}
            className="flex gap-3 font-sans font-normal text-[15px] leading-[22px] md:text-[16px] md:leading-[24px] lg:text-[18px] lg:leading-[26px] text-neutral-600 dark:text-neutral-400"
          >
            <span aria-hidden className="shrink-0">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
