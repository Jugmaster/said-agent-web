import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import InstallNudge from "@/components/InstallNudge";
import BottomTabBar from "@/components/BottomTabBar";
import { LaunchProvider } from "@/components/LaunchProvider";
import { getLaunch } from "@/lib/launch";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Every page renders per request. The launch state below comes from the
// environment, and a statically built page would bake the pre-launch state
// into its HTML where no environment change could reach it.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { launched } = getLaunch();
  const description = launched
    ? "Your AI comes funded. Funded every month, sized by its level. Pay anyone you can name."
    : "Send money like a DM. An AI agent with its own wallet: type a handle and an amount and it pays them, even if they have never heard of Atcha. It trades in one click too.";
  const short = launched ? "Your AI comes funded. Pay anyone you can name." : "Send money like a DM, to anyone you can name.";
  return {
  metadataBase: new URL("https://atcha.cash"),
  title: "Atcha",
  description,
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Atcha",
    description,
    url: "https://atcha.cash",
    siteName: "Atcha",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atcha",
    description: short,
  },
  // Favicon + apple-touch-icon are picked up automatically from
  // app/icon.png and app/apple-icon.png via Next's file convention.
  // (The previously-referenced public/favicon.png had JPEG content under
  // a .png extension — Safari rejected it.)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Atcha",
  },
  };
}

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
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
  const launch = getLaunch();
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      // The Telegram Web App SDK below stamps --tg-viewport-* style vars onto
      // <html> before React hydrates, so the attribute never matches the
      // server HTML. Suppress the mismatch warning for this element only.
      suppressHydrationWarning
    >
      <head>
        {/* Theme before first paint: an explicit choice stamps data-theme; system leaves it off. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("atcha:theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`,
          }}
        />
        {/* Telegram Web App SDK — exposes window.Telegram.WebApp inside Telegram */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <LaunchProvider value={launch}>
          {/* Animated dot-grid canvas (z-0) + radial vignette (z-1) on every page */}
          {/* Content sits above the background */}
          <div className="relative z-10 flex flex-col min-h-dvh">{children}</div>
          <InstallNudge />
          <BottomTabBar />
          </LaunchProvider>
        </Providers>
      </body>
    </html>
  );
}
