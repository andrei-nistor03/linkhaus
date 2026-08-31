"use client";

import type { MouseEvent } from "react";
import MagneticButton from "@/components/ui/MagneticButton";

interface FooterLinkProps {
  href: string;
  label: string;
  external?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * One nav/social row in the footer: the same underline + sliding-arrow
 * hover language as Nav.tsx's own links and Contact.tsx's email CTA, riding
 * MagneticButton (`layered={false}` — a small shell-only pull, not the
 * exaggerated inner-content parallax the big Contact CTAs use) for the same
 * "leans toward the cursor" interaction used throughout the site, just at
 * the footer's calmer, smaller scale.
 */
export default function FooterLink({ href, label, external, onClick }: FooterLinkProps) {
  return (
    <MagneticButton
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onClick}
      radius={56}
      strength={0.14}
      layered={false}
      cursor="link"
      className="group inline-flex w-fit"
    >
      <span className="relative font-mono-label text-sm text-paper/55 transition-colors duration-300 ease-art group-hover:text-paper sm:text-base">
        {label}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-paper/60 transition-transform duration-300 ease-art group-hover:scale-x-100" />
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0 -translate-x-1.5 text-paper/70 opacity-0 transition-all duration-300 ease-art group-hover:translate-x-0 group-hover:opacity-100"
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </MagneticButton>
  );
}
