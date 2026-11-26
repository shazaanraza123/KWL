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

/** Sand / light hardware needs softer SVG overlays until the 3D belt lands. */
export function isLightHardware(cw: Colorway): boolean {
  return !cw.flash;
}
