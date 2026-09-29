import { NextResponse, type NextRequest } from "next/server";

/**
 * The old name sends people to the new one, once we say so.
 *
 * Off until ATCHA_CANONICAL_HOST is set on the service. Then any request that
 * arrives on one of the ATCHA_REDIRECT_FROM hosts (default: the old agent
 * domain) is sent, permanently and path-preserving, to the same page on the
 * canonical host. A bookmarked token page or a deep link in an old bot
 * message lands where it should. Done here, not at DNS: both names stay on one
 * service, nothing can drift between them, and it flips back in a minute.
 *
 * Railway's own hosts and localhost are never redirected, so health checks and
 * local runs are unaffected. API routes are left alone.
 */
export default function proxy(req: NextRequest) {
  const canonical = process.env.ATCHA_CANONICAL_HOST?.trim();
  if (!canonical) return NextResponse.next();
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host || host === canonical) return NextResponse.next();
  const from = (process.env.ATCHA_REDIRECT_FROM ?? "agent.saidprotocol.com").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  if (!from.includes(host)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.host = canonical;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!api/|_next/).*)"],
};
