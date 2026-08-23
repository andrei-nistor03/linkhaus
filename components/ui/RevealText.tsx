"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import clsx from "clsx";

interface RevealTextProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "div";
  /** stagger delay multiplier between lines */
  stagger?: number;
  /** trigger animation on scroll instead of immediately */
  scroll?: boolean;
  delay?: number;
}

/**
 * Masks its children (typically one or more block-level lines) and reveals
 * them with a clipped upward slide. Each direct child becomes its own
 * "line" so callers can pass multiple <span> lines for a staggered effect.
 */
export default function RevealText({
  children,
  className,
  as = "div",
  stagger = 0.08,
  scroll = true,
  delay = 0,
}: RevealTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = as as any;

  useEffect(() => {
    registerGsap();
    const root = ref.current;
    if (!root) return;
    const lines = root.querySelectorAll(".reveal-line");

    const tween = gsap.fromTo(
      lines,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: "expo.out",
        stagger,
        delay,
        scrollTrigger: scroll
          ? { trigger: root, start: "top 85%", once: true }
          : undefined,
        paused: !scroll ? true : false,
      }
    );

    if (!scroll) tween.play(0.1);

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [scroll, stagger, delay]);

  return (
    <Tag ref={ref} className={clsx(className)}>
      {children}
    </Tag>
  );
}

/** One masked line to place inside <RevealText>. */
export function Line({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className="block overflow-hidden">
      <span className={clsx("reveal-line block", className)}>{children}</span>
    </span>
  );
}
