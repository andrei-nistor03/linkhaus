"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText, registerGsap } from "@/lib/gsap";
import { contactState } from "@/lib/contactState";
import { useReducedMotion } from "@/lib/useMediaQuery";
import SceneErrorBoundary from "@/components/three/SceneErrorBoundary";
import TransitionVeil from "@/components/contact/TransitionVeil";
import MagneticButton from "@/components/ui/MagneticButton";
import WaveLabel from "@/components/ui/WaveLabel";

const ContactScene = dynamic(() => import("@/components/three/ContactScene"), {
  ssr: false,
  loading: () => null,
});

const EYEBROW_TEXT = "Get In Touch";
const TITLE_LINES = ["Let's build", "something", "unforgettable."];
const SUBTITLE = "Have a project in mind? Email us or give us a call.";
const EMAIL = "hello@linkhaus.studio";
const PHONE_DISPLAY = "+40 722 108 900";
const PHONE_HREF = "+40722108900";

const CONTENT_FADE_FROM = 0.82;

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleLineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();


  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    if (!section) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        contactState.progress = self.progress;

        const content = contentRef.current;
        if (!content) return;
        const fade = gsap.utils.clamp(0, 1, (self.progress - CONTENT_FADE_FROM) / (1 - CONTENT_FADE_FROM));
        content.style.opacity = String(1 - fade);
        if (!reducedMotion) {
          content.style.filter = fade > 0 ? `blur(${fade * 14}px)` : "";
          content.style.transform = fade > 0 ? `scale(${1 - fade * 0.05})` : "";
        }
      },
    });

    return () => {
      st.kill();
      contactState.progress = 0;
      contactState.hoverBoostTarget = 0;
    };
  }, [reducedMotion]);

  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const lines = titleLineRefs.current.filter((el): el is HTMLSpanElement => el != null);
    if (!section || !subtitleRef.current) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;

    const setup = () => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        if (reducedMotion) {
          gsap.set([eyebrowRef.current, ...lines, subtitleRef.current, ctaRef.current], {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
          });
          gsap.set(lines, { clearProps: "willChange" });
          return;
        }

        gsap.set(eyebrowRef.current, { opacity: 0, y: 12 });
        gsap.set(lines, { yPercent: 115, opacity: 0, scale: 1.06, filter: "blur(16px)" });

        const subSplit = SplitText.create(subtitleRef.current!, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
        });
        gsap.set(subSplit.lines, { yPercent: 115, opacity: 0 });
        gsap.set(ctaRef.current, { opacity: 0, y: 26 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, start: "top 55%", once: true },
        });
        tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" })
          .to(
            lines,
            {
              yPercent: 0,
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.12,
            },
            "-=0.35",
          )
          .to(
            subSplit.lines,
            { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.08 },
            "-=0.7",
          )
          .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" }, "-=0.5")
          .set(lines, { clearProps: "willChange" });
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

  useEffect(() => {
    registerGsap();
    const tagline = taglineRef.current;
    if (!tagline) return;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set(tagline, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(tagline, { opacity: 0, y: 16 });
      gsap.to(tagline, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: { trigger: tagline, start: "top 88%", once: true },
      });
    });

    return () => ctx.revert();
  }, [reducedMotion]);

  const onCtaEnter = () => {
    contactState.hoverBoostTarget = 1;
  };
  const onCtaLeave = () => {
    contactState.hoverBoostTarget = 0;
  };

  return (
    <section id="contact" ref={sectionRef} className="relative bg-ink">
      <TransitionVeil sectionRef={sectionRef} reducedMotion={reducedMotion} />

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <SceneErrorBoundary
          fallback={
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 55% at 50% 38%, #23163f, #0d0d0d 68%)",
              }}
            />
          }
        >
          <ContactScene />
        </SceneErrorBoundary>

        <div
          ref={contentRef}
          className="relative z-20 flex h-full w-full flex-col items-center justify-center px-5 text-center sm:px-8"
          style={{ willChange: "opacity, transform, filter" }}
        >
          <p ref={eyebrowRef} className="font-mono-label mb-4 text-xs text-paper/50 sm:mb-6">
            <WaveLabel text={EYEBROW_TEXT} reducedMotion={reducedMotion} />
          </p>

          <h2 className="max-w-5xl font-display font-black uppercase leading-[0.92] text-paper [font-variation-settings:'wght'_900,'CNTR'_0]">
            {TITLE_LINES.map((line, i) => (
              <span key={line} className="mask-line">
                <span
                  ref={(el) => {
                    titleLineRefs.current[i] = el;
                  }}
                  className="block text-[clamp(2.2rem,7vw,6rem)]"
                  style={{ willChange: "transform, opacity, filter" }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h2>

          <p
            ref={subtitleRef}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-paper/55 sm:mt-7 sm:text-xl"
          >
            {SUBTITLE}
          </p>

          <div
            ref={ctaRef}
            onMouseEnter={onCtaEnter}
            onMouseLeave={onCtaLeave}
            className="mt-8 flex flex-col items-center gap-4 sm:mt-12 sm:gap-6"
          >
            <MagneticButton
              href={`mailto:${EMAIL}`}
              radius={140}
              strength={0.14}
              cursor="link"
              className="group inline-flex"
            >
              <span className="relative inline-block font-display font-black lowercase text-paper transition-transform duration-500 ease-art [font-variation-settings:'wght'_800,'CNTR'_0] text-[clamp(1.5rem,4.4vw,3.4rem)] group-hover:-skew-x-2 group-hover:scale-[1.015]">
                {EMAIL}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent-violet transition-transform duration-500 ease-art group-hover:scale-x-100 sm:-bottom-2" />
              </span>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="shrink-0 -translate-x-2 text-paper opacity-0 transition-all duration-500 ease-art group-hover:translate-x-0 group-hover:opacity-100 sm:h-9 sm:w-9"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </MagneticButton>

            <MagneticButton
              href={`tel:${PHONE_HREF}`}
              radius={110}
              strength={0.12}
              layered={false}
              cursor="link"
              className="group inline-flex"
            >
              <span className="relative inline-block font-display font-semibold text-paper/70 transition-colors duration-500 ease-art [font-variation-settings:'wght'_600,'CNTR'_0] text-[clamp(1rem,2.2vw,1.5rem)] group-hover:text-paper">
                {PHONE_DISPLAY}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-paper/50 transition-transform duration-500 ease-art group-hover:scale-x-100" />
              </span>
            </MagneticButton>
          </div>
        </div>
      </div>

      <div className="h-[55vh] sm:h-[70vh]" aria-hidden="true" />

      <div className="relative z-20 flex flex-col items-center px-5 pb-[14vh] text-center sm:px-8 sm:pb-[18vh]">
        <div ref={taglineRef} className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-acid" />
          <span className="font-mono-label text-xs text-paper/55 sm:text-sm">
            Available for select projects
          </span>
        </div>
      </div>
    </section>
  );
}
