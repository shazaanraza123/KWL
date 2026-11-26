"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  MEN_JEANS,
  SIZE_CHART,
  WOMEN_JEANS,
  beltLineFromMeasure,
  estimateBeltLineCm,
  formatSuggestion,
  suggestSize,
  type Fit,
  type MeasureUnit,
  type WornAt,
} from "@/lib/sizes";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SizeGuide({ open, onClose }: Props) {
  const titleId = useId();
  const [fit, setFit] = useState<Fit>("MALE");
  const [jeans, setJeans] = useState<string>("30");
  const [worn, setWorn] = useState<WornAt>("MID");
  const [measure, setMeasure] = useState("");
  const [unit, setUnit] = useState<MeasureUnit>("IN");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function chooseFit(next: Fit) {
    setFit(next);
    setJeans(next === "MALE" ? "30" : "4");
    setMeasure("");
  }

  const suggestion = useMemo(() => {
    const trimmed = measure.trim();
    if (trimmed) {
      const n = Number(trimmed);
      if (!Number.isFinite(n) || n <= 0) return null;
      return suggestSize(beltLineFromMeasure(n, unit));
    }
    return suggestSize(estimateBeltLineCm(fit, jeans, worn));
  }, [fit, jeans, worn, measure, unit]);

  if (!open) return null;

  const jeanOptions = fit === "MALE" ? MEN_JEANS.map(String) : [...WOMEN_JEANS];

  return (
    <div className="sizeguide" role="region" aria-labelledby={titleId}>
      <div className="sizeguide-bar">
        <span id={titleId}>SIZE GUIDE</span>
        <button type="button" className="sizeguide-close" onClick={onClose}>
          CLOSE
        </button>
      </div>

      <div className="sizeguide-finder">
        <div className="sizeguide-row" role="group" aria-label="Fit">
          <span className="sizeguide-k">FIT</span>
          {(["MALE", "FEMALE"] as Fit[]).map((f) => (
            <button key={f} type="button" aria-pressed={fit === f} onClick={() => chooseFit(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="sizeguide-row sizeguide-jeans" role="group" aria-label="Jeans size">
          <span className="sizeguide-k">JEANS</span>
          <div className="sizeguide-grid">
            {jeanOptions.map((j) => (
              <button
                key={j}
                type="button"
                aria-pressed={jeans === j}
                onClick={() => {
                  setJeans(j);
                  setMeasure("");
                }}
              >
                {j}
              </button>
            ))}
          </div>
        </div>

        <div className="sizeguide-row" role="group" aria-label="Worn at">
          <span className="sizeguide-k">WORN AT</span>
          {(["HIGH", "MID", "LOW"] as WornAt[]).map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={worn === w}
              onClick={() => {
                setWorn(w);
                setMeasure("");
              }}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="sizeguide-measure">
          <span className="sizeguide-k">MEASURE INSTEAD</span>
          <label className="sizeguide-field">
            <span className="sr-only">Belt line measurement</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              placeholder="BELT LINE"
              value={measure}
              onChange={(e) => setMeasure(e.target.value)}
            />
          </label>
          <div className="sizeguide-row" role="group" aria-label="Unit">
            {(["IN", "CM"] as MeasureUnit[]).map((u) => (
              <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
                {u}
              </button>
            ))}
          </div>
        </div>

        {suggestion ? (
          <div className="sizeguide-result" aria-live="polite">
            <div>{formatSuggestion(suggestion)}</div>
            {suggestion.note ? <div className="sizeguide-note">{suggestion.note}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="sizeguide-chart-wrap">
        <table className="sizeguide-chart">
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
            {SIZE_CHART.map((r) => (
              <tr key={r.size} data-active={suggestion?.size === r.size ? "true" : undefined}>
                <td>{r.size}</td>
                <td>{r.belt}</td>
                <td>
                  {r.fitsCm[0]}–{r.fitsCm[1]}
                </td>
                <td>
                  {r.fitsIn[0]}–{r.fitsIn[1]}
                </td>
                <td>
                  {r.menJeans[0]}–{r.menJeans[1]}
                </td>
                <td>{r.womenJeans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="sizeguide-notes">
        BELT SIZE = BUCKLE TO THE MIDDLE OF THE 6 HOLES. HOLES 2.55 CM APART. BETWEEN SIZES, SIZE UP.
      </p>
      <p className="sizeguide-notes">MEASURE: TAPE AROUND WHERE YOUR BELT SITS, OVER YOUR JEANS.</p>
    </div>
  );
}
