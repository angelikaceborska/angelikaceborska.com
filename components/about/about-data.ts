export type AboutFact = {
  iconLight: string;
  iconDark: string;
  title: string;
  subtitle: string;
  bg: string;
};

export const aboutFacts: AboutFact[] = [
  {
    iconLight: "/about me/About.svg",
    iconDark: "/about me/About_DM.svg",
    title: "5+",
    subtitle: "Years of experience",
    bg: "bg-[#2E9CFF] dark:bg-[#046FD4]",
  },
  {
    iconLight: "/about me/Claude_Code.svg",
    iconDark: "/about me/Claude_Code_DM.svg",
    title: "Prototype",
    subtitle: "In code, when it matters",
    bg: "bg-[#F37125] dark:bg-[#AF5800]",
  },
  {
    iconLight: "/about me/Apps.svg",
    iconDark: "/about me/Apps_DM.svg",
    title: "10+",
    subtitle: "Products shipped end-to-end",
    bg: "bg-[#8084EF] dark:bg-[#565EC0]",
  },
  {
    iconLight: "/about me/Achivements.svg",
    iconDark: "/about me/Achivements_DM.svg",
    title: "2× faster",
    subtitle: "Onboarding, rebuilt at UNUM",
    bg: "bg-[#FBD0E0] dark:bg-[#9D5B7F]",
  },
  {
    iconLight: "/about me/Motion.svg",
    iconDark: "/about me/Motion_DM.svg",
    title: "In-between",
    subtitle: "Motion & micro-interactions",
    bg: "bg-[#FFC700] dark:bg-[#8A6C00]",
  },
  {
    iconLight: "/about me/Pin.svg",
    iconDark: "/about me/Pin_DM.svg",
    title: "Wroclaw",
    subtitle: "But designing worldwide",
    bg: "bg-[#9DB83F] dark:bg-[#6A7705]",
  },
];
