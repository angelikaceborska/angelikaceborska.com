import { ProjectCard } from "./ProjectCard";
import { projects } from "./projects-data";

export function ProjectsSection() {
  return (
    <section id="projects" className="flex flex-col gap-12 md:gap-20 px-6 md:px-0 pt-20 pb-20 scroll-mt-24">
      <h2 className="font-semibold text-[28px] leading-[34px] md:text-[40px] md:leading-[44px] tracking-[-1px] text-main text-center">
        Take a look at
        <br />
        my greatest &amp; latest
      </h2>
      <div className="md:grid md:grid-cols-8 md:gap-4 w-full max-w-[1728px] mx-auto">
        <div className="md:col-start-2 md:col-span-6 flex flex-col gap-20 md:gap-[120px] lg:gap-[160px]">
          {projects.map((project) => (
            <ProjectCard key={project.light} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
