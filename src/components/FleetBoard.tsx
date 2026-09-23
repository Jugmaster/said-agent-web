"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFleet, type PublicCredits } from "@/lib/api";
import s from "@/app/landing.module.css";

const usd = (v: number | null | undefined) => (v == null ? "$—" : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

/* The leaderboard, refreshed every 30 seconds. Sorted by result since funded. */
export default function FleetBoard() {
  const [fleet, setFleet] = useState<PublicCredits[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => getFleet().then((f) => alive && setFleet(f)).catch(() => alive && setFleet([]));
    load();
    const t = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (fleet === null) return <div className={s.empty} style={{ marginTop: 44 }}>Loading the board…</div>;
  if (fleet.length === 0) return <div className={s.empty} style={{ marginTop: 44 }}>The board fills on the first funding day.</div>;

  const sorted = [...fleet].sort((a, b) => (b.pnlUsd ?? -Infinity) - (a.pnlUsd ?? -Infinity));
  return (
    <div className={s.list} style={{ marginTop: 44 }}>
      {sorted.map((a, i) => {
        const name = a.displayName ?? a.platformId;
        return (
          <Link key={a.platformId} href={`/agents/${encodeURIComponent(a.platformId)}`} className={s.rowItem}>
            <span className={s.rowAvatar}>{i + 1}</span>
            <span style={{ minWidth: 0 }}>
              <span className={s.rowName}>
                {name}
                <small>Level {a.level} · {a.levelName}</small>
                {a.streak > 0 && <span className={s.okPill}>{a.streak}-day streak</span>}
              </span>
              <span className={s.rowMeta}>{usd(a.fundedTotalUsd)} funded · {a.peoplePaid} people paid</span>
            </span>
            <span className={s.rowRight}>
              <b style={{ color: (a.pnlUsd ?? 0) >= 0 ? "#157E4E" : "#B93A16" }}>{a.pnlUsd == null ? "—" : `${a.pnlUsd >= 0 ? "+" : "−"}${usd(Math.abs(a.pnlUsd))}`}</b>
              {usd(a.balanceUsd)} balance
            </span>
          </Link>
        );
      })}
    </div>
  );
}
