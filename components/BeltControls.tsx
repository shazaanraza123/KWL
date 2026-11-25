"use client";

import type { BeltView } from "@/lib/colorways";

type Props = {
  view: BeltView;
  faceName: string;
  onView: (view: BeltView) => void;
  onFlip: () => void;
};

export function BeltControls({ view, faceName, onView, onFlip }: Props) {
  return (
    <div className="ctl">
      <div className="views" role="group" aria-label="View">
        <button type="button" aria-pressed={view === "full"} onClick={() => onView("full")}>
          FULL
        </button>
        <button type="button" aria-pressed={view === "detail"} onClick={() => onView("detail")}>
          DETAIL
        </button>
      </div>
      <span className="sep" aria-hidden="true" />
      <button type="button" className="flip" onClick={onFlip}>
        <span className="k">{faceName} · </span>FLIP ↻
      </button>
    </div>
  );
}
