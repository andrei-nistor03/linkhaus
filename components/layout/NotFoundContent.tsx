"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localePath } from "@/lib/i18n/config";

export default function NotFoundContent() {
  const { locale, dict } = useI18n();

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-paper px-5 text-center text-ink sm:px-8">
      <p className="font-mono-label text-xs text-muted">{dict.notFound.eyebrow}</p>
      <h1 className="mt-4 font-display font-black uppercase leading-[0.85] tracking-wide [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(6rem,24vw,18rem)]">
        404
      </h1>
      <p className="mt-6 max-w-md text-base text-muted sm:text-lg">{dict.notFound.body}</p>
      <Link
        href={localePath(locale)}
        className="font-mono-label mt-10 inline-flex items-center rounded-full bg-ink px-6 py-3 text-xs text-paper transition-opacity duration-300 hover:opacity-80"
      >
        {dict.notFound.backHome}
      </Link>
    </main>
  );
}
