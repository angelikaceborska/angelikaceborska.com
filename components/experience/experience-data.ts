export type Experience = {
  number: string;
  logo: string;
  company: string;
  tag: string;
  role: string;
  period: string;
  achievements: string[];
};

export const experiences: Experience[] = [
  {
    number: "01",
    logo: "/my experience/Logo_UNUM.svg",
    company: "UNUM",
    tag: "SaaS Platform",
    role: "Lead Product Designer",
    period: "Jul 2023 — Present • Full time",
    achievements: [
      "Led onboarding and sidebar redesign after funnel analysis showed 52% of signups never reached first-post. Activation time dropped from ~8 min to ~4 min (web cohort, Jan–Mar 2026, n=5k).",
      "Designed the agency tier — a premium plan with multi-user workspaces, roles, and permissions — expanding the product to a new market segment and increasing paid signups by 4% (web cohort, Oct–Dec 2024, n=5k).",
      "Shipped iOS splash and first-run flow; lifted signup completion by ~5% (A/B test, 4-week run, Apr 2024).",
    ],
  },
  {
    number: "02",
    logo: "/my experience/Logo_Kerlig.svg",
    company: "Kerlig AI",
    tag: "B2C Product",
    role: "Growth Product Designer",
    period: "May 2025 — May 2026 • Freelance",
    achievements: [
      "Owned growth design across acquisition, activation, and retention surfaces — landing pages, onboarding, and lifecycle touchpoints.",
      "Designed and shipped A/B test on the pricing page, partnered with the Founder and analytics to define hypotheses and interpret results.",
      "Created lifecycle email templates with a tailored messaging strategy for each stage of the customer journey.",
    ],
  },
  {
    number: "03",
    logo: "/my experience/Logo_Dragon Scale.svg",
    company: "Dragon Scale",
    tag: "UX Studio",
    role: "Product Designer",
    period: "May 2022 — Jul 2023 • Full time",
    achievements: [
      "Took three client products from concept to alpha; one marketplace platform with a booking system and two client dashboards for managing car washes and parking lots, owning flows, IA, and UI.",
      "Co-lead discovery and alignment workshops with client stakeholders to translate fuzzy briefs into shipped scope.",
      "Set up the Figma handoff system (component library, spec conventions, naming) the studio reused across projects.",
    ],
  },
  {
    number: "04",
    logo: "/my experience/Logo_Journal.svg",
    company: "Journal",
    tag: "B2C Product",
    role: "Product Designer",
    period: "Sep 2021 — Aug 2022 • Freelance",
    achievements: [
      "Enhanced landing page design and optimized user flow, leading to a 10% surge in lead generation.",
      "Built the first version of the design system — 10 core components, tokens, and documentation — which unblocked the dev team.",
      "Collaborated closely with developers to ensure pixel-perfect implementation.",
    ],
  },
];
