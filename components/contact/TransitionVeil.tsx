"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";

interface TransitionVeilProps {
  /** The Contact section's own root — the trigger this veil's wash is
   *  scrubbed against. Deliberately NOT reaching into Services' DOM: see
   *  the "no cross-section flying text" lesson from the Projects→Services
   *  handoff — this is a self-contained effect that only reads Contact's
   *  own scroll position, the version of "cinematic transition" that
   *  actually holds up. */
  sectionRef: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}

// The trigger's own full "top bottom" -> "top top" span covers a whole
// 100vh of scroll (Contact's sticky layer's entire approach into place —
// see the doc comment below); scrubbing the wash across all of that made
// it start while Contact was barely peeking into view and lag on well
// after it had settled. Insetting both ends keeps it a tight beat centered
// on the actual handoff instead.
const TRIGGER_START = "top 90%";
const TRIGGER_END = "top 1%";

/**
 * Plays over a short stretch of scroll while Contact's top edge is still
 * below the viewport, finishing shortly before the section's sticky
 * background engages (see TRIGGER_START/TRIGGER_END above — deliberately
 * inset from the full "top bottom" -> "top top" span so the effect reads
 * as a quick beat rather than something stretched across the whole
 * approach): a plain dark wash fades in alongside a backdrop blur, holds
 * for a beat, then both fade back out together to reveal Contact
 * underneath. No particle system or moving shape doing the covering — two
 * prior attempts at a particle-driven version (one flying through the
 * viewport's center, one blooming in place) both read as a gimmick rather
 * than a transition, so this drops back to the plainest version that still
 * does the actual job: covering the handoff long enough that Services'
 * departing content and Contact's own arriving content never have to be
 * visible at once. The one thing that does ride on top of that plain
 * fade is a single word — see below.
 *
 * Rendered `fixed` (see Contact.tsx, which mounts this as a direct child
 * of its own outer `<section>`, ahead of the sticky pinned layer rather
 * than inside it) rather than `absolute` on purpose. Contact's sticky
 * layer doesn't actually reach its stuck, full-viewport position until
 * scroll progress 1 of this same trigger window — before that it's just a
 * normal block sliding up from below — so an `absolute` wash nested inside
 * it would spend most of this animation off-screen (or clipped by that
 * layer's own `overflow-hidden`) and only become visible right as it
 * finishes fading out, which is invisible in practice. `fixed` anchors it
 * to the viewport directly, independent of where Contact's own layer
 * physically sits, the same way Hero.tsx's exit dissolve stays on-screen
 * for its whole run by living inside Hero's own (genuinely, GSAP-)pinned
 * layer — this is the CSS-sticky-friendly equivalent of that guarantee.
 *
 * z-30 — deliberately ABOVE Contact's own content layer (z-20 in
 * Contact.tsx): the whole point of the peak-opacity moment is to cover
 * whatever's on screen, content included, before the fade-out uncovers it
 * again, so this has to sit on top of it rather than behind it.
 *
 * A single word — "CONTACT" — blurs/scales into focus over the wash at its
 * peak and back out again on the same beats, the same blur+scale+opacity
 * entrance Services.tsx's own headline and Contact.tsx's own title lines
 * use for their reveals, just mirrored on the way out too. Plain
 * text-paper, no stroke or gradient fill — see the Thunder variable font's
 * CNTR axis being kept at 0 rather than maxed (that axis is stroke-
 * contrast, not boldness) and the general "stays fully blended, no solid
 * outline" rule this site's display type already follows elsewhere.
 */
export default function TransitionVeil({
  sectionRef,
  reducedMotion,
}: TransitionVeilProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    registerGsap();
    const section = sectionRef.current;
    const root = rootRef.current;
    if (!section || !root) return;

    if (reducedMotion) {
      gsap.set(root, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(root, { opacity: 1 });
      gsap.set(washRef.current, { opacity: 0 });
      gsap.set(textRef.current, {
        opacity: 0,
        scale: 1.16,
        filter: "blur(18px)",
      });

      // backdrop-filter's blur radius isn't a transform GSAP can tween
      // directly, so a plain proxy object drives it and writes the actual
      // CSS on every tick — same "tween a number, apply it by hand" pattern
      // Nav.tsx and Contact.tsx's own content-fade already use for
      // filter/backdrop values GSAP has no native handle for.
      const blur = { px: 0 };
      const applyBlur = () => {
        root.style.backdropFilter = `blur(${blur.px}px)`;
        root.style.setProperty("-webkit-backdrop-filter", `blur(${blur.px}px)`);
      };

      // Because this whole component is `fixed` (see the doc comment
      // above), the on-screen time this window buys is real regardless of
      // where Contact's own sticky layer physically is yet.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: TRIGGER_START,
          end: TRIGGER_END,
          scrub: 0.4,
        },
      });

      tl.to(
        washRef.current,
        { opacity: 0.92, duration: 0.4, ease: "power2.out" },
        0,
      )
        .to(
          blur,
          { px: 28, duration: 0.4, ease: "power2.out", onUpdate: applyBlur },
          0,
        )
        .to(
          textRef.current,
          {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power2.out",
          },
          0,
        )
        .to(
          washRef.current,
          { opacity: 0, duration: 0.5, ease: "power1.in" },
          0.55,
        )
        .to(
          blur,
          { px: 0, duration: 0.5, ease: "power1.in", onUpdate: applyBlur },
          0.55,
        )
        .to(
          textRef.current,
          {
            opacity: 0,
            scale: 0.94,
            filter: "blur(14px)",
            duration: 0.45,
            ease: "power1.in",
          },
          0.55,
        );
    }, rootRef);

    return () => {
      ctx.revert();
      // The blur proxy tween writes to root.style directly (see applyBlur
      // above) rather than through a gsap-tracked property, so ctx.revert()
      // doesn't know to undo it — clear it by hand so an unmount mid-blur
      // never leaves the page permanently blurred.
      root.style.backdropFilter = "";
      root.style.removeProperty("-webkit-backdrop-filter");
    };
  }, [sectionRef, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
    >
      <div ref={washRef} className="absolute inset-0 bg-ink" />
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <span
          ref={textRef}
          className="font-display font-black uppercase leading-none tracking-wide text-paper [font-variation-settings:'wght'_900,'CNTR'_0] text-[clamp(2.5rem,9vw,7rem)]"
          style={{ willChange: "transform, opacity, filter" }}
        >
          CONTACT
        </span>
      </div>
    </div>
  );
}
