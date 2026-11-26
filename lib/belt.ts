/** Size M geometry from the tech pack. Units are mm / SVG user units. */

export const W = 35;

export const HOLES = [0, 1, 2, 3, 4, 5].map((i) => 850 + (i - 2.5) * 25.5);

export const HOLE_R = 2;

export const TIP = HOLES[5] + 160;

export const STARS: number[] = [];
for (let x = 114; x <= HOLES[0] - 32 - 12.75; x += 65) STARS.push(x);

export const STRAP = `M-2,0 H${TIP - 17.5} A17.5,17.5 0 0 1 ${TIP - 17.5},35 H-2 Z`;

export const KEEPER = { x: 60.5, y: -2.7, w: 9, h: 40.4, rx: 1.4 };

export const BUCKLE = { cx: 8, cy: 17.5, w: 74, stroke: 4 };

export const VIEWBOX = {
  closed: "-44 -26 400 88",
  flat: "-44 -26 1130 88",
} as const;

export function starPoints(w: number, rotated = false): string {
  const D = Math.PI / 180;
  const R = w / (2 * Math.cos(18 * D));
  const r = R * 0.382;
  const p: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36 + (rotated ? 180 : 0)) * D;
    const rr = i % 2 ? r : R;
    p.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  const ys = p.map((q) => q[1]);
  const off = -(Math.min(...ys) + Math.max(...ys)) / 2;
  return p.map((q) => `${q[0].toFixed(2)},${(q[1] + off).toFixed(2)}`).join(" ");
}

export const BUCKLE_POINTS = starPoints(BUCKLE.w, false);
export const STAR_A = starPoints(25.5, false);
export const STAR_B = starPoints(25.5, true);
