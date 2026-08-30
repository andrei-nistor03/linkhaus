"use client";

/**
 * Lets code outside the DOM event system — specifically R3F meshes inside a
 * <Canvas>, which never fire real `mouseover`/`mouseout` per-object the way
 * CustomCursor's own `data-cursor` attribute detection expects — force the
 * cursor into one of its variants. CustomCursor subscribes to this and lets
 * an active override win over whatever the plain DOM hover detection found;
 * clearing the override (`null`) hands control back to the DOM path.
 *
 * A tiny pub/sub rather than React context: the publishers (ProjectPanel,
 * one per gallery panel) live deep inside a Canvas tree with no reason to
 * share a React tree with CustomCursor, and there's at most one subscriber.
 */
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
