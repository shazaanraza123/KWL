"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { BeltView, Colorway, Side } from "@/lib/colorways";
import type { BeltScene } from "./belt3d/scene";

export type BeltStageHandle = { flash: () => void };

type Props = {
  colorway: Colorway;
  side: Side;
  view: BeltView;
  onFlip: () => void;
  label: string;
};

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Real-time 3D belt with a pre-rendered still underneath (first paint + no-WebGL fallback). */
export const BeltStage = forwardRef<BeltStageHandle, Props>(function BeltStage(
  { colorway, side, view, onFlip, label },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<BeltScene | null>(null);
  const [ready, setReady] = useState(false);
  const latest = useRef({ colorway, side, view });
  latest.current = { colorway, side, view };

  useImperativeHandle(ref, () => ({
    flash() {
      scene.current?.flash();
    },
  }));

  useEffect(() => {
    const el = canvas.current;
    if (!el || !webglOk()) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => scene.current?.setReducedMotion(mq.matches);
    import("./belt3d/scene").then(({ BeltScene }) => {
      if (cancelled) return;
      const { colorway: c, side: s, view: v } = latest.current;
      scene.current = new BeltScene({
        canvas: el,
        colorway: c,
        side: s,
        view: v,
        reducedMotion: mq.matches,
        preserveDrawingBuffer: new URLSearchParams(window.location.search).has("capture"),
        onFirstFrame: () => setReady(true),
      });
      ro = new ResizeObserver(() => scene.current?.resize());
      ro.observe(el);
      mq.addEventListener("change", onMq);
      if (new URLSearchParams(window.location.search).has("capture")) {
        (window as unknown as { __belt?: BeltScene }).__belt = scene.current;
      }
    });
    return () => {
      cancelled = true;
      ro?.disconnect();
      mq.removeEventListener("change", onMq);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  useEffect(() => scene.current?.setColorway(colorway), [colorway]);
  useEffect(() => scene.current?.setSide(side), [side]);
  useEffect(() => scene.current?.setView(view), [view]);

  const still = `/stills/${colorway.id}-${side}-${view}.webp`;

  return (
    <button type="button" className="stage" onClick={onFlip} aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={`still${ready ? " hide" : ""}`}
        src={still}
        alt=""
        aria-hidden="true"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
      <canvas ref={canvas} className={`gl${ready ? " on" : ""}`} aria-hidden="true" />
    </button>
  );
});
