export type Project = {
  light: string;
  dark: string;
  width: number;
  height: number;
  description: string;
  status: string;
  alt: string;
};

export const projects: Project[] = [
  {
    light: "/my projects/Asset_Project_1_LM.avif",
    dark: "/my projects/Asset_Project_1_DM.avif",
    width: 1938,
    height: 1212,
    description:
      "Boosting paid sign-ups by 4% by designing an agency-scale workspace model",
    status: "Case study soon",
    alt: "Workspace invite modal",
  },
  {
    light: "/my projects/Asset_Project_2_LM.avif",
    dark: "/my projects/Asset_Project_2_DM.avif",
    width: 1938,
    height: 1212,
    description:
      "Cutting activation time from 7 minutes to 4 by restructuring how users enter the product",
    status: "Case study soon",
    alt: "Channel connection onboarding",
  },
  {
    light: "/my projects/Asset_Project_3_LM.avif",
    dark: "/my projects/Asset_Project_3_DM.avif",
    width: 1938,
    height: 1212,
    description:
      "Lifting multi-platform posts per user by 5% by redesigning the editor for cross-platform publishing",
    status: "Case study soon",
    alt: "Cross-platform post editor",
  },
];
