import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import DotGridBackground from "@/components/DotGridBackground";
import InstallNudge from "@/components/InstallNudge";
import BottomTabBar from "@/components/BottomTabBar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agent.saidprotocol.com"),
  title: "SAID Agent",
  description:
    "Your AI agent on Solana — send by @handle, buy real things, swap tokens. One chat, one wallet, no seed phrases.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "SAID Agent",
    description:
      "Your AI agent on Solana — send by @handle, buy real things, swap tokens. One chat, one wallet, no seed phrases.",
    url: "https://agent.saidprotocol.com",
    siteName: "SAID Agent",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SAID Agent",
    description:
      "Your AI agent on Solana — one chat, one wallet, no seed phrases.",
  },
  // Favicon + apple-touch-icon are picked up automatically from
  // app/icon.png and app/apple-icon.png via Next's file convention.
  // (The previously-referenced public/favicon.png had JPEG content under
  // a .png extension — Safari rejected it.)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SAID Agent",
  },
};

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  // NO maximumScale — locking it at 1 disabled pinch-zoom, so iOS's auto
  // zoom-on-focus (any input <16px) left users stuck zoomed in with the
  // navbar/composer shoved off-screen (read as "mobile is broken").
  // interactiveWidget makes dvh shrink when the keyboard opens so the
  // bottom-pinned chat composer isn't hidden behind it.
  interactiveWidget: "resizes-content" as const,
  // Extend rendering behind iOS notch / home indicator so safe-area-inset-*
  // env values become non-zero (and we can pad accordingly in components).
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // globals.css sets scroll-behavior: smooth; this marker lets Next
      // suppress it during route transitions instead of warning about it.
      data-scroll-behavior="smooth"
      className={`${inter.variable} h-full antialiased`}
      // The Telegram Web App SDK below stamps --tg-viewport-* style vars onto
      // <html> before React hydrates, so the attribute never matches the
      // server HTML. Suppress the mismatch warning for this element only.
      suppressHydrationWarning
    >
      <head>
        {/* Apply the stored theme before first paint. Without this the page
            renders dark, then snaps to light for anyone who chose it. Dark is
            the default, so only "light" stamps an attribute. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('said-theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}",
          }}
        />
        {/* Telegram Web App SDK — exposes window.Telegram.WebApp inside Telegram */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {/* Animated dot-grid canvas (z-0) + radial vignette (z-1) on every page */}
          <DotGridBackground />
          {/* Content sits above the background */}
          <div className="relative z-10 flex flex-col min-h-dvh">{children}</div>
          <InstallNudge />
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
