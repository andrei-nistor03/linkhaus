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
  /** How far beyond the button's own edges (in px) the pull starts. */
  radius?: number;
  /**
   * When true (default), the inner content moves further than the shell for
   * a layered, physical feel. When false, the content rides along with the
   * shell only — the two move as one solid unit.
   */
  layered?: boolean;
  cursor?: "link" | "project" | "3d";
}

/**
 * A button that leans toward the cursor as it approaches — the pull fades
 * in from `radius` px outside the button's edges and strengthens toward the
 * center, so it's already drifting before the cursor lands on it, not just
 * reacting once hovered. No-ops on touch devices.
 *
 * `className` must supply its own `display` utility (e.g. `flex`,
 * `inline-flex`, `hidden md:flex`) — the shell doesn't default to one, so a
 * caller-provided value like `hidden md:flex` isn't fighting a hardcoded
 * `inline-flex` at the same breakpoint.
 */
export default function MagneticButton({
  href,
  children,
  className,
  strength = 0.4,
  radius = 80,
  layered = true,
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
    // Inner content is a DOM child of the shell, so it already inherits the
    // shell's transform for free. Only give it its own extra motion (on top
    // of that) when a layered/parallax feel is wanted.
    const setInnerX = layered
      ? gsap.quickTo(inner, "x", { duration: 0.4, ease: "power3.out" })
      : null;
    const setInnerY = layered
      ? gsap.quickTo(inner, "y", { duration: 0.4, ease: "power3.out" })
      : null;

    // Tracked on the document (not just the shell) so the pull can kick in
    // from outside the button's own box, within `radius` of its edges.
    const onMove = (e: MouseEvent) => {
      const rect = shell.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      const edgeDist = Math.max(
        0,
        Math.hypot(relX, relY) - Math.min(rect.width, rect.height) / 2,
      );

      if (edgeDist > radius) {
        setShellX(0);
        setShellY(0);
        setInnerX?.(0);
        setInnerY?.(0);
        return;
      }

      const pull = 1 - edgeDist / radius;
      setShellX(relX * strength * pull);
      setShellY(relY * strength * pull);
      setInnerX?.(relX * strength * 1.6 * pull);
      setInnerY?.(relY * strength * 1.6 * pull);
    };
    const onLeaveWindow = () => {
      setShellX(0);
      setShellY(0);
      setInnerX?.(0);
      setInnerY?.(0);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeaveWindow);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, [isTouch, strength, radius, layered]);

  return (
    <a
      ref={shellRef}
      href={href}
      data-cursor={cursor}
      className={clsx("will-change-transform", className)}
    >
      <span ref={innerRef} className="inline-flex items-center gap-3 will-change-transform">
        {children}
      </span>
    </a>
  );
}
