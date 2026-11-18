import Image from "next/image";
import { StickerStage } from "./StickerStage";

const socials = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/angelikaceborska/",
    light: "/footer/LinkedIn_LM.svg",
    dark: "/footer/LinkedIn_DM.svg",
    size: 16,
  },
  {
    name: "Dribbble",
    href: "https://dribbble.com/angelikaceborska",
    light: "/footer/Dribbble_LM.svg",
    dark: "/footer/Dribbble_DM.svg",
    size: 20,
  },
  {
    name: "GitHub",
    href: "https://github.com/angelikaceborska",
    light: "/footer/GitHub_LM.svg",
    dark: "/footer/GitHub_DM.svg",
    size: 20,
  },
];

export function FooterSection() {
  return (
    <footer id="contact" className="pt-20 scroll-mt-24">
      <div className="px-4">
        <StickerStage className="flex h-[90svh] md:h-auto md:aspect-[1696/748] flex-col items-center justify-center gap-6 md:gap-8 rounded-3xl md:rounded-[32px] lg:rounded-[40px] bg-surface-secondary px-8">
          <h2 className="relative z-[1] text-center font-semibold text-[28px] leading-[34px] md:text-[40px] md:leading-[44px] lg:text-[48px] lg:leading-[56px] tracking-[-1px] lg:tracking-[-1.44px] text-neutral-950 dark:text-neutral-50">
            Think we vibe? Cool!
          </h2>
          <a
            href="mailto:angelika.ceborska@gmail.com"
            className="relative z-[1] inline-flex items-center justify-center rounded-[40px] h-12 px-5 py-2.5 text-[16px] leading-6 transition-opacity hover:opacity-80 bg-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
          >
            Get in touch
          </a>
        </StickerStage>

        {/* Hint and socials sit in one row only on wide landscape screens.
            Narrow or portrait screens (phones, an upright iPad) stack them,
            and the hint text is centered, with the arrow hanging off its right
            side so it doesn't pull the text off-center. */}
        <div className="flex flex-col items-center gap-8 py-6 md:landscape:flex-row md:landscape:justify-between md:landscape:px-4">
          <p className="relative flex items-start text-center text-[16px] leading-[normal] tracking-[-0.03em] text-muted md:landscape:text-left">
            <span className="md:landscape:w-[187px]">
              <span className="pointer-coarse:hidden">Click</span>
              <span className="hidden pointer-coarse:inline">Tap</span> on these stickers
              <br />
              to get to know me better
            </span>
            {/* The arrow file is drawn in the light-mode gray, so it's used as
                a mask and filled with the text color to follow the theme. The
                -m-px matches Figma, where the stroke overhangs its box by 1px. */}
            <span
              aria-hidden="true"
              // ml-3.5: the same gap after "better" as in the row, where the
              // text box is 187px wide.
              className="absolute top-0 left-full -m-px ml-3.5 h-[40.5952px] w-[34.28px] shrink-0 bg-current [mask:url(/footer/hint-arrow.svg)_center/contain_no-repeat] md:landscape:static md:landscape:-ml-px"
            />
          </p>
          <ul className="flex items-center gap-4">
            {socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-100 transition-opacity hover:opacity-80 dark:border-neutral-900"
                >
                  <Image
                    src={social.light}
                    alt=""
                    width={social.size}
                    height={social.size}
                    className="dark:hidden"
                  />
                  <Image
                    src={social.dark}
                    alt=""
                    width={social.size}
                    height={social.size}
                    className="hidden dark:block"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
