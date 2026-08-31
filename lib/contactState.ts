"use client";

export const contactState = {
  progress: 0,
  pointer: { x: 0, y: 0 },
  pointerEased: { x: 0, y: 0 },
  hoverBoost: 0,
  hoverBoostTarget: 0,
  isTouch: false,
  reducedMotion: false,
};

export type ContactState = typeof contactState;
