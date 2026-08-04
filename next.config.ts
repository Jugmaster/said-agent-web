import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // A stray package-lock.json in the home directory makes Next infer
    // ~/ as the workspace root; pin it to this project.
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Baseline hardening only. Deliberately NO frame-ancestors /
          // X-Frame-Options: the Telegram Mini App loads this site embedded
          // (web.telegram.org iframes it), so a frame lockdown would break it.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // payment/clipboard deliberately unrestricted — the Privy/MoonPay
            // on-ramp and copy-address buttons depend on them.
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
