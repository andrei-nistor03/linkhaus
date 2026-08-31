"use client";

import type { MouseEvent } from "react";

export type NavTransitionHandler = (target: string) => void;

let handler: NavTransitionHandler | null = null;

export function setNavTransitionHandler(fn: NavTransitionHandler | null) {
  handler = fn;
}

export function requestSectionTransition(target: string) {
  handler?.(target);
}

export function handleSectionLink(
  e: MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  e.preventDefault();
  requestSectionTransition(href);
}
