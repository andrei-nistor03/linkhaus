"use client";

import { useLayoutEffect, useRef, useState, type MutableRefObject } from "react";

interface FitWidthLinesProps {
  /** Each entry renders as its own line, in order. */
  lines: string[];
  /** Outer element — `h1` for the title, `p` for the subtitle. */
  as: "h1" | "p";
  /** Classes for the outer element (layout/centering only, no type styles). */
  wrapperClassName?: string;
  /** Classes for every line — font, color, weight, the 3D/invert treatment. */
  lineClassName: string;
  /**
   * Optional ref this component populates with each line's own DOM node
   * (index-aligned with `lines`), so a parent can animate individual
   * lines directly — e.g. a staggered entrance — without reaching into
   * this component's internal structure.
   */
  linesRef?: MutableRefObject<(HTMLSpanElement | null)[]>;
  /**
   * Index of a line to render as one `<span>` per character instead of
   * one text node — so a parent can animate individual letters (e.g. a
   * per-letter entrance) via `charsRef`. The split line still counts as
   * one line for the width-fit measurement above; splitting it into
   * inline-block character spans doesn't change its rendered width.
   */
  splitLineIndex?: number;
  /** Populated with the split line's own character DOM nodes, in order. */
  charsRef?: MutableRefObject<(HTMLSpanElement | null)[]>;
}

/**
 * Renders `lines` stacked one-per-row, each scaled by font-size so every
 * line renders at the same width as the first ("anchor") line — the
 * "Welcome" column effect in the hero title. CSS alone can't do this for
 * single words (no spaces for `text-align: justify` to distribute), so
 * it's measured: on mount and on resize, every line is read at the
 * anchor's own font-size, then each non-anchor line's font-size is
 * rescaled by (anchorWidth / itsNaturalWidth).
 *
 * The anchor line keeps whatever size its `lineClassName` (or a
 * responsive clamp() within it) resolves to; every other line follows it.
 * Non-anchor lines stay invisible (but laid out) until sized, so there's
 * no flash of the un-scaled line at the anchor's font-size.
 */
export default function FitWidthLines({
  lines,
  as: Tag,
  wrapperClassName,
  lineClassName,
  linesRef,
  splitLineIndex,
  charsRef,
}: FitWidthLinesProps) {
  // Lines render as <span style="display:block">, not <div> — the `p` variant
  // (subtitle) can only contain phrasing content, and a <div> descendant of a
  // <p> gets silently split out by the HTML parser, which both breaks the
  // line-per-row layout and throws a hydration mismatch.
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [fontSizes, setFontSizes] = useState<(number | undefined)[]>(() => lines.map(() => undefined));

  useLayoutEffect(() => {
    function recalc() {
      const anchor = lineRefs.current[0];
      if (!anchor) return;

      // Drop prior overrides first so every line measures at its natural,
      // un-scaled (CSS-driven) width before we compare them.
      for (const el of lineRefs.current) {
        if (el) el.style.fontSize = "";
      }

      const anchorFontSizePx = parseFloat(getComputedStyle(anchor).fontSize);
      const anchorWidth = anchor.getBoundingClientRect().width;
      if (!anchorWidth) return;

      setFontSizes(
        lines.map((_, i) => {
          if (i === 0) return undefined;
          const el = lineRefs.current[i];
          const naturalWidth = el?.getBoundingClientRect().width;
          if (!el || !naturalWidth) return undefined;
          return anchorFontSizePx * (anchorWidth / naturalWidth);
        }),
      );
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [lines]);

  return (
    <Tag className={wrapperClassName} aria-label={lines.join(" ")}>
      {lines.map((line, i) => (
        <span
          key={i}
          ref={(el) => {
            lineRefs.current[i] = el;
            if (linesRef) linesRef.current[i] = el;
          }}
          aria-hidden="true"
          className={lineClassName}
          style={{
            // `table`, not `block`: a block box defaults to full container
            // width (which is what every line measured, breaking the
            // fit-to-anchor-width math below — every "natural width" came
            // back equal to the container). `table` still stacks as its
            // own row like `block` does, but shrink-wraps to content like
            // `inline-block`, so getBoundingClientRect() reports the
            // line's actual text width.
            display: "table",
            whiteSpace: "nowrap",
            visibility: i === 0 || fontSizes[i] !== undefined ? "visible" : "hidden",
            fontSize: i > 0 && fontSizes[i] ? `${fontSizes[i]}px` : undefined,
          }}
        >
          {i === splitLineIndex
            ? line.split("").map((char, ci) => (
                <span
                  key={ci}
                  ref={(el) => {
                    if (charsRef) charsRef.current[ci] = el;
                  }}
                  style={{ display: "inline-block" }}
                >
                  {char}
                </span>
              ))
            : line}
        </span>
      ))}
    </Tag>
  );
}
