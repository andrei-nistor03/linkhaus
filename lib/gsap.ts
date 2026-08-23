"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Registers GSAP plugins exactly once, client-side only. Also defines the
 *  "art" ease so JS-driven tweens can match the `ease-art` cubic-bezier
 *  (0.16, 1, 0.3, 1) used for CSS transitions in tailwind.config.ts. */
export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create("art", "0.16, 1, 0.3, 1");
  registered = true;
}

export { gsap, ScrollTrigger };
