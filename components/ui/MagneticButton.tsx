"use client";

import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { gsap } from "@/lib/gsap";
import { useIsTouch } from "@/lib/useMediaQuery";
import clsx from "clsx";

interface MagneticButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
  layered?: boolean;
  cursor?: "link" | "project" | "3d";
  target?: string;
  rel?: string;
  onClick?: (e: ReactMouseEvent<HTMLAnchorElement>) => void;
}

export default function MagneticButton({
  href,
  children,
  className,
  strength = 0.4,
  radius = 80,
  layered = true,
  cursor = "link",
  target,
  rel,
  onClick,
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
    const setInnerX = layered
      ? gsap.quickTo(inner, "x", { duration: 0.4, ease: "power3.out" })
      : null;
    const setInnerY = layered
      ? gsap.quickTo(inner, "y", { duration: 0.4, ease: "power3.out" })
      : null;

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
      target={target}
      rel={rel}
      onClick={onClick}
      data-cursor={cursor}
      className={clsx("will-change-transform", className)}
    >
      <span ref={innerRef} className="inline-flex items-center gap-3 will-change-transform">
        {children}
      </span>
    </a>
  );
}
