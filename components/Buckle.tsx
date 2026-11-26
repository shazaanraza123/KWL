import { isLightHardware, type Colorway } from "@/lib/colorways";
import { BUCKLE_POINTS } from "@/lib/belt";

type Props = {
  cw: Colorway;
  id: string;
  cx?: number;
  cy?: number;
  lit?: boolean;
};

export function Buckle({ cw, id, cx = 0, cy = 0, lit = false }: Props) {
  const L = isLightHardware(cw);
  return (
    <g transform={`translate(${cx},${cy})`}>
      <defs>
        <linearGradient id={`${id}rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={L ? 0.6 : 0.26} />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" stopOpacity={L ? 0.1 : 0.05} />
        </linearGradient>
        <linearGradient id={`${id}sh`} x1="0" y1="0" x2=".8" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={L ? 0.2 : 0.07} />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={L ? 0.2 : 0.4} />
        </linearGradient>
        <radialGradient id={`${id}lit`} cx=".46" cy=".44" r=".66">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#ECEDEF" />
          <stop offset="1" stopColor="#A8ACB2" />
        </radialGradient>
      </defs>
      <polygon
        points={BUCKLE_POINTS}
        fill="none"
        stroke={`url(#${id}rim)`}
        strokeWidth="5.4"
        strokeLinejoin="round"
      />
      <polygon points={BUCKLE_POINTS} fill={cw.hw} stroke={cw.hw} strokeWidth="4" strokeLinejoin="round" />
      <polygon
        points={BUCKLE_POINTS}
        fill={`url(#${id}sh)`}
        stroke={`url(#${id}sh)`}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polygon
        points={BUCKLE_POINTS}
        fill={`url(#${id}lit)`}
        stroke={`url(#${id}lit)`}
        strokeWidth="4"
        strokeLinejoin="round"
        style={{ opacity: lit ? 1 : 0, transition: "opacity .16s" }}
      />
    </g>
  );
}
