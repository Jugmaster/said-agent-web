import { ImageResponse } from "next/og";
import { getInvite } from "@/lib/api";

// Every shared invite link is a growth event: it gets posted in group chats,
// DMs, and on X. Without an image the preview is a bare text row. This renders
// the actual amount and sender into the card, so the link itself does the
// selling. Failure is non-fatal: we fall back to a generic card rather than
// letting a fetch error produce no preview at all.

export const alt = "You've been sent crypto on SAID";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function InviteOpengraphImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let headline = "You've been sent crypto";
  let amountLine: string | null = null;
  try {
    const invite = await getInvite(token, { cache: "no-store" });
    if (invite) {
      const sender = invite.sender.displayName ?? "Someone";
      headline = `${sender} sent you`;
      amountLine = `${invite.amount} ${invite.asset}`;
    }
  } catch {
    /* generic card */
  }

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
            marginBottom: 34,
          }}
        >
          SAID AGENT · ON SOLANA
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 34,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 600, color: "#d4d4d8" }}>
            {headline}
          </div>
          {amountLine && (
            <div style={{ fontSize: 116, fontWeight: 800, lineHeight: 1.1 }}>
              {amountLine}
            </div>
          )}
        </div>
        <div style={{ fontSize: 32, color: "#d4d4d8" }}>
          It&apos;s already waiting. Log in with the account it was sent to.
        </div>
      </div>
    ),
    { ...size },
  );
}
