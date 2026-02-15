export type CardData =
  | {
      type: "image";
      themed: true;
      light: string;
      dark: string;
      alt: string;
      featured?: false;
    }
  | {
      type: "image";
      themed: false;
      src: string;
      alt: string;
      featured?: boolean;
    }
  | {
      type: "video";
      themed: true;
      light: { src: string; poster: string };
      dark: { src: string; poster: string };
      alt: string;
      featured?: false;
    }
  | {
      type: "video";
      themed: false;
      src: string;
      poster: string;
      alt: string;
      featured?: boolean;
    };

export const cards: CardData[] = [
  {
    type: "image",
    themed: true,
    light: "/hero/Asset_Image_1_LM.png",
    dark: "/hero/Asset_Image_1_DM.png",
    alt: "Project showcase 1",
  },
  {
    type: "video",
    themed: true,
    light: {
      src: "/hero/Asset_Video_2_LM.mp4",
      poster: "/hero/Asset_Preview_2_LM.png",
    },
    dark: {
      src: "/hero/Asset_Video_2_DM.mp4",
      poster: "/hero/Asset_Preview_2_DM.png",
    },
    alt: "Project showcase 2",
  },
  {
    type: "video",
    themed: false,
    src: "/hero/Asset_Video_3.mp4",
    poster: "/hero/Asset_Preview_3.png",
    alt: "Project showcase 3",
    featured: true,
  },
  {
    type: "video",
    themed: true,
    light: {
      src: "/hero/Asset_Video_4_LM.mp4",
      poster: "/hero/Asset_Preview_4_LM.png",
    },
    dark: {
      src: "/hero/Asset_Video_4_DM.mp4",
      poster: "/hero/Asset_Preview_4_DM.png",
    },
    alt: "Project showcase 4",
  },
  {
    type: "image",
    themed: true,
    light: "/hero/Asset_Image_5_LM.png",
    dark: "/hero/Asset_Image_5_DM.png",
    alt: "Project showcase 5",
  },
];
