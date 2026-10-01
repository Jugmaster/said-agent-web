/** IPFS gateways stall or refuse in browsers; serve those through a cached image proxy. Other hosts pass through. */
export function iconUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  const m = u.match(/^(?:ipfs:\/\/|https?:\/\/(?:ipfs\.io|gateway\.pinata\.cloud|cloudflare-ipfs\.com|cf-ipfs\.com|nftstorage\.link)\/ipfs\/)([^?#]+)/i);
  const src = m ? `https://ipfs.io/ipfs/${m[1]}` : u;
  return m ? `https://wsrv.nl/?url=${encodeURIComponent(src)}&w=96&h=96&fit=cover&output=webp` : u;
}
