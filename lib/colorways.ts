export type SideFace = { n: string; c: string };

export type Colorway = {
  id: string;
  name: string;
  a: SideFace;
  b: SideFace;
  star: string;
  hw: string;
  hwName: string;
  edge: string;
  flash: boolean;
};

export const COLORWAYS = [
  {
    id: "01",
    name: "BLACK / RED",
    a: { n: "BLACK", c: "#1C1C1C" },
    b: { n: "RED", c: "#A3141C" },
    star: "#0E0E0E",
    hw: "#191919",
    hwName: "MATTE BLACK",
    edge: "#111111",
    flash: true,
  },
  {
    id: "02",
    name: "TAUPE / LIGHT BROWN",
    a: { n: "TAUPE", c: "#A9917C" },
    b: { n: "LIGHT BROWN", c: "#DCCFBD" },
    star: "#C9B79C",
    hw: "#C8B79F",
    hwName: "MATTE SAND",
    edge: "#BCAE96",
    flash: false,
  },
  {
    id: "03",
    name: "OLIVE / BROWN",
    a: { n: "OLIVE", c: "#777963" },
    b: { n: "BROWN", c: "#49372B" },
    star: "#0E0E0E",
    hw: "#191919",
    hwName: "MATTE BLACK",
    edge: "#111111",
    flash: true,
  },
] as const satisfies readonly Colorway[];

export type ColorwayId = (typeof COLORWAYS)[number]["id"];
export type Side = "a" | "b";
export type BeltView = "closed" | "flat";

/** Relative luminance of a hex color; used for SVG shading until the 3D rebuild. */
export function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.35;
}
