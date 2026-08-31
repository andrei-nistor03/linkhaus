"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { gsap, ScrollTrigger, SplitText, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";
import ServicesBackdrop from "@/components/services/ServicesBackdrop";
import ServiceCluster from "@/components/services/ServiceCluster";
import WaveLabel from "@/components/ui/WaveLabel";
import { SERVICE_CLUSTERS } from "@/components/services/servicesData";

const LABEL_TEXT = "Our Services";
const TITLE = "Websites that turn you into the obvious choice.";
const SUBTITLE =
  "Every project is designed to outperform the competition. From first impression to checkout, design to infrastructure.";

const ACCENTS = SERVICE_CLUSTERS.map((c) => c.accent);
const TOTAL = SERVICE_CLUSTERS.length;

const LABEL_SCALE_START = 4;
const LABEL_SETTLE_FRACTION = 0.12;
const CORNER_INSET = 20;
const CORNER_INSET_SM = 32;
const CORNER_INSET_BREAKPOINT = 640;

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

  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const wrap = labelWrapRef.current;
    const label = labelRef.current;
    if (!section || !wrap || !label) return;

    if (reducedMotion) {
      label.style.transform = `scale(${LABEL_SCALE_START})`;
      return;
    }

    let cancelled = false;
    let ctx: gsap.Context | undefined;
    let tick: (() => void) | undefined;
    const cornerOffset = { x: 0, y: 0 };

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
          const eased = settle * settle * (3 - 2 * settle);
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
          <div ref={labelWrapRef} className="relative mb-5 sm:mb-6">
            <h2
              ref={labelRef}
              className="pointer-events-none z-20 mx-auto w-fit text-center font-display text-[clamp(1.5rem,3vw,2.25rem)] font-black uppercase leading-[0.85] tracking-wide text-paper [font-variation-settings:'wght'_900,'CNTR'_0]"
              style={{ willChange: "transform" }}
            >
              <WaveLabel text={LABEL_TEXT} reducedMotion={reducedMotion} />
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
