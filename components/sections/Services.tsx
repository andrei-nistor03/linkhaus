"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { gsap, ScrollTrigger, SplitText, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";
import ServicesBackdrop from "@/components/services/ServicesBackdrop";
import ServiceCluster from "@/components/services/ServiceCluster";
import { SERVICE_CLUSTERS } from "@/components/services/servicesData";

const BIG_TITLE_TEXT = "Services";
const TITLE = "Websites that turn you into the obvious choice.";
const SUBTITLE =
  "Every project is designed to outperform the competition. From first impression to checkout, design to infrastructure.";

const ACCENTS = SERVICE_CLUSTERS.map((c) => c.accent);
const TOTAL = SERVICE_CLUSTERS.length;

const BIG_TITLE_SCALE_START = 3.2;

export default function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const bigTitleRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  const handleActive = useCallback((i: number) => setActiveIndex(i), []);

  const bigTitleChars = useMemo(() => BIG_TITLE_TEXT.split(""), []);

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

  // The fixed "SERVICES" corner watermark. This is where the previous
  // attempt fell short of Projects.tsx's "Selected Work" label: that label
  // isn't a heading that settles into its place in the document and stays
  // there — it's `position: absolute` inside a permanently-pinned,
  // viewport-sized ancestor, so it *never* participates in document flow
  // and stays glued to the same screen spot for the label's whole
  // lifetime. Reproducing that for a title that isn't inside any pinned
  // ancestor means going further: this title is `position: fixed` always
  // (see its JSX below — no ancestor here has a transform/filter to hijack
  // that fixed positioning), invisible outside the section, and inside it:
  // opens dead-center and oversized, scales/slides down into its small
  // fixed corner spot over the first stretch of the section's time
  // onscreen, then genuinely stays put — a real fixed position, not a
  // scroll-tracking illusion — while the rest of the section's content
  // scrolls past underneath it, for as long as any part of the section is
  // still onscreen.
  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const title = bigTitleRef.current;
    if (!section || !title) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let tick: (() => void) | undefined;
    const centerOffset = { x: 0, y: 0 };

    // Measuring the title's own width/position has to wait on the Thunder
    // variable font actually being swapped in — measuring against the
    // fallback font's (narrower) metrics would bake a wrong, one-off
    // centerOffset in permanently, with nothing afterward to prompt a
    // re-measure (the font finishing loading doesn't fire a resize event).
    function measureCenterOffset() {
      const prevTransform = title!.style.transform;
      title!.style.transform = "none";
      // NOT title.getBoundingClientRect(): the <h2> is a block element as
      // wide as its container, not the tight width of the word itself —
      // union the per-letter <span>s instead to get the actual glyphs'
      // bounding box.
      const letterRects = Array.from(title!.querySelectorAll("span")).map((el) =>
        el.getBoundingClientRect(),
      );
      const left = Math.min(...letterRects.map((r) => r.left));
      const right = Math.max(...letterRects.map((r) => r.right));
      const top = Math.min(...letterRects.map((r) => r.top));
      const bottom = Math.max(...letterRects.map((r) => r.bottom));

      // The scale in the tick below defaults to pivoting around the <h2>'s
      // own (wide) box center, not the tight text's — pin transform-origin
      // to the text's actual center (in the h2's local box coordinates) so
      // scaling grows/shrinks around the glyphs themselves, matching what
      // the translate math below assumes.
      const h2Rect = title!.getBoundingClientRect();
      title!.style.transformOrigin = `${left - h2Rect.left + (right - left) / 2}px ${
        top - h2Rect.top + (bottom - top) / 2
      }px`;
      title!.style.transform = prevTransform;

      // Since the title is always position:fixed, "its own resting spot"
      // (the small corner) is a fixed point in viewport space — no need to
      // account for scroll position at all here, unlike a title that
      // settles into normal document flow.
      centerOffset.x = window.innerWidth / 2 - (left + right) / 2;
      centerOffset.y = window.innerHeight / 2 - (top + bottom) / 2;
    }

    const setup = () => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        // Visible only while the section is actually anywhere onscreen —
        // a fixed element doesn't naturally scroll out of view with the
        // rest of the page the way normal content does, so that has to be
        // managed explicitly here.
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            gsap.to(title, { opacity: self.isActive ? 1 : 0, duration: 0.5, overwrite: true });
          },
        });

        if (reducedMotion) {
          gsap.set(title, { transform: "none" });
          return;
        }

        measureCenterOffset();
        window.addEventListener("resize", measureCenterOffset);

        let progress = 0;
        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "top 55%",
          onUpdate: (self) => {
            progress = self.progress;
          },
        });

        tick = () => {
          const settle = progress * progress * (3 - 2 * progress); // smoothstep
          const scale = gsap.utils.interpolate(BIG_TITLE_SCALE_START, 1, settle);
          const tx = gsap.utils.interpolate(centerOffset.x, 0, settle);
          const ty = gsap.utils.interpolate(centerOffset.y, 0, settle);
          title!.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
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
      window.removeEventListener("resize", measureCenterOffset);
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
      className="relative overflow-hidden bg-ink py-[16vh] sm:py-[20vh]"
    >
      <ServicesBackdrop activeIndex={activeIndex} accents={ACCENTS} />

      {/* Fixed corner watermark, not part of document flow — see the
          effect above for why. Rendered as a direct child of the section
          (like railRef below) rather than nested inside the centered
          content column purely for legibility; position:fixed doesn't
          care either way. */}
      <h2
        ref={bigTitleRef}
        className="pointer-events-none fixed left-5 top-5 z-20 font-display text-[clamp(1.75rem,3.6vw,3.25rem)] font-black uppercase leading-[0.85] tracking-wide text-paper [font-variation-settings:'wght'_900,'CNTR'_0] sm:left-8 sm:top-8"
        style={{ opacity: 0, willChange: "transform, opacity" }}
      >
        {bigTitleChars.map((char, i) => (
          <span key={i} className="label-wave-letter" style={{ animationDelay: `${i * 0.07}s` }}>
            {char}
          </span>
        ))}
      </h2>

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
        <div className="mb-24 sm:mb-32 lg:mb-40">
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
