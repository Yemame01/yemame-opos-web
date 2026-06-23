// src/app/apple-icon.tsx — Apple touch icon (180×180, teal).
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          fontWeight: 800,
          color: "white",
          background: "linear-gradient(135deg, #05696B 0%, #034041 100%)",
        }}
      >
        O
      </div>
    ),
    { ...size },
  );
}
