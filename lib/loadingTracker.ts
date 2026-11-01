"use client";

// Progress of three.js asset loads, written by components/three/trackLoading
// (which lives in the lazily loaded scene chunk) and read by the preloader.
// Kept free of any three import so the preloader doesn't pull the library
// into the page's initial bundle.
export const threeLoading = {
  started: false,
  loaded: 0,
  total: 0,
  done: false,
};
