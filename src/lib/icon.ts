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
