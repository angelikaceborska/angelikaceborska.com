import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const ppMori = localFont({
  src: [
    { path: "./fonts/PPMori-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/PPMori-Semibold.woff", weight: "600", style: "normal" },
  ],
  variable: "--font-ppmori",
});

export const metadata: Metadata = {
  title: "Angelika Ceborska",
  description: "Product Designer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ppMori.variable}>
      <body className="font-sans bg-surface text-main">{children}</body>
    </html>
  );
}
