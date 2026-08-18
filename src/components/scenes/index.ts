import type { ComponentType } from "react";
import TempleDusk from "./TempleDusk";
import HimalayanSunrise from "./HimalayanSunrise";
import TerracedVillage from "./TerracedVillage";
import GangaGhat from "./GangaGhat";
import BugyalMeadow from "./BugyalMeadow";

export type Scene = {
  id: string;
  label: string;
  swatch: string;
  Component: ComponentType;
};

export const SCENES: Scene[] = [
  { id: "temple-dusk", label: "मंदिर की शाम", swatch: "#8a4a4f", Component: TempleDusk },
  { id: "himalayan-sunrise", label: "हिमालय सूर्योदय", swatch: "#f0b98a", Component: HimalayanSunrise },
  { id: "terraced-village", label: "सीढ़ीदार गाँव", swatch: "#7fae5c", Component: TerracedVillage },
  { id: "ganga-ghat", label: "गंगा घाट", swatch: "#c96f52", Component: GangaGhat },
  { id: "bugyal-meadow", label: "बुग्याल", swatch: "#6fa14e", Component: BugyalMeadow },
];

export const DEFAULT_SCENE_ID = SCENES[0].id;
