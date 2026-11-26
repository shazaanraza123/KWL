/** Size system for Star Belt 001. Shared by the size guide and the contact form. */

export const SIZES = ["XS", "S", "M", "L"] as const;
export type Size = (typeof SIZES)[number];

export type SizeRow = {
  size: Size;
  belt: number; // cm, buckle to the middle of the 6 holes
  fitCm: [number, number];
  fitIn: [number, number];
  men: string;
  women: string;
};

export const HOLE_PITCH_CM = 2.55;
export const HOLE_COUNT = 6;

export const SIZE_CHART: readonly SizeRow[] = [
  { size: "XS", belt: 65, fitCm: [58.6, 71.4], fitIn: [23, 28], men: "24–25", women: "00–0" },
  { size: "S", belt: 75, fitCm: [68.6, 81.4], fitIn: [27, 32], men: "26–29", women: "0–2" },
  { size: "M", belt: 85, fitCm: [78.6, 91.4], fitIn: [31, 36], men: "30–33", women: "4–6" },
  { size: "L", belt: 95, fitCm: [88.6, 101.4], fitIn: [35, 40], men: "34–37", women: "8–10" },
];

export const MEN_JEANS = Array.from({ length: 14 }, (_, i) => String(24 + i)); // 24–37
export const WOMEN_JEANS = ["00", "0", "2", "4", "6", "8", "10"];

export type Fit = "male" | "female";
export type WornAt = "high" | "mid" | "low";

/** Estimated belt line (cm) from a jeans size. */
export function beltLineFromJeans(fit: Fit, jeans: string, worn: WornAt): number {
  if (fit === "male") {
    return (Number(jeans) + 2) * 2.54 + { high: -3, mid: 0, low: 3 }[worn];
  }
  const w = jeans === "00" ? -2 : Number(jeans);
  return 70 + 2.5 * w + { high: -3, mid: 0, low: 4 }[worn];
}

export type Recommendation = {
  row: SizeRow;
  /** Counted from the tip, 1 = loosest. */
  hole: number;
  note?: string;
};

/** Size whose range holds the belt line, closest centre wins, ties go up. */
export function recommend(lineCm: number): Recommendation {
  const inRange = SIZE_CHART.filter((r) => lineCm >= r.fitCm[0] && lineCm <= r.fitCm[1]);
  let row: SizeRow;
  let note: string | undefined;
  if (inRange.length) {
    row = inRange.reduce((best, r) => {
      const d = Math.abs(lineCm - r.belt);
      const bd = Math.abs(lineCm - best.belt);
      return d < bd - 1e-9 || (Math.abs(d - bd) <= 1e-9 && r.belt > best.belt) ? r : best;
    });
  } else if (lineCm < SIZE_CHART[0].fitCm[0]) {
    row = SIZE_CHART[0];
    note = "SMALLER THAN XS. TIGHTEST HOLE MAY BE LOOSE.";
  } else {
    row = SIZE_CHART[SIZE_CHART.length - 1];
    note = "LARGER THAN L. WE DON'T MAKE YOUR SIZE THIS DROP.";
  }
  const hole = Math.max(1, Math.min(HOLE_COUNT, Math.round(3.5 - (lineCm - row.belt) / HOLE_PITCH_CM)));
  return { row, hole, note };
}

/** Quick size from a jeans size label like "M 32" or "W 4" (contact form). */
export function sizeFromJeans(label: string): Size | null {
  const m = /^([MW]) (\S+)$/.exec(label);
  if (!m) return null;
  const line = beltLineFromJeans(m[1] === "M" ? "male" : "female", m[2], "mid");
  return recommend(line).row.size;
}
