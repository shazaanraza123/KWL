"use client";

import { useId } from "react";
import {
  BUCKLE,
  HOLES,
  KEEPER,
  STAR_A,
  STARS,
  STRAP,
  TIP,
  VIEWBOX,
} from "@/lib/belt";
import { isLightHardware, type BeltView, type Colorway, type Side } from "@/lib/colorways";
import { Buckle } from "./Buckle";

export type BeltProps = {
  colorway: Colorway;
  side: Side;
  view: BeltView;
  lit?: boolean;
};

export function Belt({ colorway: c, side, view, lit = false }: BeltProps) {
  const uid = useId().replace(/:/g, "");
  const face = side === "a" ? c.a : c.b;
  const L = isLightHardware(c);
  // Stars stay point-up on screen for both faces. Side B's 180° cut
  // geometry belongs in the real flip (phase 2); swapping it here made them tip down.
  const sp = STAR_A;
  const vb = view === "closed" ? VIEWBOX.closed : VIEWBOX.flat;
  const buckleId = `${uid}bb`;

  return (
    <svg
      className="belt"
      style={{ overflow: view === "closed" ? "hidden" : "visible" }}
      viewBox={vb}
      role="img"
      aria-label={`${c.name}, ${face.n} side showing, size M`}
    >
      <defs>
        <clipPath id={`${uid}strapClip`}>
          <path d={STRAP} />
        </clipPath>
        <clipPath id={`${uid}starClip`}>
          <polygon points={sp} />
        </clipPath>
        <filter
          id={`${uid}grain`}
          filterUnits="userSpaceOnUse"
          x="-31"
          y="-1"
          width="1122"
          height="37"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="1.2 1.6" numOctaves="3" seed="9" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"
            result="g"
          />
          <feComposite
            in="SourceGraphic"
            in2="g"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3={L ? 0.16 : 0.2}
            k4={L ? -0.08 : -0.1}
            result="t"
          />
          <feComposite in="t" in2="SourceGraphic" operator="in" />
        </filter>
        <linearGradient id={`${uid}round`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={L ? 0.18 : 0.11} />
          <stop offset=".14" stopColor="#fff" stopOpacity={L ? 0.04 : 0.03} />
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset=".9" stopColor="#000" stopOpacity={L ? 0.1 : 0.2} />
          <stop offset="1" stopColor="#000" stopOpacity={L ? 0.2 : 0.38} />
        </linearGradient>
        <linearGradient id={`${uid}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={L ? "#5a4630" : "#000"} stopOpacity={L ? 0.45 : 0.75} />
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}kp`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity={L ? 0.28 : 0.1} />
          <stop offset=".35" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity={L ? 0.18 : 0.38} />
        </linearGradient>
      </defs>

      <path d={STRAP} fill={face.c} filter={`url(#${uid}grain)`} />
      <g clipPath={`url(#${uid}strapClip)`}>
        <rect x="-30" y="0" width="1120" height="35" fill={`url(#${uid}round)`} />
      </g>

      {STARS.map((x) => (
        <g key={x} transform={`translate(${x},17.5)`}>
          <polygon points={sp} fill={c.star} />
          <polygon
            points={sp}
            fill="none"
            stroke={`url(#${uid}wall)`}
            strokeWidth="2.6"
            clipPath={`url(#${uid}starClip)`}
          />
          <polygon
            points={sp}
            fill="none"
            stroke="#fff"
            strokeOpacity={L ? 0.3 : 0.06}
            strokeWidth=".3"
            strokeLinejoin="round"
          />
        </g>
      ))}

      {HOLES.map((x) => (
        <g key={x}>
          <circle cx={x} cy="17.5" r="2" fill="#0D0D0D" />
          <circle
            cx={x}
            cy="17.5"
            r="2.1"
            fill="none"
            stroke="#fff"
            strokeOpacity={L ? 0.32 : 0.07}
            strokeWidth=".35"
          />
        </g>
      ))}

      <line
        x1="-2"
        y1=".9"
        x2={TIP - 19}
        y2=".9"
        stroke="#fff"
        strokeOpacity={L ? 0.28 : 0.07}
        strokeWidth=".35"
      />
      <path d={STRAP} fill="none" stroke={c.edge} strokeWidth="1" />

      <g>
        <rect x={KEEPER.x} y={KEEPER.y} width={KEEPER.w} height={KEEPER.h} rx={KEEPER.rx} fill={c.hw} />
        <rect
          x={KEEPER.x}
          y={KEEPER.y}
          width={KEEPER.w}
          height={KEEPER.h}
          rx={KEEPER.rx}
          fill={`url(#${uid}kp)`}
        />
        <rect
          x={KEEPER.x}
          y={KEEPER.y}
          width={KEEPER.w}
          height={KEEPER.h}
          rx={KEEPER.rx}
          fill="none"
          stroke="#fff"
          strokeOpacity={L ? 0.35 : 0.09}
          strokeWidth=".3"
        />
      </g>

      <Buckle cw={c} id={buckleId} cx={BUCKLE.cx} cy={BUCKLE.cy} lit={lit} />
    </svg>
  );
}
