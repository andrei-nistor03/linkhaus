/**
 * Re-exported from components/preloader — the cinematic loading sequence
 * lives there (Preloader.tsx orchestrator + LoadingVisual/LoadingProgress/
 * LoadingMessages + lib/useLoadingProgress.ts). Kept as a re-export at this
 * path so existing imports (Hero.tsx, Nav.tsx, app/page.tsx) don't need to
 * change.
 */
export { default, INTRO_COMPLETE_EVENT } from "@/components/preloader/Preloader";
