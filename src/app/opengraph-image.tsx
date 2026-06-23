// src/app/opengraph-image.tsx — social share card (1200×630), OPOS teal brand.
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Yemame OPOS — Offline Point of Sale for Shops";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          color: "white",
          backgroundColor: "#034041",
          backgroundImage:
            "radial-gradient(circle at 80% 10%, rgba(249,178,51,0.25), transparent 45%), linear-gradient(135deg, #05696B 0%, #034041 60%)",
        }}
      >
        {/* offline pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            alignSelf: "flex-start",
            padding: "10px 20px",
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.12)",
            fontSize: 26,
          }}
        >
          ● No internet required
        </div>

        {/* wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginTop: "44px",
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "20px",
              backgroundColor: "rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            O
          </div>
          <div style={{ display: "flex", gap: "12px", fontSize: 44, fontWeight: 700 }}>
            <span>Yemame</span>
            <span style={{ color: "#F9B233" }}>OPOS</span>
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            fontSize: 86,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: "28px",
            maxWidth: "950px",
          }}
        >
          Sell offline. Never miss a sale.
        </div>

        {/* subline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.85)",
            marginTop: "24px",
            maxWidth: "900px",
          }}
        >
          A full desktop point of sale for macOS &amp; Windows — no monthly fees.
        </div>
      </div>
    ),
    { ...size },
  );
}
