"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { INTRO_COMPLETE_EVENT } from "./Preloader";
import MagneticButton from "@/components/ui/MagneticButton";

const LINKS = [
  { label: "Work", href: "#work" },
  { label: "Studio", href: "#studio" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

const PILL_THRESHOLD = 48;

export default function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    registerGsap();
    const nav = navRef.current!;
    gsap.set(nav, {
      yPercent: -140,
      xPercent: 0,
      width: "100%",
      top: "0rem",
      left: "0rem",
      paddingTop: "1.1rem",
      paddingBottom: "1.1rem",
      paddingLeft: "1.25rem",
      paddingRight: "1.25rem",
      borderRadius: 0,
      backgroundColor: "rgba(245,243,238,0.6)",
      borderColor: "rgba(13,13,13,0.06)",
      boxShadow: "0 1px 0 rgba(13,13,13,0.07)",
      backdropFilter: "blur(8px)",
    });

    const onIntro = () => {
      gsap.to(nav, { yPercent: 0, duration: 1, ease: "expo.out", delay: 0.1 });
    };
    window.addEventListener(INTRO_COMPLETE_EVENT, onIntro);

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => setPill(self.scroll() > PILL_THRESHOLD),
    });

    return () => {
      window.removeEventListener(INTRO_COMPLETE_EVENT, onIntro);
      st.kill();
    };
  }, []);

  // All shape/position/color properties animate through one GSAP tween so
  // they update on the same rAF tick. Previously width was GSAP-driven while
  // left/transform/padding/etc. transitioned via CSS — the two engines tick
  // independently, and since the pill centers itself with left:50% +
  // translateX(-50%) (a value that depends on the *current* width), any
  // drift between the two caused a visible wobble instead of a clean glide.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    gsap.to(nav, {
      width: pill ? "auto" : "100%",
      top: pill ? "0.9rem" : "0rem",
      left: pill ? "50%" : "0rem",
      xPercent: pill ? -50 : 0,
      paddingTop: pill ? "0.55rem" : "1.1rem",
      paddingBottom: pill ? "0.55rem" : "1.1rem",
      paddingLeft: pill ? "1.35rem" : "1.25rem",
      paddingRight: pill ? "0.6rem" : "1.25rem",
      borderRadius: pill ? 999 : 0,
      backgroundColor: pill ? "rgba(245,243,238,0.85)" : "rgba(245,243,238,0.6)",
      borderColor: pill ? "rgba(13,13,13,0.08)" : "rgba(13,13,13,0.06)",
      boxShadow: pill
        ? "0 8px 30px -12px rgba(13,13,13,0.2)"
        : "0 1px 0 rgba(13,13,13,0.07)",
      backdropFilter: pill ? "blur(14px)" : "blur(8px)",
      duration: 0.7,
      ease: "art",
      overwrite: "auto",
    });
  }, [pill]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed z-[80] flex items-center gap-6 border border-transparent sm:gap-10"
      >
        <a
          href="#top"
          data-cursor="link"
          className="font-mono-label whitespace-nowrap text-sm font-medium"
        >
          LINKHAUS<span className="text-accent-blue">.</span>
        </a>

        <ul className="hidden items-center gap-6 sm:gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                data-cursor="link"
                className="font-mono-label group relative inline-block whitespace-nowrap py-1 text-xs font-medium text-ink transition-colors duration-300 ease-art hover:text-accent-blue"
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent-blue transition-transform duration-300 ease-art group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        <MagneticButton
          href="#contact"
          radius={70}
          layered={false}
          className="font-mono-label ml-auto hidden items-center whitespace-nowrap rounded-full border border-ink bg-ink px-4 py-2 text-xs text-paper transition-[background-color,color,box-shadow] duration-300 ease-art hover:bg-transparent hover:text-ink hover:shadow-[0_6px_18px_-6px_rgba(13,13,13,0.35)] md:flex"
        >
          Let&rsquo;s talk
        </MagneticButton>

        <button
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          data-cursor="link"
          className="relative z-[90] ml-auto flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border border-ink/10 bg-ink/[0.04] transition-colors duration-300 ease-art hover:border-ink/25 hover:bg-ink/10 md:hidden"
        >
          <span
            className="block h-px w-4 bg-ink transition-transform duration-300"
            style={{
              transform: menuOpen ? "translateY(3px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block h-px w-4 bg-ink transition-transform duration-300"
            style={{
              transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </nav>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      gsap.to(el, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.6,
        ease: "expo.inOut",
      });
      gsap.fromTo(
        el.querySelectorAll(".mobile-link"),
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.06,
          delay: 0.2,
          ease: "power3.out",
        },
      );
    } else {
      gsap.to(el, {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 0.5,
        ease: "power3.inOut",
      });
    }
  }, [open]);

  return (
    <div
      id="mobile-menu"
      ref={ref}
      className="fixed inset-0 z-[70] flex flex-col justify-center bg-paper px-8"
      style={{ clipPath: "inset(0% 0% 100% 0%)" }}
      aria-hidden={!open}
    >
      <ul className="flex flex-col gap-4">
        {LINKS.map((l) => (
          <li key={l.href} className="overflow-hidden">
            <a
              href={l.href}
              onClick={onClose}
              className="mobile-link block text-fluid-h2 leading-none tracking-tightest"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="font-mono-label mt-12 text-xs text-muted">
        hello@linkhaus.studio
      </div>
    </div>
  );
}
