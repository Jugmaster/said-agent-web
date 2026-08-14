import { ImageResponse } from "next/og";

export const alt = "SAID Agent — your AI agent on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#09090b",
          padding: 84,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: "#a1a1aa",
            letterSpacing: 4,
            marginBottom: 30,
          }}
        >
          SAID AGENT · ON SOLANA
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.08,
            marginBottom: 30,
          }}
        >
          <div>Your money</div>
          <div>got an agent.</div>
        </div>
        <div style={{ fontSize: 32, color: "#d4d4d8" }}>
          Send by @handle · trade · price alerts that reach you · lower fees the
          better its reputation
        </div>
      </div>
    ),
    { ...size }
  );
}
