export type SideFace = { n: string; c: string };

export type Colorway = {
  id: string;
  name: string;
  a: SideFace;
  b: SideFace;
  star: string;
  hw: string;
  edge: string;
  flash: boolean;
  light: boolean;
};

export const COLORWAYS = [
  {
    id: "01",
    name: "BLACK / OLIVE",
    a: { n: "BLACK", c: "#232323" },
    b: { n: "OLIVE", c: "#777963" },
    star: "#0F0F0F",
    hw: "#191919",
    edge: "#121212",
    flash: true,
    light: false,
  },
  {
    id: "02",
    name: "BLACK / BROWN",
    a: { n: "BLACK", c: "#232323" },
    b: { n: "BROWN", c: "#49372B" },
    star: "#0F0F0F",
    hw: "#191919",
    edge: "#121212",
    flash: true,
    light: false,
  },
  {
    id: "03",
    name: "BONE / TAUPE",
    a: { n: "BONE", c: "#D8D0C1" },
    b: { n: "TAUPE", c: "#A58F79" },
    star: "#C9B79C",
    hw: "#C8B79F",
    edge: "#B9AA91",
    flash: false,
    light: true,
  },
] as const satisfies readonly Colorway[];

export type ColorwayId = (typeof COLORWAYS)[number]["id"];
export type Side = "a" | "b";
export type BeltView = "full" | "detail";

export const SIZES = ["XS", "S", "M", "L"] as const;
export type Size = (typeof SIZES)[number];
