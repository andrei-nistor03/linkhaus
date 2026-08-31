"use client";

export type CursorOverride = "default" | "link" | "project" | "3d" | null;

type Listener = (v: CursorOverride) => void;

const listeners = new Set<Listener>();
let current: CursorOverride = null;

export function setCursorOverride(v: CursorOverride) {
  if (current === v) return;
  current = v;
  listeners.forEach((l) => l(v));
}

export function subscribeCursorOverride(listener: Listener) {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}
