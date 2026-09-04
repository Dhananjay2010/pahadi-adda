"use client";

import { useEffect, useRef } from "react";

/**
 * The keyboard shortcuts, written down somewhere.
 *
 * They all existed already, but the only place they were named was inside
 * hover tooltips on the controls — which means they were invisible to anyone
 * who never hovered, and don't exist at all on a phone. A list you can open
 * is the difference between a feature and a secret.
 */
const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Space"], label: "चलाएं / रोकें" },
  { keys: ["←", "→"], label: "5 सेकंड पीछे / आगे" },
  { keys: ["Shift + ←/→", "P", "N"], label: "पिछला / अगला गीत" },
  { keys: ["↑", "↓"], label: "आवाज़ कम / ज़्यादा" },
  { keys: ["M"], label: "म्यूट करें" },
  { keys: ["S"], label: "शफल" },
  { keys: ["V"], label: "वीडियो देखें" },
  { keys: ["/"], label: "गीत खोजें" },
  { keys: ["?"], label: "यही सूची" },
  { keys: ["Esc"], label: "खुला हुआ पैनल बंद करें" },
];

export default function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Opened from a keypress as often as from the button, so focus has to
  // follow it in — otherwise Tab carries on from wherever it was and Esc is
  // the only way back out.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="side-panel shortcuts-panel" role="dialog" aria-modal="false" aria-label="कीबोर्ड शॉर्टकट">
      <div className="panel-header">
        <span>कीबोर्ड शॉर्टकट</span>
        <button
          ref={closeRef}
          className="panel-close"
          onClick={onClose}
          data-tip="बंद करें (Esc)"
          aria-label="बंद करें"
        >
          ✕
        </button>
      </div>
      <dl className="shortcuts-list">
        {SHORTCUTS.map((shortcut) => (
          <div className="shortcuts-row" key={shortcut.keys.join("+") + shortcut.label}>
            <dt>
              {shortcut.keys.map((key) => (
                <kbd key={key}>{key}</kbd>
              ))}
            </dt>
            <dd>{shortcut.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
