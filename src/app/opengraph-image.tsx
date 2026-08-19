import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "पहाड़ी अड्डा — Pahadi Adda, a live Uttarakhandi listening room";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const devanagari = await readFile(
    path.join(process.cwd(), "src/assets/fonts/noto-serif-devanagari-600.ttf"),
  );

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
          position: "relative",
          background: "linear-gradient(180deg, #0e1530 0%, #3a2038 48%, #6b3327 100%)",
        }}
      >
        {/* stars */}
        {[
          [90, 70], [220, 130], [1020, 90], [1100, 180], [160, 220], [980, 260],
        ].map(([x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#f5ecdb",
              opacity: 0.8,
            }}
          />
        ))}

        {/* distant mountains */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: -80,
            width: 700,
            height: 240,
            background: "#1c2a4a",
            clipPath: "polygon(0% 100%, 20% 30%, 45% 70%, 65% 15%, 90% 60%, 100% 30%, 100% 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: -80,
            width: 700,
            height: 240,
            background: "#1c2a4a",
            clipPath: "polygon(0% 100%, 15% 40%, 40% 75%, 60% 20%, 85% 65%, 100% 25%, 100% 100%)",
          }}
        />
        {/* nearer dark ridge */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 150,
            background: "#0f1a12",
            clipPath:
              "polygon(0% 100%, 0% 55%, 12% 30%, 25% 60%, 38% 25%, 50% 50%, 62% 20%, 75% 55%, 88% 30%, 100% 60%, 100% 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 108,
            fontFamily: "Noto Serif Devanagari",
            fontWeight: 600,
            color: "#fbeedb",
            marginTop: 8,
            textShadow: "0 6px 24px rgba(0,0,0,0.5)",
          }}
        >
          पहाड़ी अड्डा
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#eda93a",
            marginTop: 14,
            textTransform: "uppercase",
          }}
        >
          PAHADI ADDA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#cdbca1",
            marginTop: 10,
          }}
        >
          एक साथ पहाड़ी गीत सुनने का लाइव अड्डा
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Serif Devanagari", data: devanagari, weight: 600, style: "normal" }],
    },
  );
}
