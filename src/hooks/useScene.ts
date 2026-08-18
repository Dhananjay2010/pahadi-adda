"use client";

import { useState } from "react";
import { SCENES, DEFAULT_SCENE_ID } from "@/components/scenes";

const STORAGE_KEY = "pahadi-adda-scene";

function readStored(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && SCENES.some((s) => s.id === stored) ? stored : DEFAULT_SCENE_ID;
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
  }

  return { sceneId, setSceneId };
}
