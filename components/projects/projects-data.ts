export type Project = {
  image: string;
  width: number;
  height: number;
  description: string;
  status: string;
  alt: string;
};

export const projects: Project[] = [
  {
    image: "/my projects/Project image 1.avif",
    width: 2584,
    height: 1614,
    description:
      "Boosting paid sign-ups by 4% by designing an agency-scale workspace model",
    status: "Case study soon",
    alt: "Workspace invite modal",
  },
  {
    image: "/my projects/Project image 2.avif",
    width: 2584,
    height: 1500,
    description:
      "Cutting activation time from 7 minutes to 4 by restructuring how users enter the product",
    status: "Case study soon",
    alt: "Channel connection onboarding",
  },
  {
    image: "/my projects/Project image 3.avif",
    width: 2584,
    height: 1500,
    description:
      "Lifting multi-platform posts per user by 5% by redesigning the editor for cross-platform publishing",
    status: "Case study soon",
    alt: "Cross-platform post editor",
  },
];
