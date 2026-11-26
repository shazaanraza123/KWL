"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { COLORWAYS, type BeltView, type Side } from "@/lib/colorways";
import { BeltControls } from "./BeltControls";
import { BeltStage, type BeltStageHandle } from "./BeltStage";
import { ColorwayPicker } from "./ColorwayPicker";
import { FlashPop, type FlashPopHandle } from "./FlashPop";
import { Signup } from "./Signup";

export function PreLaunch() {
  const [ci, setCi] = useState(0);
  const [side, setSide] = useState<Side>("a");
  const [view, setView] = useState<BeltView>("closed");
  const busy = useRef(false);
  const pop = useRef<FlashPopHandle>(null);
  const stage = useRef<BeltStageHandle>(null);

  const cw = COLORWAYS[ci];
  const face = side === "a" ? cw.a : cw.b;

  const flip = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setSide((s) => (s === "a" ? "b" : "a"));
    window.setTimeout(() => (busy.current = false), 540);
  }, []);

  function flash() {
    pop.current?.trigger();
    stage.current?.flash();
  }

  return (
    <>
      <main>
        <button type="button" className="name" onClick={flash} aria-label="Flash. Take a flash photo of the buckle">
          FLASH
        </button>

        <BeltStage
          ref={stage}
          colorway={cw}
          side={side}
          view={view}
          onFlip={flip}
          label={`${cw.id} ${cw.name}, ${face.n} side showing. Flip the belt`}
        />

        <ColorwayPicker
          index={ci}
          onChange={(i) => {
            setCi(i);
            setSide("a");
          }}
        />
        <BeltControls view={view} faceName={face.n} onView={setView} onFlip={flip} />

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
          <Link href="/contact">CONTACT</Link>
          <a href="mailto:contact@kwlstudio.shop">CONTACT@KWLSTUDIO.SHOP</a>
        </footer>
      </main>
      <FlashPop ref={pop} />
    </>
  );
}
