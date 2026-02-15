import Image from "next/image";

export function ThemedImage({
  light,
  dark,
  alt,
}: {
  light: string;
  dark: string;
  alt: string;
}) {
  return (
    <>
      <Image
        src={light}
        alt={alt}
        width={300}
        height={300}
        className="w-full h-full object-cover dark:hidden"
      />
      <Image
        src={dark}
        alt={alt}
        width={300}
        height={300}
        className="hidden dark:block w-full h-full object-cover"
      />
    </>
  );
}
