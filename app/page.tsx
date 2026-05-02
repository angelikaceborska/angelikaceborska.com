import { HeroSection } from "@/components/hero";
import { ProjectsSection } from "@/components/projects";
import { ExperienceSection } from "@/components/experience";
import { AboutSection } from "@/components/about";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProjectsSection />
      <ExperienceSection />
      <AboutSection />
    </>
  );
}
