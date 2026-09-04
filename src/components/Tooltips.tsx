"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Tip = { text: string; x: number; y: number; below: boolean };

/**
 * One tooltip for the whole page, driven by a `data-tip` attribute on any
 * control. This replaces the browser's own `title` tooltips, which is the
 * point: those only appear after about a second of holding the pointer
 * perfectly still, render in the OS's styling rather than the site's, and
 * never show up for keyboard users at all — so in practice nobody here
 * ever saw them. This one appears quickly, follows focus as well as hover,
 * and is drawn in the page so it sits above the card's blur.
 *
 * Skipped on touch, where there's no hover to hang it on.
 */
export default function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const cancel = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    const hide = () => {
      cancel();
      setTip(null);
    };

    const open = (el: Element, delay: number) => {
      const text = (el as HTMLElement).dataset.tip;
      if (!text) return;
      cancel();
      timerRef.current = window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        // Above the control by default; below it when there's no room up
        // there (the topbar buttons).
        const below = r.top < 56;
        setTip({
          text,
          x: r.left + r.width / 2,
          y: below ? r.bottom + 8 : r.top - 8,
          below,
        });
      }, delay);
    };

    const target = (e: Event) =>
      (e.target as HTMLElement | null)?.closest?.("[data-tip]") ?? null;

    const onOver = (e: MouseEvent) => {
      const el = target(e);
      if (el) open(el, 280);
      else hide();
    };
    const onOut = (e: MouseEvent) => {
      if (target(e)) hide();
    };
    // Keyboard users get the same hint when tabbing through the controls.
    const onFocusIn = (e: FocusEvent) => {
      const el = target(e);
      if (el && el.matches(":focus-visible")) open(el, 0);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("keydown", onKeyDown);
    // A control that vanishes or moves under the pointer (opening a panel,
    // expanding the video) must not leave its tooltip stranded.
    window.addEventListener("click", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      cancel();
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("click", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, []);

  // Keep the bubble on screen: it's centred on the control, which isn't
  // possible within 8px of either edge.
  useLayoutEffect(() => {
    const el = bubbleRef.current;
    if (!el || !tip) return;
    const half = el.offsetWidth / 2;
    const x = Math.min(Math.max(tip.x, half + 8), window.innerWidth - half - 8);
    el.style.left = `${x}px`;
  }, [tip]);

  if (!tip) return null;

  return (
    <div
      ref={bubbleRef}
      className={`tooltip${tip.below ? " below" : ""}`}
      style={{ left: `${tip.x}px`, top: `${tip.y}px` }}
      role="tooltip"
    >
      {tip.text}
    </div>
  );
}
