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

        <ul className="flex items-center justify-center gap-4 pt-10 pb-6">
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
    </footer>
  );
}
