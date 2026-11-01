"use client";

import { useLenis } from "@/lib/useLenis";
import { usePointerTracker } from "@/lib/usePointerTracker";

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useLenis();
  usePointerTracker();

  return <>{children}</>;
}
