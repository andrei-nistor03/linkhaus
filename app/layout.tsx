import type { Metadata, Viewport } from "next";
import { grotesk, mono, thunder } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINKHAUS — Digital Craft & Engineering",
  description:
    "LINKHAUS is a creative technology studio building experimental, art-directed digital experiences at the intersection of design, motion and 3D.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f3ee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable} ${thunder.variable}`}>
      <body>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
