import { notFound } from "next/navigation";

// Any unknown path under a locale renders that locale's not-found page
// (app/[lang]/not-found.tsx) inside the localized root layout.
export default function CatchAll() {
  notFound();
}
