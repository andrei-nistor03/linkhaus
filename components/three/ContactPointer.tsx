"use client";

import { useFrame } from "@react-three/fiber";
import { contactState } from "@/lib/contactState";
import { scrollState } from "@/lib/scrollState";

export default function ContactPointer() {
  useFrame((_, delta) => {
    contactState.pointer.x = scrollState.pointer.x;
    contactState.pointer.y = -scrollState.pointer.y;

    const ease = Math.min(1, delta * 3.2);
    contactState.pointerEased.x += (contactState.pointer.x - contactState.pointerEased.x) * ease;
    contactState.pointerEased.y += (contactState.pointer.y - contactState.pointerEased.y) * ease;
    const hoverEase = Math.min(1, delta * 4);
    contactState.hoverBoost += (contactState.hoverBoostTarget - contactState.hoverBoost) * hoverEase;
  });

  return null;
}
