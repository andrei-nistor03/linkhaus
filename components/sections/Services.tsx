"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { gsap, ScrollTrigger, SplitText, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";
import ServicesBackdrop from "@/components/services/ServicesBackdrop";
import ServiceCluster from "@/components/services/ServiceCluster";
import { SERVICE_CLUSTERS } from "@/components/services/servicesData";

const LABEL_TEXT = "Our Services";
const TITLE = "Websites that turn you into the obvious choice.";
const SUBTITLE =
  "Every project is designed to outperform the competition. From first impression to checkout, design to infrastructure.";

const ACCENTS = SERVICE_CLUSTERS.map((c) => c.accent);
const TOTAL = SERVICE_CLUSTERS.length;

// The "Our Services" label's own corner-stick choreography — see the
// effect below. It opens at LABEL_SCALE_START its resting size while
// sitting centered in the flow, then — once scrolled to where it's
// centered in the viewport — shrinks back down to its true (1x) size
// while sliding into the top-left corner, where it's pinned for the rest
// of the section. LABEL_SETTLE_FRACTION mirrors Projects.tsx's
// TITLE_SETTLE_FRACTION: the shrink/slide completes within just the first
// slice of the pin's own (much longer) scrubbed duration, then holds.
const LABEL_SCALE_START = 4;
const LABEL_SETTLE_FRACTION = 0.12;
// Corner inset the label settles into, matching the left-5/top-5 (mobile)
// and sm:left-8/top-8 (desktop) corner spacing the earlier watermark used.
const CORNER_INSET = 20;
const CORNER_INSET_SM = 32;
const CORNER_INSET_BREAKPOINT = 640; // px — Tailwind's `sm`

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const labelWrapRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  const handleActive = useCallback((i: number) => setActiveIndex(i), []);

  // One span per character (space included, so the wave animation's
  // staggered delay flows continuously across both words) — same idle
  // ripple Projects.tsx's "Selected Work" label uses (see label-wave-letter
  // in globals.css).
  const labelChars = useMemo(() => LABEL_TEXT.split(""), []);

  useEffect(() => {
    registerGsap();
    let cancelled = false;
    let ctx: gsap.Context | undefined;

    const setup = () => {
      if (cancelled || !titleRef.current || !subtitleRef.current) return;

      ctx = gsap.context(() => {
        if (reducedMotion) {
          gsap.to([titleRef.current, subtitleRef.current], {
            opacity: 1,
            y: 0,
            duration: 0.01,
            scrollTrigger: {
              trigger: titleRef.current,
              start: "top 90%",
              once: true,
            },
          });
          return;
        }

        // The headline itself is NOT SplitText-masked like the subtitle
        // below it: SplitText's word/line reveal wraps the text in nested
        // <div>s, and background-clip: text (services-lava-text, see
        // globals.css) only clips an element's background to glyphs it
        // owns directly — text delegated to nested block children doesn't
        // count, so the two together rendered the headline fully invisible
        // (transparent, with no background showing through). A plain
        // fade/blur on the un-split element keeps its text a single,
        // direct text node so the gradient clip actually has something to
        // clip to.
        gsap.set(titleRef.current, { opacity: 0, y: 20, filter: "blur(14px)" });

        const subSplit = SplitText.create(subtitleRef.current!, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
        });
        gsap.set(subSplit.lines, { yPercent: 115, opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 82%",
            once: true,
          },
        });
        tl.to(titleRef.current, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "expo.out",
        }).to(
          subSplit.lines,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
          },
          "-=0.55",
        );
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

  // "Our Services" label: opens big and centered (in normal document
  // flow, above the headline), then — once scrolled to where it's
  // centered in the viewport — shrinks and slides into the top-left
  // corner, where it stays pinned for the rest of the section. Same
  // pin+scrub+settle-fraction structure as Projects.tsx's "Selected Work"
  // label (see LABEL_SETTLE_FRACTION above), just anchored to the label's
  // own scroll position instead of a dedicated pinned viewport.
  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const wrap = labelWrapRef.current;
    const label = labelRef.current;
    if (!section || !wrap || !label) return;

    if (reducedMotion) {
      // Plain style assignment, not gsap.set — the settle ticker below
      // (the non-reduced-motion path) also writes `label.style.transform`
      // directly rather than through GSAP's own transform cache, and
      // mixing the two on the same element is what causes one to silently
      // clobber the other.
      label.style.transform = `scale(${LABEL_SCALE_START})`;
      return;
    }

    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let tick: (() => void) | undefined;
    // Offset (from viewport center) the label needs to end at once
    // settled into its corner — NOT the offset it starts at: at progress
    // 0 the label is already sitting at the viewport's center (that's
    // exactly what the ScrollTrigger's "center center" start below
    // guarantees), so the animation instead interpolates FROM 0 TO this.
    const cornerOffset = { x: 0, y: 0 };

    // wrap never moves or scales — it's the honest, untouched layout
    // reference both for "is the label centered in the viewport yet?"
    // (the trigger below) and for the label's own natural (unscaled)
    // size, measured off `label` itself with its transform stripped so a
    // mid-animation scale never throws the reading off.
    function measureCornerOffset() {
      const prevTransform = label!.style.transform;
      label!.style.transform = "none";
      const rect = label!.getBoundingClientRect();
      label!.style.transform = prevTransform;

      const inset = window.innerWidth >= CORNER_INSET_BREAKPOINT ? CORNER_INSET_SM : CORNER_INSET;
      const targetCenterX = inset + rect.width / 2;
      const targetCenterY = inset + rect.height / 2;

      cornerOffset.x = targetCenterX - window.innerWidth / 2;
      cornerOffset.y = targetCenterY - window.innerHeight / 2;
    }

    // Locks wrap's own box to label's natural (rest, unscaled) height so
    // that pinning `label` below — which lifts it out of flow via
    // `position: fixed` — never collapses the space it used to occupy and
    // jolts the headline beneath it. Re-run alongside measureCornerOffset
    // any time the label's rendered size could have changed.
    function lockWrapHeight() {
      wrap!.style.height = "auto";
      const prevTransform = label!.style.transform;
      label!.style.transform = "none";
      const height = label!.getBoundingClientRect().height;
      label!.style.transform = prevTransform;
      wrap!.style.height = `${height}px`;
    }

    function remeasure() {
      lockWrapHeight();
      measureCornerOffset();
    }

    const setup = () => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        remeasure();
        window.addEventListener("resize", remeasure);

        let progress = 0;
        ScrollTrigger.create({
          trigger: wrap,
          start: "center center",
          endTrigger: section,
          end: "bottom top",
          pin: label,
          pinSpacing: false,
          scrub: true,
          onEnter: measureCornerOffset,
          onEnterBack: measureCornerOffset,
          onUpdate: (self) => {
            progress = self.progress;
          },
        });

        tick = () => {
          const settle = gsap.utils.clamp(0, 1, progress / LABEL_SETTLE_FRACTION);
          const eased = settle * settle * (3 - 2 * settle); // smoothstep
          const scale = gsap.utils.interpolate(LABEL_SCALE_START, 1, eased);
          const tx = gsap.utils.interpolate(0, cornerOffset.x, eased);
          const ty = gsap.utils.interpolate(0, cornerOffset.y, eased);
          label!.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        };
        gsap.ticker.add(tick);
      }, sectionRef);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(setup);
    } else {
      setup();
    }

    return () => {
      cancelled = true;
      if (tick) gsap.ticker.remove(tick);
      window.removeEventListener("resize", remeasure);
      ctx?.revert();
    };
  }, [reducedMotion]);

  // Fixed vertical rail: fades in as the section arrives, fades out as it
  // leaves, and its fill tracks scroll progress through the whole section —
  // the same "thin technical progress indicator" idea as Projects' HUD
  // rail, translated from a horizontal scrub-locked bar into a passive
  // vertical-scroll one.
  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    if (!section || !railRef.current) return;

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "top 45%",
            scrub: true,
          },
        })
        .to(railRef.current, { opacity: 1, ease: "none" });
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "bottom 65%",
            end: "bottom top",
            scrub: true,
          },
        })
        .to(railRef.current, { opacity: 0, ease: "none" });

      gsap.to(railFillRef.current, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      // Bottom padding is deliberately generous — this is scroll runway,
      // not visual spacing: TransitionVeil's blackout (see its own
      // TRIGGER_START) is keyed off Contact's top edge, which sits right at
      // this section's bottom edge, so a tight pb- here would let the
      // blackout start closing in while the last ServiceCluster is still
      // the thing on screen. The extra padding buys scroll distance for
      // that last cluster to fully clear the viewport first.
      className="relative overflow-hidden bg-ink pb-[36vh] pt-[26vh] sm:pb-[42vh] sm:pt-[32vh]"
    >
      <ServicesBackdrop activeIndex={activeIndex} accents={ACCENTS} />

      <div
        ref={railRef}
        className="pointer-events-none fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-4 opacity-0 lg:flex xl:right-10"
      >
        <span className="font-mono-label text-[10px] text-paper/60">
          {String(activeIndex + 1).padStart(2, "0")}
        </span>
        <div className="relative h-24 w-px bg-paper/15">
          <div
            ref={railFillRef}
            className="absolute inset-x-0 top-0 h-full w-px origin-top bg-paper/70"
            style={{ transform: "scaleY(0)" }}
          />
        </div>
        <span className="font-mono-label text-[10px] text-paper/30">
          {String(TOTAL).padStart(2, "0")}
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mb-14 sm:mb-20 lg:mb-24">
          {/* wrap reserves the flow space (locked to label's natural
              height by the effect above) so that label being lifted into
              `position: fixed` mid-scroll never collapses this gap and
              jolts the headline below. wrap itself never moves/scales —
              it's the honest reference the pin's "center center" start
              measures against. */}
          <div ref={labelWrapRef} className="relative mb-5 sm:mb-6">
            <h2
              ref={labelRef}
              className="pointer-events-none z-20 mx-auto w-fit text-center font-display text-[clamp(1.5rem,3vw,2.25rem)] font-black uppercase leading-[0.85] tracking-wide text-paper [font-variation-settings:'wght'_900,'CNTR'_0]"
              style={{ willChange: "transform" }}
            >
              {labelChars.map((char, i) =>
                char === " " ? (
                  <span key={i} className="inline-block">
                    &nbsp;
                  </span>
                ) : (
                  <span
                    key={i}
                    className={reducedMotion ? "inline-block" : "label-wave-letter"}
                    style={reducedMotion ? undefined : { animationDelay: `${i * 0.07}s` }}
                  >
                    {char}
                  </span>
                ),
              )}
            </h2>
          </div>
          <h3
            ref={titleRef}
            className="services-lava-text mx-auto max-w-4xl text-balance text-center font-display text-[clamp(2.5rem,6.2vw,6rem)] font-black uppercase leading-[0.95] [font-variation-settings:'wght'_800,'CNTR'_0]"
          >
            {TITLE}
          </h3>
          <p
            ref={subtitleRef}
            className="mx-auto mt-8 max-w-2xl text-balance text-center text-lg leading-relaxed text-paper/55 sm:text-xl"
          >
            {SUBTITLE}
          </p>
        </div>

        <div>
          {SERVICE_CLUSTERS.map((cluster, i) => (
            <ServiceCluster
              key={cluster.index}
              data={cluster}
              position={i}
              total={TOTAL}
              onActive={handleActive}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
