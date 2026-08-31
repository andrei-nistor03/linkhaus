"use client";

export const scrollState = {
  heroProgress: 0,
  velocity: 0,
  pointer: { x: 0, y: 0 },
  pointerEased: { x: 0, y: 0 },
  isTouch: false,
  reducedMotion: false,
};

export type ScrollState = typeof scrollState;
