export const SIZES = ["XS", "S", "M", "L"] as const;
export type Size = (typeof SIZES)[number];

export type Fit = "MALE" | "FEMALE";
export type WearHeight = "HIGH" | "MID" | "LOW";
export type MeasureUnit = "IN" | "CM";

export type SizeChartRow = {
  size: Size;
  belt: number;
  fitsCm: [number, number];
  fitsIn: [number, number];
  menJeans: [number, number];
  womenJeans: string;
};

/** Exact size chart from the tech pack. */
export const SIZE_CHART: readonly SizeChartRow[] = [
  {
    size: "XS",
    belt: 65,
    fitsCm: [58.6, 71.4],
    fitsIn: [23, 28],
    menJeans: [24, 25],
    womenJeans: "00–0",
  },
  {
    size: "S",
    belt: 75,
    fitsCm: [68.6, 81.4],
    fitsIn: [27, 32],
    menJeans: [26, 29],
    womenJeans: "0–2",
  },
  {
    size: "M",
    belt: 85,
    fitsCm: [78.6, 91.4],
    fitsIn: [31, 36],
    menJeans: [30, 33],
    womenJeans: "4–6",
  },
  {
    size: "L",
    belt: 95,
    fitsCm: [88.6, 101.4],
    fitsIn: [35, 40],
    menJeans: [34, 37],
    womenJeans: "8–10",
  },
] as const;

export const MEN_JEANS = Array.from({ length: 37 - 24 + 1 }, (_, i) => String(24 + i));
export const WOMEN_JEANS = ["00", "0", "2", "4", "6", "8", "10"] as const;

const WEAR_OFFSET: Record<Fit, Record<WearHeight, number>> = {
  MALE: { HIGH: -3, MID: 0, LOW: 3 },
  FEMALE: { HIGH: -3, MID: 0, LOW: 4 },
};

export function womenNumericSize(label: string): number {
  if (label === "00") return -2;
  return Number(label);
}

/** Belt-line estimate in cm from jeans size + wear height. */
export function estimateBeltLineCm(fit: Fit, jeans: string, worn: WearHeight): number {
  const offset = WEAR_OFFSET[fit][worn];
  if (fit === "MALE") {
    return (Number(jeans) + 2) * 2.54 + offset;
  }
  return 70 + 2.5 * womenNumericSize(jeans) + offset;
}

export function measureToCm(value: number, unit: MeasureUnit): number {
  return unit === "IN" ? value * 2.54 : value;
}

export type SizeRecommendation = {
  size: Size;
  belt: number;
  hole: number;
  note: "ok" | "below_xs" | "above_l";
  lineCm: number;
};

function holeFor(lineCm: number, beltCm: number): number {
  return Math.min(6, Math.max(1, Math.round(3.5 - (lineCm - beltCm) / 2.55)));
}

/**
 * Pick the size whose fit range contains the belt line, preferring the one
 * whose centre is closest. Ties go to the larger size.
 */
export function recommendFromLineCm(lineCm: number): SizeRecommendation {
  const containing = SIZE_CHART.filter(
    (row) => lineCm >= row.fitsCm[0] && lineCm <= row.fitsCm[1],
  );

  if (containing.length === 0) {
    if (lineCm < SIZE_CHART[0].fitsCm[0]) {
      return {
        size: "XS",
        belt: 65,
        hole: holeFor(lineCm, 65),
        note: "below_xs",
        lineCm,
      };
    }
    return {
      size: "L",
      belt: 95,
      hole: holeFor(lineCm, 95),
      note: "above_l",
      lineCm,
    };
  }

  containing.sort((a, b) => {
    const da = Math.abs(lineCm - a.belt);
    const db = Math.abs(lineCm - b.belt);
    if (da !== db) return da - db;
    return SIZES.indexOf(b.size) - SIZES.indexOf(a.size);
  });

  const pick = containing[0];
  return {
    size: pick.size,
    belt: pick.belt,
    hole: holeFor(lineCm, pick.belt),
    note: "ok",
    lineCm,
  };
}

export function recommendFromJeans(
  fit: Fit,
  jeans: string,
  worn: WearHeight,
): SizeRecommendation {
  return recommendFromLineCm(estimateBeltLineCm(fit, jeans, worn));
}

export function formatRecommendation(rec: SizeRecommendation): string {
  return `${rec.size} · ${rec.belt} CM · HOLE ${rec.hole} OF 6 FROM THE TIP`;
}

export function noteFor(rec: SizeRecommendation): string | null {
  if (rec.note === "below_xs") return "SMALLER THAN XS. TIGHTEST HOLE MAY BE LOOSE.";
  if (rec.note === "above_l") return "LARGER THAN L. WE DON'T MAKE YOUR SIZE THIS DROP.";
  return null;
}
