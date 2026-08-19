"use client";

import { useState } from "react";
import { SCENES, DEFAULT_SCENE_ID } from "@/components/scenes";

const STORAGE_KEY = "pahadi-adda-scene";
const MANUAL_KEY = "pahadi-adda-scene-manual";

/** Local hour -> the scene whose lighting actually matches that time of day. */
function sceneForHour(hour: number): string {
  if (hour >= 5 && hour < 8) return "himalayan-sunrise";
  if (hour >= 8 && hour < 13) return "terraced-village";
  if (hour >= 13 && hour < 17) return "bugyal-meadow";
  if (hour >= 17 && hour < 19) return "ganga-ghat";
  return "temple-dusk";
}

function readStored(): string {
  // Once someone has manually picked a scene, that choice sticks for good.
  // Until then, default to whatever matches their actual local time of day
  // instead of always opening on the same one.
  if (localStorage.getItem(MANUAL_KEY)) {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && SCENES.some((s) => s.id === stored) ? stored : DEFAULT_SCENE_ID;
  }
  return sceneForHour(new Date().getHours());
}

/**
 * Remembers the visitor's chosen background scene across visits. Only ever
 * used inside the ssr:false-rendered PahadiAdda tree (see
 * PahadiAddaLoader.tsx), so reading localStorage in the initializer is safe
 * — there's no server render to mismatch against.
 */
export function useScene() {
  const [sceneId, setSceneIdState] = useState(readStored);

  function setSceneId(id: string) {
    setSceneIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.setItem(MANUAL_KEY, "1");
  }

  return { sceneId, setSceneId };
}
