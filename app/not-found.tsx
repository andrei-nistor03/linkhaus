import type { Metadata } from "next";
import Link from "next/link";
import CustomCursor from "@/components/layout/CustomCursor";

export const metadata: Metadata = {
  title: "Page not found — LINKHAUS",
};

export default function NotFound() {
  return (
    <>
      <CustomCursor />
      <main className="flex min-h-[100svh] flex-col items-center justify-center bg-paper px-5 text-center text-ink sm:px-8">
        <p className="font-mono-label text-xs text-muted">Error 404</p>
        <h1 className="mt-4 font-display font-black uppercase leading-[0.85] tracking-wide [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(6rem,24vw,18rem)]">
          404
        </h1>
        <p className="mt-6 max-w-md text-base text-muted sm:text-lg">
          This room of the house doesn&apos;t exist. The page may have moved, or the link is broken.
        </p>
        <Link
          href="/"
          className="font-mono-label mt-10 inline-flex items-center rounded-full bg-ink px-6 py-3 text-xs text-paper transition-opacity duration-300 hover:opacity-80"
        >
          Back to home
        </Link>
      </main>
    </>
  );
}
