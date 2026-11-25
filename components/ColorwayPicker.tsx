"use client";

import { COLORWAYS } from "@/lib/colorways";

type Props = {
  index: number;
  onChange: (index: number) => void;
};

export function ColorwayPicker({ index, onChange }: Props) {
  return (
    <div className="row cws" role="group" aria-label="Colorway">
      {COLORWAYS.map((c, i) => (
        <button
          key={c.id}
          type="button"
          aria-pressed={i === index}
          onClick={() => onChange(i)}
        >
          {c.id} {c.name}
        </button>
      ))}
    </div>
  );
}
