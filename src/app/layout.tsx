import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import DotGridBackground from "@/components/DotGridBackground";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAID Agent",
  description: "Your AI butler on Solana — chat, swap, buy real things.",
  manifest: "/manifest.webmanifest",
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
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        {/* Telegram Web App SDK — exposes window.Telegram.WebApp inside Telegram */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {/* Animated dot-grid canvas (z-0) + radial vignette (z-1) on every page */}
          <DotGridBackground />
          {/* Content sits above the background */}
          <div className="relative z-10 flex flex-col min-h-dvh">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
