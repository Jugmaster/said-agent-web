import { ImageResponse } from "next/og";

export const alt = "Atcha. Your AI comes funded.";
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
          <div>Your AI</div>
          <div>comes funded.</div>
        </div>
        <div style={{ fontSize: 32, color: "#63605A" }}>
          Trading credit on day one, sized by the chart · pay anyone you can name
          · checked on SAID before a cent moves
        </div>
      </div>
    ),
    { ...size }
  );
}
