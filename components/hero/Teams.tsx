import Image from "next/image";
import { UnumLogo } from "./logos/UnumLogo";
import { BiobarLogo } from "./logos/BiobarLogo";

export function Teams() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted">I worked with the teams at:</p>
      <div className="flex items-center gap-6 opacity-50">
        <div className="flex items-center gap-2">
          <Image
            src="/hero/Kerlig.png"
            alt="Kerlig"
            width={24}
            height={24}
            className="rounded-md grayscale"
          />
          <span className="text-sm font-semibold tracking-tighter">Kerlig</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src="/hero/Journal.png"
            alt="Journal"
            width={24}
            height={24}
            className="rounded-md grayscale"
          />
          <span className="text-sm font-semibold tracking-tighter">
            Journal
          </span>
        </div>
        <UnumLogo />
        <BiobarLogo />
      </div>
    </div>
  );
}
