"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MEN_JEANS,
  SIZE_CHART,
  WOMEN_JEANS,
  beltLineFromJeans,
  recommend,
  type Fit,
  type Size,
  type WornAt,
} from "@/lib/sizes";

type Props = { onClose: () => void; onPick: (size: Size) => void };

export function SizeGuide({ onClose, onPick }: Props) {
  const [fit, setFit] = useState<Fit>("male");
  const [jeans, setJeans] = useState("30");
  const [worn, setWorn] = useState<WornAt>("mid");
  const [measure, setMeasure] = useState("");
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const list = fit === "male" ? MEN_JEANS : WOMEN_JEANS;

  const rec = useMemo(() => {
    const m = parseFloat(measure.replace(",", "."));
    const line = isFinite(m) && m > 0 ? (unit === "in" ? m * 2.54 : m) : beltLineFromJeans(fit, jeans, worn);
    return recommend(line);
  }, [fit, jeans, worn, measure, unit]);

  useEffect(() => onPick(rec.row.size), [rec, onPick]);

  return (
    <div className="guide" id="size-guide" ref={panel} tabIndex={-1} aria-label="Size guide">
      <div className="gHead">
        <span>SIZE GUIDE</span>
        <button type="button" onClick={onClose}>
          CLOSE
        </button>
      </div>

      <div className="gRow">
        <span className="k">FIT</span>
        <div className="opts" role="group" aria-label="Fit">
          {(["male", "female"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={fit === f}
              onClick={() => {
                setFit(f);
                setJeans(f === "male" ? "30" : "4");
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="gRow top">
        <span className="k">JEANS</span>
        <div className="grid" role="group" aria-label="Jeans size">
          {list.map((j) => (
            <button key={j} type="button" aria-pressed={jeans === j && !measure} onClick={() => { setJeans(j); setMeasure(""); }}>
              {j}
            </button>
          ))}
        </div>
      </div>

      <div className="gRow">
        <span className="k">WORN AT</span>
        <div className="opts" role="group" aria-label="Where you wear it">
          {(["high", "mid", "low"] as const).map((w) => (
            <button key={w} type="button" aria-pressed={worn === w} onClick={() => setWorn(w)}>
              {w.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="gRow">
        <span className="k">OR MEASURE</span>
        <div className="opts">
          <label className="meas">
            <span className="sr-only">Belt line measurement</span>
            <input id="belt-line" inputMode="decimal" placeholder="BELT LINE" value={measure} onChange={(e) => setMeasure(e.target.value)} />
          </label>
          {(["in", "cm"] as const).map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="rec" aria-live="polite">
        <span>
          <b>{rec.row.size}</b> · {rec.row.belt} CM · HOLE {rec.hole} OF 6 FROM THE TIP
        </span>
        {rec.note && <span className="note">{rec.note}</span>}
      </div>

      <div className="tblWrap">
        <table>
          <thead>
            <tr>
              <th>SIZE</th>
              <th>BELT</th>
              <th>FITS CM</th>
              <th>FITS IN</th>
              <th>MEN</th>
              <th>WOMEN</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map((r) => (
              <tr key={r.size} className={r.size === rec.row.size ? "on" : ""}>
                <td>{r.size}</td>
                <td>{r.belt}</td>
                <td>{r.fitCm[0]}–{r.fitCm[1]}</td>
                <td>{r.fitIn[0]}–{r.fitIn[1]}</td>
                <td>{r.men}</td>
                <td>{r.women}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="gNote">BELT SIZE = BUCKLE TO THE MIDDLE OF THE 6 HOLES. HOLES 2.55 CM APART. BETWEEN SIZES, SIZE UP.</p>
      <p className="gNote">MEASURE: TAPE AROUND WHERE YOUR BELT SITS, OVER YOUR JEANS.</p>
    </div>
  );
}
