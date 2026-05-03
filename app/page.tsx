import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero";
import { ProjectsSection } from "@/components/projects";
import { ExperienceSection } from "@/components/experience";
import { AboutSection } from "@/components/about";
import { FooterSection } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <HeroSection />
      <ProjectsSection />
      <ExperienceSection />
      <AboutSection />
      <FooterSection />
    </>
  );
}
