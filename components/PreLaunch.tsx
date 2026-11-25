"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { COLORWAYS, type BeltView, type Side } from "@/lib/colorways";
import { Belt } from "./Belt";
import { BeltControls } from "./BeltControls";
import { Buckle } from "./Buckle";
import { ColorwayPicker } from "./ColorwayPicker";
import { FlashPop, type FlashPopHandle } from "./FlashPop";
import { Signup } from "./Signup";

function subscribeMobile(onChange: () => void) {
  const mql = window.matchMedia("(max-width: 640px)");
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useMobileDefaultView(): BeltView {
  const mobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 640px)").matches,
    () => false,
  );
  return mobile ? "detail" : "full";
}

export function PreLaunch() {
  const [ci, setCi] = useState(0);
  const [side, setSide] = useState<Side>("a");
  const defaultView = useMobileDefaultView();
  const [viewOverride, setViewOverride] = useState<BeltView | null>(null);
  const view = viewOverride ?? defaultView;
  const [lit, setLit] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const litT = useRef(0);
  const pop = useRef<FlashPopHandle>(null);
  const heroBuckleId = useId().replace(/:/g, "") + "hb";

  const cw = COLORWAYS[ci];
  const face = side === "a" ? cw.a : cw.b;

  useEffect(() => () => clearTimeout(litT.current), []);

  const flip = useCallback(() => {
    if (busy.current) return;
    const el = wrap.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !el || !el.animate) {
      setSide((s) => (s === "a" ? "b" : "a"));
      return;
    }
    busy.current = true;
    const done = () => {
      busy.current = false;
    };
    el
      .animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.02)" }], {
        duration: 200,
        easing: "cubic-bezier(.55,0,.8,.3)",
        fill: "forwards",
      })
      .finished.then(() => {
        setSide((s) => (s === "a" ? "b" : "a"));
        return new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            el
              .animate([{ transform: "scaleY(.02)" }, { transform: "scaleY(1)" }], {
                duration: 200,
                easing: "cubic-bezier(.2,.7,.45,1)",
                fill: "forwards",
              })
              .finished.then(() => resolve())
              .catch(() => resolve());
          });
        });
      })
      .catch(() => undefined)
      .finally(done);
  }, []);

  function flash() {
    pop.current?.trigger();
    if (!cw.flash) return;
    clearTimeout(litT.current);
    setLit(true);
    litT.current = window.setTimeout(() => setLit(false), 1500);
  }

  function pickColorway(index: number) {
    setCi(index);
    setSide("a");
  }

  return (
    <>
      <main>
        <h1 className="logo" aria-label="KWL" />

        <button
          type="button"
          className="hero"
          onClick={flip}
          aria-label={`Flip the belt. ${face.n} side showing`}
        >
          <svg viewBox="-44 -44 88 88" aria-hidden="true">
            <Buckle cw={cw} id={heroBuckleId} lit={lit} />
          </svg>
        </button>

        <button
          type="button"
          className="name"
          onClick={flash}
          aria-label="Flash. Take a flash photo of the buckle"
        >
          FLASH
        </button>

        <div className="beltwrap" ref={wrap}>
          <Belt colorway={cw} side={side} view={view} lit={lit} />
        </div>

        <ColorwayPicker index={ci} onChange={pickColorway} />
        <BeltControls view={view} faceName={face.n} onView={setViewOverride} onFlip={flip} />

        <div className="drop">
          <b>DROP 001</b> / TBA
        </div>

        <Signup colorway={cw} />

        <footer>
          <span>KWL STUDIO</span>
          <span>CHICAGO</span>
          <a href="https://instagram.com/kwlstudio" target="_blank" rel="noopener noreferrer">
            @KWLSTUDIO
          </a>
          <span>CONTACT@KWLSTUDIO.SHOP</span>
        </footer>
      </main>
      <FlashPop ref={pop} />
    </>
  );
}
