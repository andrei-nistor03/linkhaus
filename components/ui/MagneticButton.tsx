"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsTouch } from "@/lib/useMediaQuery";
import clsx from "clsx";

interface MagneticButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  strength?: number;
  cursor?: "link" | "project" | "3d";
}

/**
 * A button that leans toward the cursor within its hover radius, with the
 * inner content moving slightly further than the shell for a layered,
 * physical feel. No-ops on touch devices.
 */
export default function MagneticButton({
  href,
  children,
  className,
  strength = 0.4,
  cursor = "link",
}: MagneticButtonProps) {
  const shellRef = useRef<HTMLAnchorElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const isTouch = useIsTouch();

  useEffect(() => {
    if (isTouch) return;
    const shell = shellRef.current!;
    const inner = innerRef.current!;

    const setShellX = gsap.quickTo(shell, "x", { duration: 0.5, ease: "power3.out" });
    const setShellY = gsap.quickTo(shell, "y", { duration: 0.5, ease: "power3.out" });
    const setInnerX = gsap.quickTo(inner, "x", { duration: 0.4, ease: "power3.out" });
    const setInnerY = gsap.quickTo(inner, "y", { duration: 0.4, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      const rect = shell.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      setShellX(relX * strength);
      setShellY(relY * strength);
      setInnerX(relX * strength * 1.6);
      setInnerY(relY * strength * 1.6);
    };
    const onLeave = () => {
      setShellX(0);
      setShellY(0);
      setInnerX(0);
      setInnerY(0);
    };

    shell.addEventListener("mousemove", onMove);
    shell.addEventListener("mouseleave", onLeave);
    return () => {
      shell.removeEventListener("mousemove", onMove);
      shell.removeEventListener("mouseleave", onLeave);
    };
  }, [isTouch, strength]);

  return (
    <a
      ref={shellRef}
      href={href}
      data-cursor={cursor}
      className={clsx("inline-flex items-center justify-center will-change-transform", className)}
    >
      <span ref={innerRef} className="inline-flex items-center gap-3 will-change-transform">
        {children}
      </span>
    </a>
  );
}
