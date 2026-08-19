type RGB = [number, number, number];
type SkyStops = [RGB, RGB, RGB, RGB]; // top, upper, lower, horizon

type Anchor = {
  hour: number;
  sky: SkyStops;
  /** 0..1 — how visible stars/milky-way are. */
  nightAlpha: number;
  /** 0..1 — warm horizon-glow strength (strongest at dawn/dusk). */
  glowAlpha: number;
};

// Hand-tuned anchor points through the day. Interpolated between neighbors
// (see getTimePalette) so the sky shifts continuously — no visible "scene
// swap", just one sky that's always slightly different from a minute ago.
const ANCHORS: Anchor[] = [
  { hour: 0, sky: [[4, 6, 20], [10, 14, 40], [20, 22, 56], [28, 28, 64]], nightAlpha: 1, glowAlpha: 0.05 },
  { hour: 4, sky: [[5, 7, 24], [13, 16, 46], [26, 26, 62], [38, 32, 70]], nightAlpha: 0.95, glowAlpha: 0.08 },
  { hour: 5.5, sky: [[10, 14, 42], [35, 32, 70], [95, 68, 92], [150, 92, 96]], nightAlpha: 0.5, glowAlpha: 0.45 },
  { hour: 6.5, sky: [[35, 50, 95], [110, 110, 150], [224, 138, 110], [255, 180, 130]], nightAlpha: 0.08, glowAlpha: 0.85 },
  { hour: 8, sky: [[55, 120, 175], [120, 175, 215], [205, 225, 235], [255, 230, 205]], nightAlpha: 0, glowAlpha: 0.3 },
  { hour: 12, sky: [[46, 125, 200], [110, 180, 220], [190, 222, 240], [232, 246, 255]], nightAlpha: 0, glowAlpha: 0.05 },
  { hour: 15.5, sky: [[56, 125, 190], [120, 180, 215], [205, 228, 238], [255, 238, 210]], nightAlpha: 0, glowAlpha: 0.15 },
  { hour: 17.5, sky: [[50, 80, 135], [150, 110, 140], [228, 140, 105], [255, 196, 130]], nightAlpha: 0.05, glowAlpha: 0.85 },
  { hour: 19, sky: [[22, 26, 70], [62, 45, 90], [150, 70, 95], [214, 110, 85]], nightAlpha: 0.35, glowAlpha: 0.55 },
  { hour: 20.5, sky: [[10, 12, 40], [24, 22, 58], [55, 38, 66], [85, 45, 58]], nightAlpha: 0.75, glowAlpha: 0.2 },
  { hour: 22, sky: [[5, 7, 24], [12, 14, 42], [24, 22, 55], [32, 26, 60]], nightAlpha: 0.95, glowAlpha: 0.08 },
  { hour: 24, sky: [[4, 6, 20], [10, 14, 40], [20, 22, 56], [28, 28, 64]], nightAlpha: 1, glowAlpha: 0.05 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgbCss([r, g, b]: RGB): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export type TimePalette = {
  skyGradient: string;
  nightAlpha: number;
  glowAlpha: number;
};

/** Everything time-of-day-dependent about the scene, derived from one hour value. */
export function getTimePalette(hour: number): TimePalette {
  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (hour >= a.hour && hour <= b.hour) {
      const t = (hour - a.hour) / (b.hour - a.hour);
      const sky = a.sky.map((stop, idx) => lerpRgb(stop, b.sky[idx], t)) as SkyStops;
      return {
        skyGradient: `linear-gradient(180deg, ${rgbCss(sky[0])} 0%, ${rgbCss(sky[1])} 38%, ${rgbCss(sky[2])} 72%, ${rgbCss(sky[3])} 100%)`,
        nightAlpha: lerp(a.nightAlpha, b.nightAlpha, t),
        glowAlpha: lerp(a.glowAlpha, b.glowAlpha, t),
      };
    }
  }
  const first = ANCHORS[0];
  return {
    skyGradient: `linear-gradient(180deg, ${rgbCss(first.sky[0])} 0%, ${rgbCss(first.sky[1])} 38%, ${rgbCss(first.sky[2])} 72%, ${rgbCss(first.sky[3])} 100%)`,
    nightAlpha: first.nightAlpha,
    glowAlpha: first.glowAlpha,
  };
}
