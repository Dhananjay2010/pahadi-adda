"use client";

import { SCENES } from "@/components/scenes";

export default function SceneSwitcher({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="scene-switcher" role="group" aria-label="दृश्य बदलें">
      {SCENES.map((scene) => (
        <button
          key={scene.id}
          type="button"
          className={`scene-dot${scene.id === activeId ? " active" : ""}`}
          style={{ "--swatch": scene.swatch } as React.CSSProperties}
          onClick={() => onChange(scene.id)}
          aria-label={scene.label}
          aria-pressed={scene.id === activeId}
          title={scene.label}
        />
      ))}
    </div>
  );
}
