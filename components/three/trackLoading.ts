import * as THREE from "three";
import { threeLoading } from "@/lib/loadingTracker";

// Imported first by HeroScene, so the manager is hooked up before any of the
// scene's loaders (e.g. WallsModel's preloads) start.
const manager = THREE.DefaultLoadingManager;
const prev = {
  onStart: manager.onStart,
  onProgress: manager.onProgress,
  onLoad: manager.onLoad,
  onError: manager.onError,
};

manager.onStart = (url, loaded, total) => {
  threeLoading.started = true;
  threeLoading.loaded = loaded;
  threeLoading.total = total;
  prev.onStart?.(url, loaded, total);
};
manager.onProgress = (url, loaded, total) => {
  threeLoading.loaded = loaded;
  threeLoading.total = total;
  prev.onProgress?.(url, loaded, total);
};
manager.onLoad = () => {
  threeLoading.done = true;
  prev.onLoad?.();
};
manager.onError = (url) => {
  threeLoading.done = true;
  prev.onError?.(url);
};
