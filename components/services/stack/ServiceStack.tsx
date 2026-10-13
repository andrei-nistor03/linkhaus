"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { lenisState } from "@/lib/lenisState";
import { useMediaQuery, useReducedMotion } from "@/lib/useMediaQuery";
import type { ServiceClusterData } from "../servicesData";
import ServiceCard from "./ServiceCard";
import { SERVICE_DEMOS } from "./demos";
import "./stack.css";

// Matches the `@media (max-height: 540px)` block in stack.css, where cards
// stop stacking and steps are picked by tapping instead of scrolling.
const COMPACT_QUERY = "(max-height: 540px)";
const COVERED_SCALE = 0.92;
const COVERED_SHADE = 0.55;

interface ServiceStackProps {
  clusters: ServiceClusterData[];
  onActive: (index: number) => void;
}

export default function ServiceStack({ clusters, onActive }: ServiceStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stickyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stepTriggers = useRef<(ScrollTrigger | null)[]>([]);
  const onActiveRef = useRef(onActive);
  onActiveRef.current = onActive;

  const [steps, setSteps] = useState<number[]>(() => clusters.map(() => 0));
  const [activeCard, setActiveCard] = useState(0);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const compact = useMediaQuery(COMPACT_QUERY);

  const scenes = useMemo(() => clusters.map((c) => SERVICE_DEMOS[c.index]?.() ?? []), [clusters]);

  const setStepFor = useCallback((card: number, step: number) => {
    setSteps((prev) => (prev[card] === step ? prev : prev.map((v, i) => (i === card ? step : v))));
  }, []);

  useEffect(() => {
    registerGsap();
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let ctx: gsap.Context | undefined;

    const setup = () => {
      if (cancelled) return;

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => setInView(self.isActive),
        });

        clusters.forEach((cluster, i) => {
          const sentinel = sentinelRefs.current[i];
          const spacer = spacerRefs.current[i];
          const sticky = stickyRefs.current[i];
          if (!sentinel || !spacer || !sticky) return;

          const count = cluster.items.length;
          // Resolved `top` of the sticky card in px — where it docks.
          const dockTop = () => parseFloat(getComputedStyle(sticky).top) || 0;

          ScrollTrigger.create({
            trigger: sentinel,
            start: "top 55%",
            onEnter: () => {
              setActiveCard(i);
              onActiveRef.current(i);
            },
            onLeaveBack: () => {
              const prev = Math.max(0, i - 1);
              setActiveCard(prev);
              onActiveRef.current(prev);
            },
          });

          if (compact) {
            stepTriggers.current[i] = null;
            sticky.style.setProperty("--item-progress", "1");
            return;
          }

          // While the card is docked, scrolling through its spacer walks
          // the services one by one.
          const apply = (progress: number) => {
            const scaled = progress * count;
            const step = Math.min(count - 1, Math.floor(scaled));
            const local = progress >= 1 ? 1 : scaled - step;
            sticky.style.setProperty("--item-progress", local.toFixed(3));
            setStepFor(i, step);
          };

          stepTriggers.current[i] = ScrollTrigger.create({
            trigger: sentinel,
            start: () => `top ${dockTop()}px`,
            end: () => `+=${Math.max(1, spacer.offsetHeight)}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => apply(self.progress),
            onRefresh: (self) => apply(self.progress),
          });

          // The card sliding in pushes the previous one back.
          const prevCard = cardRefs.current[i - 1];
          const prevShade = shadeRefs.current[i - 1];
          if (i > 0 && prevCard && prevShade && !reducedMotion) {
            gsap
              .timeline({
                scrollTrigger: {
                  trigger: sentinel,
                  start: "top bottom",
                  end: () => `top ${dockTop()}px`,
                  scrub: true,
                  invalidateOnRefresh: true,
                },
              })
              .fromTo(prevCard, { scale: 1 }, { scale: COVERED_SCALE, ease: "none" }, 0)
              .fromTo(prevShade, { opacity: 0 }, { opacity: COVERED_SHADE, ease: "none" }, 0);
          }
        });
      }, root);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(setup);
    } else {
      setup();
    }

    return () => {
      cancelled = true;
      ctx?.revert();
      stepTriggers.current = [];
    };
  }, [clusters, compact, reducedMotion, setStepFor]);

  const selectStep = useCallback(
    (card: number, step: number) => {
      const st = stepTriggers.current[card];
      if (!st) {
        setStepFor(card, step);
        return;
      }
      const count = clusters[card].items.length;
      const target = st.start + ((step + 0.5) / count) * (st.end - st.start);
      const lenis = lenisState.instance;
      if (lenis) {
        lenis.scrollTo(target, { duration: reducedMotion ? 0 : 1.1, immediate: reducedMotion });
      } else {
        window.scrollTo({ top: target, behavior: reducedMotion ? "auto" : "smooth" });
      }
    },
    [clusters, reducedMotion, setStepFor],
  );

  return (
    <div
      ref={rootRef}
      className="svc-stack mx-auto max-w-[1320px] px-3 sm:px-6 lg:px-10"
      style={{ "--last": clusters.length - 1 } as CSSProperties}
    >
      {/* Cards must stay siblings in one container so earlier ones remain
          docked (sticky) underneath while later ones slide over them. */}
      {clusters.map((cluster, i) => (
        <Fragment key={cluster.index}>
          <div
            ref={(el) => {
              sentinelRefs.current[i] = el;
            }}
            aria-hidden="true"
          />
          <ServiceCard
            data={cluster}
            position={i}
            total={clusters.length}
            step={steps[i]}
            playing={inView && activeCard === i}
            scenes={scenes[i]}
            onSelect={(step) => selectStep(i, step)}
            stickyRef={(el) => {
              stickyRefs.current[i] = el;
            }}
            cardRef={(el) => {
              cardRefs.current[i] = el;
            }}
            shadeRef={(el) => {
              shadeRefs.current[i] = el;
            }}
          />
          <div
            ref={(el) => {
              spacerRefs.current[i] = el;
            }}
            className="svc-spacer"
            style={{ "--n": cluster.items.length } as CSSProperties}
            aria-hidden="true"
          />
        </Fragment>
      ))}
    </div>
  );
}
