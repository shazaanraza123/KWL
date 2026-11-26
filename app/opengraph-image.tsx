import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const BUCKLE_POINTS = Array.from({ length: 10 }, (_, i) => {
  const R = 74 / (2 * Math.cos(Math.PI / 10));
  const r = (i % 2 ? 0.382 : 1) * R;
  const a = ((-90 + i * 36) * Math.PI) / 180;
  return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a) + 3.6).toFixed(2)}`;
}).join(" ");

export const runtime = "nodejs";
export const alt = "KWL STUDIO";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const wordmark = await readFile(join(process.cwd(), "public/kwl-wordmark.svg"), "utf8");
  const wordmarkData = `data:image/svg+xml;base64,${Buffer.from(
    wordmark.replace("<svg ", '<svg fill="#E8E5DF" '),
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0D0D",
          gap: 64,
        }}
      >
        <img src={wordmarkData} width={280} height={49} alt="" />
        <svg width="220" height="220" viewBox="-44 -44 88 88">
          <polygon points={BUCKLE_POINTS} fill="#191919" stroke="#191919" strokeWidth="4" strokeLinejoin="round" />
          <polygon
            points={BUCKLE_POINTS}
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="5.4"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
