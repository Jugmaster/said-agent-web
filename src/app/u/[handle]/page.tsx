import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PublicMotion from "@/components/PublicMotion";
import { getCreditsByHandle } from "@/lib/api";
import s from "@/app/landing.module.css";

interface PageProps { params: Promise<{ handle: string }> }

const usd = (v: number | null | undefined) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const clean = (h: string) => decodeURIComponent(h).replace(/^@/, "");

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const handle = clean((await params).handle);
  const a = await getCreditsByHandle(handle);
  const title = `@${handle} · Atcha`;
  const description = a
    ? `Level ${a.level} · ${a.levelName}. ${a.peoplePaid} people paid, funded ${a.monthsFunded} month${a.monthsFunded === 1 ? "" : "s"}.`
    : `Pay @${handle} $1 and they have an Atcha.`;
  return { title, description, openGraph: { title, description, type: "profile" }, twitter: { card: "summary", title, description } };
}

export default async function HandlePage({ params }: PageProps) {
  const handle = clean((await params).handle);
  const a = await getCreditsByHandle(handle);
  const payHref = `/send?to=${encodeURIComponent(handle)}`;

  return (
    <div className={s.page}>
      <PublicMotion />
      <Navbar />
      <main className={s.wrap}>
        <header className={s.pageHead} data-reveal>
          <p className={s.eyebrow}>{a ? `Level ${a.level} · ${a.levelName}` : "Not on Atcha yet"}</p>
          <h1 className={s.big}>@{handle}</h1>
          <p className={s.pageSub}>
            {a
              ? a.funded
                ? `Funded ${a.monthsFunded} month${a.monthsFunded === 1 ? "" : "s"}, ${usd(a.fundedTotalUsd)} in total. ${a.peoplePaid} people paid.`
                : `${a.peoplePaid} of 5 people paid. Five and it gets funded.`
              : `Pay them $1 by name and they have an Atcha the moment they log in.`}
          </p>
          <div className={s.ctas}>
            <Link href={payHref} className={s.btn}>Pay @{handle}</Link>
            {a && a.verified && <span className={s.okPill} style={{ alignSelf: "center" }}>✓ verified</span>}
          </div>
        </header>

        {a && (
          <div className={s.tiles} data-stagger>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Balance</span>
              <div className={s.val}>{usd(a.balanceUsd)}</div>
              <div className={s.tsub}>{a.pnlUsd == null ? "" : `${a.pnlUsd >= 0 ? "+" : "−"}${usd(Math.abs(a.pnlUsd))} since funded`}</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>People paid</span>
              <div className={s.val} data-count>{a.peoplePaid}</div>
              <div className={s.tsub}>{a.streak > 0 ? `${a.streak}-day streak` : "no streak yet"}</div>
            </div>
            <div className={s.tile}>
              <span className={s.eyebrow} style={{ margin: 0 }}>Funded</span>
              <div className={s.val}>{usd(a.fundedTotalUsd)}</div>
              <div className={s.tsub}>{a.fundedThisMonth ? "this month's landed" : a.funded ? "waiting on funding day" : "not yet"}</div>
            </div>
          </div>
        )}

        {a && a.fundings.length > 0 && (
          <section style={{ marginTop: 44 }} data-reveal>
            <p className={s.eyebrow}>Funding record</p>
            <div className={s.list}>
              {a.fundings.map((f, i) => (
                <div key={i} className={s.rowItem}>
                  <span className={s.rowAvatar}>$</span>
                  <span style={{ minWidth: 0 }}>
                    <span className={s.rowName}>{usd(f.amountUsd)} funded</span>
                    <span className={s.rowMeta}>{new Date(f.at.endsWith("Z") ? f.at : f.at + "Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </span>
                  <span className={s.rowRight}>
                    {f.tx ? <a href={`https://solscan.io/tx/${f.tx}`} target="_blank" rel="noreferrer">tx ↗</a> : "—"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className={s.pageFoot}>
          Want one? <Link href="/">Get your funded Atcha</Link>.
        </footer>
      </main>
    </div>
  );
}
