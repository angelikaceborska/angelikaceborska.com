import { UnumLogo } from "./logos/UnumLogo";
import { BiobarLogo } from "./logos/BiobarLogo";

export function Teams() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-muted">I worked with the teams at:</p>
      <div className="flex items-center gap-6">
        <UnumLogo />
        <BiobarLogo />
      </div>
    </div>
  );
}
