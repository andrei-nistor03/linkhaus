"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useMediaQuery";
import type { ServiceClusterData } from "./servicesData";

interface ServiceClusterProps {
  data: ServiceClusterData;
  /** 0-based position among all clusters, for the "current / total" reading
   *  in the number badge. */
  position: number;
  total: number;
  /** Fired (with `position`) once this cluster becomes the "current" one —
   *  Services.tsx uses it to tint the ambient backdrop and advance the
   *  fixed rail label. */
  onActive: (position: number) => void;
}

/**
 * One numbered manifesto entry in the Services list. Owns its own entrance
 * choreography (number count-up, accent rule draw, masked heading, staggered
 * rows) and its own hover micro-interactions — everything here is scoped to
 * this cluster's own root, so Services.tsx only has to render four of these
 * and stay out of the way.
 *
 * The number/heading column is `lg:sticky` within this cluster's own (much
 * taller) row list — a pure-CSS "temporary pin" that releases naturally at
 * this cluster's bottom border, rather than a JS-driven ScrollTrigger pin.
 */
export default function ServiceCluster({ data, position, total, onActive }: ServiceClusterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const headingLineRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    registerGsap();
    const root = rootRef.current;
    if (!root) return;

    const items = root.querySelectorAll<HTMLElement>(".reveal-item");
    const targetNum = position + 1;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set([headingLineRef.current, ruleRef.current, numberRef.current, ...Array.from(items)], {
          clearProps: "all",
        });
        if (numberRef.current) numberRef.current.textContent = String(targetNum).padStart(2, "0");
      } else {
        gsap.set(headingLineRef.current, { yPercent: 112, opacity: 0 });
        gsap.set(items, { yPercent: 45, opacity: 0 });
        gsap.set(ruleRef.current, { scaleX: 0 });
        gsap.set(numberRef.current, { opacity: 0, y: 10 });

        const counter = { val: 0 };
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 78%", once: true },
        });
        tl.to(numberRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
          .to(
            counter,
            {
              val: targetNum,
              duration: 0.5,
              ease: "power2.out",
              onUpdate: () => {
                if (numberRef.current) {
                  numberRef.current.textContent = String(Math.round(counter.val)).padStart(2, "0");
                }
              },
            },
            "<",
          )
          .to(ruleRef.current, { scaleX: 1, duration: 0.7, ease: "expo.out" }, "-=0.2")
          .to(headingLineRef.current, { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, "-=0.55")
          .to(items, { yPercent: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.08 }, "-=0.5");
      }

      // Marks this cluster "active" while its middle band crosses the
      // middle of the viewport — independent of (and outliving) the
      // one-shot reveal timeline above.
      ScrollTrigger.create({
        trigger: root,
        start: "top 55%",
        end: "bottom 55%",
        onEnter: () => onActive(position),
        onEnterBack: () => onActive(position),
      });
    }, rootRef);

    return () => ctx.revert();
  }, [position, reducedMotion, onActive]);

  return (
    <div
      ref={rootRef}
      className="border-t border-paper/10 py-10 first:border-t-0 sm:py-14 lg:py-16"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-28 lg:col-span-4">
          <div className="flex items-baseline gap-3 font-mono-label text-paper/50">
            <span ref={numberRef} className="text-sm tracking-[0.1em] text-paper">
              00
            </span>
            <span className="text-[10px] tracking-[0.2em] text-paper/30">
              / {String(total).padStart(2, "0")}
            </span>
          </div>

          <div
            ref={ruleRef}
            className="my-5 h-px w-16 origin-left"
            style={{ backgroundColor: data.accent }}
          />

          <h3 className="overflow-hidden">
            <span
              ref={headingLineRef}
              className="block font-display text-[clamp(2.1rem,4.2vw,3.6rem)] font-black uppercase leading-[0.95] text-paper [font-variation-settings:'wght'_800,'CNTR'_0]"
            >
              {data.title}
            </span>
          </h3>

          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/50">{data.summary}</p>
        </div>

        {/* Each row is a disclosure button rather than a link — there's no
            per-service page to send visitors to, so clicking expands the
            row in place to reveal `description` (falling back to `detail`)
            instead of pointing an arrow at a dead destination. */}
        <ul className="lg:col-span-8">
          {data.items.map((item, i) => {
            const isOpen = openIndex === i;
            const panelId = `${data.index}-item-${i}`;
            return (
              <li key={item.title} className="border-b border-paper/10 first:border-t lg:first:border-t-0">
                <button
                  type="button"
                  data-cursor="link"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="reveal-item group flex w-full items-center justify-between gap-6 py-6 text-left sm:py-7"
                >
                  <span className="min-w-0">
                    <span className="relative inline-block">
                      <span className="block text-[clamp(1.15rem,2.3vw,1.65rem)] leading-snug text-paper transition-transform duration-500 ease-art group-hover:translate-x-3">
                        {item.title}
                      </span>
                      <span
                        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-art group-hover:scale-x-100"
                        style={{ backgroundColor: data.accent }}
                      />
                    </span>
                    {item.detail && (
                      <span className="mt-1.5 block max-w-md text-sm text-paper/45">{item.detail}</span>
                    )}
                  </span>

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-paper/40 transition-all duration-500 ease-art group-hover:border-paper/40 group-hover:text-paper ${
                      isOpen ? "rotate-180 border-paper/40 text-paper" : "border-paper/15"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                <div
                  id={panelId}
                  className="grid transition-[grid-template-rows] duration-500 ease-art"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-lg pb-6 pr-16 text-sm leading-relaxed text-paper/55 sm:pb-7">
                      {item.description ?? item.detail}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
