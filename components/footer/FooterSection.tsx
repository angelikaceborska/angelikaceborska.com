import Image from "next/image";

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
    <footer id="contact" className="px-6 md:px-0 pt-20 pb-6 md:pb-8 scroll-mt-24">
      <div className="md:grid md:grid-cols-8 md:gap-4 w-full max-w-[1728px] mx-auto">
        <div className="md:col-start-2 md:col-span-6 flex h-[472px] flex-col items-center justify-between self-stretch rounded-3xl md:rounded-[28px] lg:rounded-[32px] bg-surface-secondary px-8 py-12">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 md:gap-8">
            <h2 className="text-center font-semibold text-[28px] leading-[34px] md:text-[40px] md:leading-[44px] lg:text-[48px] lg:leading-[56px] tracking-[-1px] lg:tracking-[-1.44px] text-neutral-950 dark:text-neutral-50">
              Think we vibe? Cool!
            </h2>
            <a
              href="mailto:angelika.ceborska@gmail.com"
              className="inline-flex items-center justify-center gap-2 rounded-[40px] bg-neutral-200 px-5 py-2.5 text-center text-[15px] leading-[22px] md:text-[16px] md:leading-[24px] lg:text-[18px] lg:leading-[28px] lg:tracking-[-0.18px] text-neutral-950 transition-opacity hover:opacity-80 dark:bg-neutral-800 dark:text-neutral-50"
            >
              Get in touch
            </a>
          </div>

          <ul className="flex items-center gap-3">
            {socials.map((social) => (
              <li key={social.name}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 shadow-[0_4px_10px_2px_rgba(238,238,238,0.6)] transition-opacity hover:opacity-80 dark:border-neutral-900 dark:bg-neutral-950 dark:shadow-none"
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
