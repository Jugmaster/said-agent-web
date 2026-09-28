import { ImageResponse } from "next/og";
import { getLaunch } from "@/lib/launch";

// Rendered per request so the pre-launch card is not baked in at build time.
export const dynamic = "force-dynamic";
export const alt = "Atcha";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const { launched } = getLaunch();
  const lines = launched ? ["Your AI", "comes funded."] : ["Your AI", "on Solana."];
  const sub = launched
    ? "Funded every month, sized by its level · pay anyone you can name · checked on SAID before a cent moves"
    : "Trades anything · pays anyone you can name · checked on SAID before a cent moves";
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#F6F4EE",
          padding: 84,
          color: "#171613",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: "#B93A16",
            letterSpacing: 4,
            marginBottom: 30,
          }}
        >
          ATCHA · BY SAID
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
          <div>{lines[0]}</div>
          <div>{lines[1]}</div>
        </div>
        <div style={{ fontSize: 32, color: "#63605A" }}>{sub}</div>
      </div>
    ),
    { ...size }
  );
}
