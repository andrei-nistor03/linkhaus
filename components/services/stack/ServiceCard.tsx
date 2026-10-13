"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { ServiceClusterData } from "../servicesData";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

// Demo scenes are authored on a 480×320 board (mirrors `.sd-canvas`), but
// their content sits within ~444×324 of it, so fit to that and let the
// empty board margins crop on narrow stages.
const CONTENT_W = 444;
const CONTENT_H = 324;

interface ServiceCardProps {
  data: ServiceClusterData;
  position: number;
  total: number;
  step: number;
  playing: boolean;
  scenes: ReactNode[];
  onSelect: (step: number) => void;
  stickyRef: (el: HTMLDivElement | null) => void;
  cardRef: (el: HTMLElement | null) => void;
  shadeRef: (el: HTMLDivElement | null) => void;
}

function readableInk(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0d0d0d" : "#ffffff";
}

function itemState(i: number, step: number) {
  if (i < step) return "past";
  if (i === step) return "active";
  return "future";
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function ServiceCard({
  data,
  position,
  total,
  step,
  playing,
  scenes,
  onSelect,
  stickyRef,
  cardRef,
  shadeRef,
}: ServiceCardProps) {
  const titleId = `svc-card-${data.index}`;
  const accentVars: Vars = {
    "--accent": data.accent,
    "--accent-15": `${data.accent}26`,
    "--accent-30": `${data.accent}4d`,
    "--accent-ink": readableInk(data.accent),
  };

  return (
    <div ref={stickyRef} className="svc-sticky" style={{ "--i": position } as Vars}>
      <article ref={cardRef} className="svc-card" style={accentVars} aria-labelledby={titleId}>
        <div ref={shadeRef} className="svc-shade" aria-hidden="true" />

        <header>
          <div className="font-mono-label flex items-center gap-3 text-[10px] text-paper/40">
            <span className="text-paper">{data.index}</span>
            <span>/ {pad(total)}</span>
            <span className="h-px w-8" style={{ backgroundColor: data.accent }} />
          </div>
          <h3
            id={titleId}
            className="mt-2 font-display text-[clamp(1.65rem,min(4.4vw,6.2vh),3.75rem)] font-black uppercase leading-[0.9] text-paper [font-variation-settings:'wght'_800,'CNTR'_0]"
          >
            {data.title}
          </h3>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-12 lg:grid-rows-1 lg:gap-10">
          <DemoStage step={step} playing={playing} scenes={scenes} />

          {/* Desktop and portrait tablets (≥768w, ≥900h): full list, active item expanded */}
          <ol className="hidden min-h-0 flex-col justify-center lg:col-span-5 lg:flex [@media(min-width:768px)_and_(min-height:900px)]:flex">
            {data.items.map((item, i) => {
              const state = itemState(i, step);
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    data-cursor="link"
                    data-state={state}
                    aria-current={state === "active" ? "step" : undefined}
                    onClick={() => onSelect(i)}
                    className="svc-item"
                  >
                    <span className="font-mono-label pt-1.5 text-[10px]">{pad(i + 1)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="svc-item-title">{item.title}</span>
                      <span className="svc-item-body">
                        <span className="overflow-hidden">
                          <span className="block max-w-md pt-2.5 text-sm leading-relaxed text-paper/55">
                            {item.description ?? item.detail}
                          </span>
                        </span>
                      </span>
                    </span>
                  </button>
                  <div className="svc-progress" data-state={state}>
                    <span className="svc-progress-fill" />
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Phones / short tablets: story-style pager */}
          <div className="lg:hidden [@media(min-width:768px)_and_(min-height:900px)]:hidden">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 gap-1.5" role="tablist" aria-label={`${data.title} services`}>
                {data.items.map((item, i) => {
                  const state = itemState(i, step);
                  return (
                    <button
                      key={item.title}
                      type="button"
                      role="tab"
                      aria-selected={state === "active"}
                      aria-label={item.title}
                      onClick={() => onSelect(i)}
                      className="svc-seg"
                    >
                      <span className="svc-progress" data-state={state}>
                        <span className="svc-progress-fill" />
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="font-mono-label text-[10px] text-paper/40">
                <span className="text-paper">{pad(step + 1)}</span> / {pad(data.items.length)}
              </span>
            </div>

            <div className="svc-pager mt-2.5" aria-live="polite">
              {data.items.map((item, i) => (
                <div key={item.title} data-active={i === step} aria-hidden={i !== step}>
                  <div className="text-[1.05rem] font-medium leading-snug text-paper sm:text-xl">{item.title}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-paper/55 sm:text-[15px]">
                    {item.description ?? item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

function DemoStage({ step, playing, scenes }: { step: number; playing: boolean; scenes: ReactNode[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  // Bumping a scene's run id remounts its board, restarting its CSS
  // animations from the top each time that service becomes active.
  const [runs, setRuns] = useState(() => scenes.map(() => 0));
  const prevStep = useRef(step);

  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    setRuns((r) => r.map((v, i) => (i === step ? v + 1 : v)));
  }, [step]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const fit = Math.min(width / CONTENT_W, height / CONTENT_H);
      stage.style.setProperty("--fit", fit.toFixed(4));
    });
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className="svc-stage flex-1 lg:col-span-7 lg:h-full"
      data-playing={playing}
      aria-hidden="true"
    >
      {scenes.map((scene, i) => (
        <div key={i} className="sd-scene" data-active={i === step}>
          <div key={runs[i]} className="sd-canvas">
            {scene}
          </div>
        </div>
      ))}
      <div className="svc-stage-chip">
        <i />
        Live preview
      </div>
    </div>
  );
}
