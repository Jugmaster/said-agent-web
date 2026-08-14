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
  let recipient: string | null = null;
  try {
    const invite = await getInvite(token, { cache: "no-store" });
    if (invite) {
      const sender = invite.sender.displayName ?? "Someone";
      headline = `${sender} sent you`;
      amountLine = `${invite.amount} ${invite.asset}`;
      recipient = invite.recipient?.handle ? `@${invite.recipient.handle}` : null;
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
          justifyContent: "space-between",
          background: "#09090b",
          padding: 72,
          color: "#fff",
          fontFamily: "sans-serif",
          // Faint radial glow behind the amount so the card reads as an object
          // rather than a text file when it lands in a feed.
          backgroundImage:
            "radial-gradient(900px 420px at 12% 42%, rgba(16,185,129,0.16), rgba(9,9,11,0) 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "#fff",
              color: "#09090b",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 24, color: "#a1a1aa", letterSpacing: 3 }}>
            SAID AGENT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, fontWeight: 600, color: "#d4d4d8" }}>
            {headline}
          </div>
          {amountLine && (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 18,
                marginTop: 4,
              }}
            >
              <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1.05, color: "#fff" }}>
                {amountLine}
              </div>
              {recipient && (
                <div style={{ fontSize: 32, color: "#71717a" }}>to {recipient}</div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#10b981",
              color: "#052e1f",
              fontSize: 28,
              fontWeight: 700,
              padding: "14px 28px",
              borderRadius: 999,
            }}
          >
            Claim it
          </div>
          <div style={{ fontSize: 26, color: "#a1a1aa" }}>
            It&apos;s already waiting. Log in with the account it was sent to.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
