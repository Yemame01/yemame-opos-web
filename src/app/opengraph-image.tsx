// src/app/opengraph-image.tsx — social share card (1200×630), OPOS teal brand.
// Embeds the real OPOS logo (fetched from /icon.png on the deployed origin).
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Yemame OPOS — Offline Point of Sale for Shops";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE = "https://opos.yemame.com";

async function loadLogo(): Promise<string | null> {
  try {
    // The 512px static logo lives in /public. Fetch + base64 for satori <img>.
    const res = await fetch(`${SITE}/icon-512.png`);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");
    return `data:image/png;base64,${b64}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const logo = await loadLogo();

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
            "radial-gradient(circle at 82% 12%, rgba(249,178,51,0.28), transparent 46%), linear-gradient(135deg, #05696B 0%, #034041 62%)",
        }}
      >
        {/* offline pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            alignSelf: "flex-start",
            padding: "10px 22px",
            borderRadius: "999px",
            backgroundColor: "rgba(255,255,255,0.12)",
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          ● Works with no internet
        </div>

        {/* wordmark with the real logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            marginTop: "44px",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "22px",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} width={72} height={72} alt="" style={{ objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 56, fontWeight: 800, color: "#05696B" }}>O</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "14px", fontSize: 46, fontWeight: 700 }}>
            <span>Yemame</span>
            <span style={{ color: "#F9B233" }}>OPOS</span>
          </div>
        </div>

        {/* headline */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.04,
            marginTop: "30px",
            maxWidth: "960px",
          }}
        >
          Sell offline. Never miss a sale.
        </div>

        {/* subline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.88)",
            marginTop: "24px",
            maxWidth: "920px",
          }}
        >
          The offline point of sale for macOS &amp; Windows — buy once, no monthly fees.
        </div>
      </div>
    ),
    { ...size },
  );
}
