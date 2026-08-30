/** Display helpers shared across the app surfaces (activity, chat rail, wallet). */

export function timeAgo(iso: string): string {
  const t = new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function actionLabel(type: string): { emoji: string; text: string; color: string } {
  switch (type) {
    case "swap":
      return { emoji: "🔄", text: "Swap", color: "text-blue-400" };
    case "stake":
      return { emoji: "🔒", text: "Stake", color: "text-[var(--good)]" };
    case "transfer":
      return { emoji: "📤", text: "Transfer", color: "text-purple-400" };
    case "test_action":
      return { emoji: "🧪", text: "Test", color: "text-[var(--faint)]" };
    default:
      return { emoji: "•", text: type, color: "text-[var(--ink)]" };
  }
}

export function truncMiddle(s: string, head = 6, tail = 6): string {
  return s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}
