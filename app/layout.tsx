import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
