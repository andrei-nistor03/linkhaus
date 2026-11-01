"use client";

export const scrollState = {
  heroProgress: 0,
  pointer: { x: 0, y: 0 },
  pointerEased: { x: 0, y: 0 },
};

export type ScrollState = typeof scrollState;
