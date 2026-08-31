"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, CustomEase, SplitText);
  CustomEase.create("art", "0.16, 1, 0.3, 1");
  registered = true;
}

export { gsap, ScrollTrigger, SplitText };
