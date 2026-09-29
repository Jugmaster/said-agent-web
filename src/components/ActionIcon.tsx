/**
 * Stroke icons for actions and activity, same weight and box as the nav
 * icons, so lists read as one set. Never an emoji: they render differently
 * on every platform and none of them is ours.
 */
export type ActionIconName =
  | "swap" | "buy" | "sell" | "send" | "receive" | "stake" | "dca" | "limit" | "deposit" | "withdraw" | "bridge"
  | "funding" | "task" | "gift" | "agent" | "pay" | "ask" | "level" | "wallet" | "activity" | "check" | "warn" | "clock" | "undo" | "dot";

const BOX = "w-[18px] h-[18px]";

export default function ActionIcon({ name, className = BOX }: { name: ActionIconName; className?: string }) {
  const p = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "swap": return <svg {...p}><path d="M4 7h13l-3-3" /><path d="M20 17H7l3 3" /></svg>;
    case "buy": return <svg {...p}><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></svg>;
    case "sell": return <svg {...p}><path d="M12 5v14" /><path d="M18 13l-6 6-6-6" /></svg>;
    case "send": case "pay": return <svg {...p}><path d="M5 19L19 5" /><path d="M9 5h10v10" /></svg>;
    case "receive": return <svg {...p}><path d="M19 5L5 19" /><path d="M15 19H5V9" /></svg>;
    case "stake": return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
    case "dca": return <svg {...p}><path d="M4 18h16" /><path d="M6 14l4-4 3 3 5-6" /><circle cx="18" cy="7" r="1" fill="currentColor" /></svg>;
    case "limit": return <svg {...p}><path d="M4 12h16" strokeDasharray="3 3" /><path d="M6 18l4-5 3 2 5-7" /></svg>;
    case "deposit": return <svg {...p}><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" /></svg>;
    case "withdraw": return <svg {...p}><path d="M12 15V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></svg>;
    case "bridge": return <svg {...p}><path d="M3 17c3-6 15-6 18 0" /><path d="M3 17v3M21 17v3M9 14v6M15 14v6" /></svg>;
    case "funding": return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10.5h3.5a1.5 1.5 0 0 1 0 3h-2a1.5 1.5 0 0 0 0 3h3.5" /></svg>;
    case "task": return <svg {...p}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 12l3 3 5-6" /></svg>;
    case "gift": return <svg {...p}><rect x="4" y="10" width="16" height="10" rx="1.5" /><path d="M4 14h16M12 10v10" /><path d="M12 10c-3 0-4.5-1.2-4.5-2.7S9 5 12 8c3-3 4.5-2.2 4.5-.7S15 10 12 10z" /></svg>;
    case "agent": return <svg {...p}><rect x="5" y="7" width="14" height="12" rx="3" /><path d="M12 4v3M9 13h.01M15 13h.01" /></svg>;
    case "ask": return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>;
    case "level": return <svg {...p}><path d="M4 20V14M12 20V9M20 20V4" /></svg>;
    case "wallet": return <svg {...p}><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M16 12.5h4" /><circle cx="16" cy="12.5" r="1" fill="currentColor" /></svg>;
    case "activity": return <svg {...p}><path d="M3 12h4l3-7 4 14 3-7h4" /></svg>;
    case "check": return <svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
    case "warn": return <svg {...p}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
    case "undo": return <svg {...p}><path d="M9 14L4 9l5-5" /><path d="M4 9h9a6 6 0 0 1 0 12h-3" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" /></svg>;
  }
}

/** The icon for an activity receipt's action type. */
export function iconFor(type: string): ActionIconName {
  const t = type.toLowerCase();
  if (t.includes("swap")) return "swap";
  if (t.includes("stake")) return "stake";
  if (t.includes("dca")) return "dca";
  if (t.includes("limit")) return "limit";
  if (t.includes("bridge") || t.includes("cross")) return "bridge";
  if (t.includes("transfer") || t.includes("send")) return "send";
  if (t.includes("claim") || t.includes("receive")) return "receive";
  if (t.includes("deposit") || t.includes("fund")) return "deposit";
  if (t.includes("withdraw")) return "withdraw";
  if (t.includes("buy") || t.includes("purch")) return "buy";
  return "dot";
}

/** A status mark: the icon in a soft round badge, for empty states and outcomes. */
export function Mark({ name, tone = "neutral", className = "" }: { name: ActionIconName; tone?: "neutral" | "up" | "down" | "warn"; className?: string }) {
  const bg = tone === "up" ? "bg-up-soft text-up" : tone === "down" ? "bg-down-soft text-down" : tone === "warn" ? "bg-warn-soft text-warn" : "bg-card text-ink";
  return <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${bg} ${className}`}><ActionIcon name={name} className="w-[20px] h-[20px]" /></span>;
}
