import type { Metadata } from "next";
import CustomCursor from "@/components/layout/CustomCursor";
import NotFoundContent from "@/components/layout/NotFoundContent";

// not-found pages don't receive route params, so the title can't follow the
// locale; the visible copy does (NotFoundContent reads it from I18nProvider).
export const metadata: Metadata = {
  title: "Page not found — LINKHAUS",
};

export default function NotFound() {
  return (
    <>
      <CustomCursor />
      <NotFoundContent />
    </>
  );
}
