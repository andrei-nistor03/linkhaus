"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * WebGL context creation or asset loading can fail on old hardware/browsers.
 * Rather than take the whole page down, fall back to a static gradient so
 * the hero copy and layout still read cleanly.
 */
export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[LINKHAUS] 3D scene failed to mount, using fallback.", error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
