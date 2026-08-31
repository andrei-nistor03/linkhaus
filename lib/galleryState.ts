"use client";

export const galleryState = {
  progress: 0,
  velocity: 0,
  focusX: 0,
  hoveredIndex: -1,
};

export type GalleryState = typeof galleryState;
