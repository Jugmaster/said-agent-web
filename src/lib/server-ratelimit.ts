/**
 * Tiny in-memory rate limiter for server API routes (single-instance deploy).
 *
 * IP extraction: prefer the platform-set x-real-ip; otherwise take the LAST
 * x-forwarded-for entry — proxies append the true client IP, so the last hop
 * is platform-controlled while the first can be attacker-supplied.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return "unknown";
}

export function rateLimited(
  key: string,
  limit: number,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    if (buckets.size > 10_000) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  return ++entry.count > limit;
}
