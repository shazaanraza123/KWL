"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  MEN_JEANS,
  SIZE_CHART,
  WOMEN_JEANS,
  estimateBeltLineCm,
  formatRecommendation,
  measureToCm,
  noteFor,
  recommendFromJeans,
  recommendFromLineCm,
  type Fit,
  type MeasureUnit,
  type WearHeight,
} from "@/lib/sizes";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "grid" | "measure";

export function SizeGuide({ open, onClose }: Props) {
  const panelId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [fit, setFit] = useState<Fit>("MALE");
  const [jeans, setJeans] = useState("30");
  const [worn, setWorn] = useState<WearHeight>("MID");
  const [mode, setMode] = useState<Mode>("grid");
  const [unit, setUnit] = useState<MeasureUnit>("IN");
  const [measure, setMeasure] = useState("");

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    setJeans(fit === "MALE" ? "30" : "4");
  }, [fit]);

  if (!open) return null;

  const measured = Number(measure);
  const useMeasure = mode === "measure" && Number.isFinite(measured) && measured > 0;
  const rec = useMeasure
    ? recommendFromLineCm(measureToCm(measured, unit))
    : recommendFromJeans(fit, jeans, worn);
  const note = noteFor(rec);
  const linePreview = useMeasure
    ? measureToCm(measured, unit)
    : estimateBeltLineCm(fit, jeans, worn);

  const jeansOptions = fit === "MALE" ? MEN_JEANS : [...WOMEN_JEANS];

  return (
    <div className="sizeguide" id={panelId} role="region" aria-label="Size guide">
      <div className="sizeguide-head">
        <span>SIZE GUIDE</span>
        <button type="button" ref={closeRef} className="sizeguide-close" onClick={onClose}>
          CLOSE
        </button>
      </div>

      <div className="finder" aria-label="Size finder">
        <div className="finder-row" role="group" aria-label="Fit">
          <span className="finder-label">FIT</span>
          {(["MALE", "FEMALE"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={fit === f}
              onClick={() => {
                setFit(f);
                setMode("grid");
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="finder-row" role="group" aria-label="Jeans size">
          <span className="finder-label">JEANS</span>
          <div className="jeans-grid">
            {jeansOptions.map((j) => (
              <button
                key={j}
                type="button"
                aria-pressed={jeans === j && mode === "grid"}
                onClick={() => {
                  setJeans(j);
                  setMode("grid");
                }}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        <div className="finder-row" role="group" aria-label="Worn at">
          <span className="finder-label">WORN AT</span>
          {(["HIGH", "MID", "LOW"] as const).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={worn === w}
              onClick={() => {
                setWorn(w);
                setMode("grid");
              }}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="finder-row measure-row">
          <span className="finder-label">MEASURE</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="BELT LINE"
            aria-label="Belt line measurement"
            value={measure}
            onChange={(e) => {
              setMeasure(e.target.value);
              setMode("measure");
            }}
          />
          <div className="unit" role="group" aria-label="Unit">
            {(["IN", "CM"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => {
                  setUnit(u);
                  if (measure) setMode("measure");
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <p className="finder-out" aria-live="polite">
          {formatRecommendation(rec)}
          <span className="finder-line"> · {linePreview.toFixed(1)} CM LINE</span>
        </p>
        {note ? <p className="finder-note">{note}</p> : null}
      </div>

      <div className="chart-wrap">
        <table className="chart">
          <caption className="sr-only">Size chart</caption>
          <thead>
            <tr>
              <th scope="col">SIZE</th>
              <th scope="col">BELT</th>
              <th scope="col">FITS (CM)</th>
              <th scope="col">FITS (IN)</th>
              <th scope="col">MEN&apos;S JEANS</th>
              <th scope="col">WOMEN&apos;S JEANS</th>
            </tr>
          </thead>
          <tbody>
            {SIZE_CHART.map((row) => (
              <tr key={row.size} className={row.size === rec.size ? "is-rec" : undefined}>
                <th scope="row">{row.size}</th>
                <td>{row.belt}</td>
                <td>
                  {row.fitsCm[0]}–{row.fitsCm[1]}
                </td>
                <td>
                  {row.fitsIn[0]}–{row.fitsIn[1]}
                </td>
                <td>
                  {row.menJeans[0]}–{row.menJeans[1]}
                </td>
                <td>{row.womenJeans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="chart-notes">
        BELT SIZE = BUCKLE TO THE MIDDLE OF THE 6 HOLES. HOLES 2.55 CM APART. BETWEEN SIZES, SIZE UP.
      </p>
      <p className="chart-notes">
        MEASURE: TAPE AROUND WHERE YOUR BELT SITS, OVER YOUR JEANS.
      </p>
    </div>
  );
}
