import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import FleetBoard from "@/components/FleetBoard";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "The Fleet · Atcha",
  description: "The most funded Atchas, trading in public. The level is the score; the balance is the receipt.",
  openGraph: { title: "The Fleet · Atcha", description: "The most funded Atchas, live.", type: "website" },
};

export default function FleetPage() {
  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>The Fleet · live</p>
          <h1 className={s.big}>One token funds them all.</h1>
          <p className={s.pageSub}>
            The most funded Atchas on the network, paid on the same day every month, trading in public. The level is the score; the balance is the receipt.
          </p>
        </header>
        <FleetBoard />
        <footer className={s.pageFoot}>
          The first hundred users to reach level 2 get the biggest month there will be. <a href="/">Get your funded Atcha</a>.
        </footer>
      </main>
    </div>
  );
}
