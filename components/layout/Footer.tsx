"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";
import { requestSectionTransition } from "@/lib/navTransitionState";
import MagneticButton from "@/components/ui/MagneticButton";
import FooterBackdrop from "@/components/footer/FooterBackdrop";
import FooterWordmark from "@/components/footer/FooterWordmark";
import FooterLink from "@/components/footer/FooterLink";

// A calmer echo of Contact.tsx's own EMAIL/PHONE constants, not a
// duplicate of them by accident — same studio, same two numbers, which is
// exactly why they match.
const EMAIL = "hello@linkhaus.studio";
const PHONE_DISPLAY = "+40 722 108 900";
const PHONE_HREF = "+40722108900";

// Same three destinations, in the same order, as Nav.tsx's own LINKS —
// intentionally kept in lockstep with it rather than re-derived here, so
// the header and the closing frame never quietly drift out of sync.
const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

/** Same routing as Nav.tsx's handleSectionLink — every internal anchor here
 *  (footer nav links, back-to-top) triggers the loader-then-teleport
 *  transition instead of a smooth scroll. See lib/navTransitionState.ts. */
function handleSectionLink(e: MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  requestSectionTransition(href);
}

// Placeholder destinations — swap for the studio's real handles once they
// exist.
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/linkhaus.studio" },
  { label: "Behance", href: "https://behance.net/linkhaus" },
  { label: "LinkedIn", href: "https://linkedin.com/company/linkhaus" },
  { label: "GitHub", href: "https://github.com/linkhaus" },
];

const STACK = ["Next.js", "React", "Three.js", "GSAP"];

/**
 * The site's final frame: energy -> resolution -> silence. Picks up
 * directly where Contact's climax leaves off — FooterBackdrop.tsx decays
 * that same atmosphere down to a quiet residue rather than cutting to a
 * plain dark footer — then settles into a compact wordmark/contact/nav
 * layout and a back-to-top control. Everything here is deliberately
 * quieter than Contact: smaller motion, no scale/skew, no pinned scroll
 * hold, and — unlike the rest of the page's sections — no big display
 * headline of its own; the wordmark carries that role instead.
 */
export default function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordmarkWrapRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const navListRef = useRef<HTMLUListElement>(null);
  const socialListRef = useRef<HTMLUListElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // One entrance timeline for the whole footer, triggered once as it
  // arrives. Waits for fonts first (same reasoning as Contact.tsx/
  // Services.tsx: font swaps can shift document height, which would bake a
  // stale trigger position into anything set up before that settles).
  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    if (!section) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;

    const setup = () => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        const navLinks = navListRef.current ? Array.from(navListRef.current.children) : [];
        const socialLinks = socialListRef.current ? Array.from(socialListRef.current.children) : [];
        const fadeUpTargets = [
          wordmarkWrapRef.current,
          contactRef.current,
          metaRef.current,
          ...navLinks,
          ...socialLinks,
        ].filter((el): el is Element => el != null);

        if (reducedMotion) {
          gsap.set([...fadeUpTargets, bottomRowRef.current], { opacity: 1, y: 0 });
          gsap.set(dividerRef.current, { scaleX: 1 });
          return;
        }

        gsap.set(fadeUpTargets, { opacity: 0, y: 16 });
        gsap.set(bottomRowRef.current, { opacity: 0, y: 16 });
        gsap.set(dividerRef.current, { scaleX: 0 });

        // "top bottom" — fires the instant the footer starts entering the
        // viewport, which lands at (or before) the document's actual max
        // scroll position since this is the very last section on the
        // page. A deeper trigger point ("top 85%" etc.) can silently never
        // fire this close to the bottom — see Contact.tsx's own crescendo
        // trigger and FooterBackdrop.tsx's decay scrub for the same
        // reasoning applied elsewhere on this page.
        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, start: "top bottom", once: true },
        });

        tl.to(fadeUpTargets, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          stagger: 0.07,
        })
          .to(dividerRef.current, { scaleX: 1, duration: 0.9, ease: "power2.out" }, "-=0.5")
          .to(bottomRowRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.35");
      }, sectionRef);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(setup);
    } else {
      setup();
    }

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reducedMotion]);

  return (
    <footer
      id="footer"
      ref={sectionRef}
      // Contact and Footer share the exact same bg-ink, so with nothing
      // marking the seam the two read as one uninterrupted section on
      // scroll — a thin top border (the same bg-paper/10 hairline the
      // divider further down uses) is the plainest way to say "the climax
      // has ended, this is its own quiet coda" without another effect.
      className="relative overflow-hidden border-t border-paper/10 bg-ink px-5 pb-6 pt-14 text-paper sm:px-8 sm:pb-8 sm:pt-16"
    >
      <FooterBackdrop />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Asymmetric editorial row: wordmark/contact/meta on the left,
            nav and socials recomposed into their own two columns on the
            right — a deliberate mobile layout, not a plain stack. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-[1.2fr_auto_auto] lg:gap-x-16">
          <div className="col-span-2 lg:col-span-1">
            <div ref={wordmarkWrapRef} style={{ willChange: "transform, opacity" }}>
              <FooterWordmark />
            </div>

            <div
              ref={contactRef}
              className="mt-6 flex flex-col items-start gap-2 sm:mt-8"
              style={{ willChange: "transform, opacity" }}
            >
              <MagneticButton
                href={`mailto:${EMAIL}`}
                radius={90}
                strength={0.12}
                layered={false}
                cursor="link"
                className="group inline-flex w-fit"
              >
                <span className="relative font-display text-lg text-paper/80 transition-colors duration-300 ease-art [font-variation-settings:'wght'_500,'CNTR'_0] group-hover:text-paper sm:text-xl">
                  {EMAIL}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent-violet transition-transform duration-300 ease-art group-hover:scale-x-100" />
                </span>
              </MagneticButton>
              <MagneticButton
                href={`tel:${PHONE_HREF}`}
                radius={80}
                strength={0.1}
                layered={false}
                cursor="link"
                className="group inline-flex w-fit"
              >
                <span className="relative font-mono-label text-xs text-paper/45 transition-colors duration-300 ease-art group-hover:text-paper/80">
                  {PHONE_DISPLAY}
                  <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-paper/50 transition-transform duration-300 ease-art group-hover:scale-x-100" />
                </span>
              </MagneticButton>
            </div>

            <div
              ref={metaRef}
              className="mt-6 font-mono-label text-[11px] leading-relaxed text-paper/35 sm:mt-8"
              style={{ willChange: "transform, opacity" }}
            >
              CREATIVE DEVELOPMENT STUDIO
              <br />
              BASED IN ROMANIA / WORKING WORLDWIDE
            </div>
          </div>

          <nav aria-label="Footer">
            <ul ref={navListRef} className="flex flex-col items-start gap-2.5">
              {NAV_LINKS.map((l) => (
                <li key={l.href} style={{ willChange: "transform, opacity" }}>
                  <FooterLink
                    href={l.href}
                    label={l.label}
                    onClick={(e) => handleSectionLink(e, l.href)}
                  />
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <ul ref={socialListRef} className="flex flex-col items-start gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href} style={{ willChange: "transform, opacity" }}>
                  <FooterLink href={s.href} label={s.label} external />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div ref={dividerRef} className="mt-8 h-px w-full origin-left bg-paper/10 sm:mt-10" />

        <div
          ref={bottomRowRef}
          className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="font-mono-label flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-paper/30">
            <span>&copy; 2026 LINKHAUS</span>
            <span aria-hidden="true">/</span>
            {STACK.map((tech, i) => (
              <span key={tech} className="flex items-center gap-3">
                {tech.toUpperCase()}
                {i < STACK.length - 1 && <span aria-hidden="true">&middot;</span>}
              </span>
            ))}
          </div>

          <a
            href="#top"
            onClick={(e) => handleSectionLink(e, "#top")}
            data-cursor="link"
            className="group inline-flex w-fit items-center gap-2 font-mono-label text-xs text-paper/50 transition-colors duration-300 ease-art hover:text-paper"
          >
            BACK TO TOP
            <span className="inline-block transition-transform duration-300 ease-art group-hover:-translate-y-1">
              &uarr;
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
