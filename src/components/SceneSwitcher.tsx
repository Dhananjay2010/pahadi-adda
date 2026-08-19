"use client";

import { SCENES } from "@/components/scenes";

export default function SceneSwitcher({
  activeId,
  onChange,
}: {
  activeId: string;
  onChange: (id: string) => void;
}) {
  const activeScene = SCENES.find((scene) => scene.id === activeId);

  return (
    <div>
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
      {/* Desktop hover tooltips (title attr above) don't exist on touch, so
          the active scene's name is always shown here too — otherwise
          there's no way on mobile to tell the dots apart. */}
      {activeScene && (
        <div className="scene-current-label" key={activeScene.id}>
          {activeScene.label}
        </div>
      )}
    </div>
  );
}
