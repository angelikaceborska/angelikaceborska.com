import type { AboutIconName } from "./icons";

export type AboutFact = {
  icon: AboutIconName;
  title: string;
  subtitle: string;
  bg: string;
};

export const aboutFacts: AboutFact[] = [
  {
    icon: "experience",
    title: "5+",
    subtitle: "Years of experience",
    bg: "bg-[#2E9CFF] dark:bg-[#046FD4]",
  },
  {
    icon: "prototype",
    title: "Prototype",
    subtitle: "In code, when it matters",
    bg: "bg-[#F37125] dark:bg-[#AF5800]",
  },
  {
    icon: "apps",
    title: "10+",
    subtitle: "Products shipped end-to-end",
    bg: "bg-[#8084EF] dark:bg-[#565EC0]",
  },
  {
    icon: "achievements",
    title: "2× faster",
    subtitle: "Onboarding, rebuilt at UNUM",
    bg: "bg-[#FBD0E0] dark:bg-[#9D5B7F]",
  },
  {
    icon: "motion",
    title: "In-between",
    subtitle: "Motion & micro-interactions",
    bg: "bg-[#FFC700] dark:bg-[#8A6C00]",
  },
  {
    icon: "location",
    title: "Wroclaw",
    subtitle: "But designing worldwide",
    bg: "bg-[#9DB83F] dark:bg-[#6A7705]",
  },
];
