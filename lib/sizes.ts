export const SIZES = ["XS", "S", "M", "L"] as const;
export type Size = (typeof SIZES)[number];

export type Fit = "MALE" | "FEMALE";
export type WornAt = "HIGH" | "MID" | "LOW";
export type MeasureUnit = "IN" | "CM";

export type SizeRow = {
  size: Size;
  belt: number;
  fitsCm: [number, number];
  fitsIn: [number, number];
  menJeans: [number, number];
  womenJeans: string;
};

export const SIZE_CHART: readonly SizeRow[] = [
  { size: "XS", belt: 65, fitsCm: [58.6, 71.4], fitsIn: [23, 28], menJeans: [24, 25], womenJeans: "00–0" },
  { size: "S", belt: 75, fitsCm: [68.6, 81.4], fitsIn: [27, 32], menJeans: [26, 29], womenJeans: "0–2" },
  { size: "M", belt: 85, fitsCm: [78.6, 91.4], fitsIn: [31, 36], menJeans: [30, 33], womenJeans: "4–6" },
  { size: "L", belt: 95, fitsCm: [88.6, 101.4], fitsIn: [35, 40], menJeans: [34, 37], womenJeans: "8–10" },
] as const;

export const MEN_JEANS = Array.from({ length: 37 - 24 + 1 }, (_, i) => 24 + i);
export const WOMEN_JEANS = ["00", "0", "2", "4", "6", "8", "10"] as const;

const WORN_DELTA: Record<Fit, Record<WornAt, number>> = {
  MALE: { HIGH: -3, MID: 0, LOW: 3 },
  FEMALE: { HIGH: -3, MID: 0, LOW: 4 },
};

export function womenNumeric(size: string): number {
  if (size === "00") return -2;
  return Number(size);
}

export function estimateBeltLineCm(fit: Fit, jeans: string | number, worn: WornAt): number {
  const delta = WORN_DELTA[fit][worn];
  if (fit === "MALE") {
    const j = typeof jeans === "number" ? jeans : Number(jeans);
    return (j + 2) * 2.54 + delta;
  }
  return 70 + 2.5 * womenNumeric(String(jeans)) + delta;
}

export function beltLineFromMeasure(value: number, unit: MeasureUnit): number {
  return unit === "IN" ? value * 2.54 : value;
}

export type SizeSuggestion = {
  size: Size;
  belt: number;
  hole: number;
  note?: string;
  lineCm: number;
};

function centre(row: SizeRow): number {
  return (row.fitsCm[0] + row.fitsCm[1]) / 2;
}

function pickSize(lineCm: number): { row: SizeRow; note?: string } {
  const containing = SIZE_CHART.filter((r) => lineCm >= r.fitsCm[0] && lineCm <= r.fitsCm[1]);

  if (containing.length === 0) {
    if (lineCm < SIZE_CHART[0].fitsCm[0]) {
      return { row: SIZE_CHART[0], note: "SMALLER THAN XS. TIGHTEST HOLE MAY BE LOOSE." };
    }
    return { row: SIZE_CHART[SIZE_CHART.length - 1], note: "LARGER THAN L. WE DON'T MAKE YOUR SIZE THIS DROP." };
  }

  containing.sort((a, b) => {
    const da = Math.abs(lineCm - centre(a));
    const db = Math.abs(lineCm - centre(b));
    if (Math.abs(da - db) < 1e-9) {
      // Ties go to the larger size
      return b.belt - a.belt;
    }
    return da - db;
  });

  return { row: containing[0] };
}

export function holeForLine(lineCm: number, beltCm: number): number {
  const raw = Math.round(3.5 - (lineCm - beltCm) / 2.55);
  return Math.min(6, Math.max(1, raw));
}

export function suggestSize(lineCm: number): SizeSuggestion {
  const { row, note } = pickSize(lineCm);
  return {
    size: row.size,
    belt: row.belt,
    hole: holeForLine(lineCm, row.belt),
    note,
    lineCm,
  };
}

export function formatSuggestion(s: SizeSuggestion): string {
  return `${s.size} · ${s.belt} CM · HOLE ${s.hole} OF 6 FROM THE TIP`;
}

/** Quick label for contact / sizing help, e.g. "That's usually a M." */
export function suggestSizeLabel(fit: Fit, jeans: string | number, worn: WornAt = "MID"): string {
  const s = suggestSize(estimateBeltLineCm(fit, jeans, worn));
  return `That's usually a ${s.size}.`;
}
