import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { CHANGELOG } from "@/content/changelog";
import { getLaunch } from "@/lib/launch";
import s from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "Changelog · Atcha",
  description: "What shipped, when, in plain words.",
};

const day = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Before the mint exists the changelog cannot describe funding or levels, so
// the lines about them sit out until launch, and an entry left empty goes too.
const PRELAUNCH_HIDE = /fund|level|ladder|budget|board|entry progress|of five|five verified/i;

export default function ChangelogPage() {
  const { launched } = getLaunch();
  const entries = launched
    ? CHANGELOG
    : CHANGELOG.map((e) => ({ ...e, items: e.items.filter((it) => !PRELAUNCH_HIDE.test(it)) })).filter((e) => e.items.length > 0 && !PRELAUNCH_HIDE.test(e.title));
  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>Changelog</p>
          <h1 className={s.big}>What shipped.</h1>
          <p className={s.pageSub}>Newest first. Plain words, things you can see or do.</p>
        </header>
        <div style={{ maxWidth: 720, marginTop: 40 }}>
          {entries.map((e) => (
            <section key={e.date} className={s.act} data-reveal style={{ gridTemplateColumns: "150px 1fr" }}>
              <span className={s.n}>{day(e.date)}</span>
              <div>
                <h3 style={{ fontSize: "1.35rem", marginBottom: 12 }}>{e.title}</h3>
                <ul style={{ margin: 0, paddingLeft: "1.1em", color: "var(--color-zinc-400)", lineHeight: 1.6 }}>
                  {e.items.map((it, i) => <li key={i} style={{ marginBottom: 6 }}>{it}</li>)}
                </ul>
              </div>
            </section>
          ))}
        </div>
        <footer className={s.pageFoot}>Something missing? Tell <a href="https://x.com/atchacash" target="_blank" rel="noreferrer">@atchacash</a>.</footer>
      </main>
    </div>
  );
}
