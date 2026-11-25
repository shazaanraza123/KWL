"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export type FlashPopHandle = {
  trigger: () => void;
};

export const FlashPop = forwardRef<FlashPopHandle>(function FlashPop(_, ref) {
  const el = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    trigger() {
      const node = el.current;
      if (!node) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      node.classList.remove("go");
      void node.offsetWidth;
      node.classList.add("go");
    },
  }));

  return <div className="pop" ref={el} aria-hidden="true" />;
});
