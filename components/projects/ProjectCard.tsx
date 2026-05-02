import Image from "next/image";
import type { Project } from "./projects-data";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex flex-col gap-3">
      <div className="bg-surface-secondary rounded-3xl md:rounded-[32px] lg:rounded-[40px] overflow-hidden">
        <Image
          src={project.light}
          alt={project.alt}
          width={project.width}
          height={project.height}
          sizes="(min-width: 1024px) 900px, (min-width: 768px) 80vw, 100vw"
          className="w-full h-auto block dark:hidden"
        />
        <Image
          src={project.dark}
          alt={project.alt}
          width={project.width}
          height={project.height}
          sizes="(min-width: 1024px) 900px, (min-width: 768px) 80vw, 100vw"
          className="w-full h-auto hidden dark:block"
        />
      </div>
      <div className="flex items-baseline justify-between gap-6 px-1">
        <p className="text-sm leading-[20px] md:text-[20px] md:leading-[28px] text-main">{project.description}</p>
        <span className="text-xs md:text-base text-muted shrink-0 rounded-[40px] border border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 px-3 py-1">
          {project.status}
        </span>
      </div>
    </article>
  );
}
