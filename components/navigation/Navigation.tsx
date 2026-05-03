import Image from "next/image";

const links = [
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#experience" },
  { label: "About", href: "#about" },
];

export function Navigation() {
  return (
    <nav
      aria-label="Primary"
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex w-[calc(100%-32px)] md:w-[750px] items-center justify-between rounded-[40px] p-2 backdrop-blur-[4px] bg-[rgba(255,255,255,0.90)] dark:bg-[rgba(12,12,13,0.85)]"
    >
      <a
        href="#top"
        aria-label="Home"
        className="block h-12 w-12 shrink-0 overflow-hidden rounded-[40px] border border-neutral-100 dark:border-neutral-900"
      >
        <Image
          src="/Avatar/Avatar.avif"
          alt="Angelika Ceborska"
          width={48}
          height={48}
          className="h-full w-full object-cover"
          priority
        />
      </a>

      <ul className="hidden md:flex items-center gap-12">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-center text-[17px] font-semibold leading-5 tracking-[-0.17px] text-neutral-900 transition-opacity hover:opacity-70 dark:text-neutral-100"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <a
        href="mailto:angelika.ceborska@gmail.com"
        className="inline-flex items-center justify-center rounded-[40px] px-5 py-2.5 text-[16px] leading-6 transition-opacity hover:opacity-80 bg-neutral-950 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-950"
      >
        Contact
      </a>
    </nav>
  );
}
