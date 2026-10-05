/**
 * Token icons as the browser can actually load them. ipfs.io refuses or
 * stalls (403s at the time of writing), so any IPFS reference is served from
 * a gateway that answers, resized through a cached image proxy. Other hosts
 * pass through untouched.
 */
const IPFS_GATEWAY = "https://ipfs.filebase.io/ipfs/";
export function iconUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  const m = u.match(/^(?:ipfs:\/\/|https?:\/\/(?:[a-z0-9-]+\.)?(?:ipfs\.io|gateway\.pinata\.cloud|cloudflare-ipfs\.com|cf-ipfs\.com|nftstorage\.link|dweb\.link|w3s\.link)\/ipfs\/)([^?#]+)/i);
  if (!m) return u;
  return `https://wsrv.nl/?url=${encodeURIComponent(IPFS_GATEWAY + m[1])}&w=96&h=96&fit=cover&output=webp`;
}

/** Resize and re-serve any image through the cached proxy: small, webp, and from a host that answers. */
function proxied(u: string): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(u)}&w=96&h=96&fit=cover&output=webp`;
}

/**
 * ClawPump's token images. Many come back as a path on their own site
 * ("/api/token-image/<cid>"), which is a 404 on ours, and the files behind
 * them run to megabytes. Those are made absolute and served through the
 * proxy at icon size; everything else goes the usual way.
 */
export function clawpumpIconUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  if (u.startsWith("//")) return iconUrl(`https:${u}`);
  if (u.startsWith("/")) return proxied(`https://clawpump.tech${u}`);
  return iconUrl(u);
}
