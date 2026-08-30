import type { ReactNode } from "react";
import { truncMiddle } from "@/lib/format";

/**
 * Lightweight renderer for butler's free-text replies (chat bubbles, send
 * results). Not a markdown engine — just the constructs butler actually emits,
 * with the two overflow offenders tamed so bubbles never scroll sideways:
 *
 *   ```fenced blocks```   → <pre> with its own horizontal scroll
 *   `inline code`         → styled <code>
 *   **bold**              → <strong>
 *   [label](url)          → short link
 *   bare URLs             → explorer links become "View on Solscan ↗",
 *                           anything else a middle-truncated link
 *   bare base58 addresses → middle-truncated, full value in the tooltip
 *
 * Render inside a `whitespace-pre-wrap break-words` container — line breaks
 * come from the source text.
 */

const LINK_CLASS = "underline underline-offset-2 hover:opacity-80";
const EXPLORER_RE = /solscan\.io|solana\.fm|explorer\.solana/;

function urlLabel(url: string): string {
  return EXPLORER_RE.test(url)
    ? "View on Solscan ↗"
    : `${truncMiddle(url.replace(/^https?:\/\//, ""), 16, 6)} ↗`;
}

/** Bare URLs, bare base58 addresses, and plain text. The innermost pass. */
function renderPlain(text: string, keyBase: string): ReactNode[] {
  const tokens = text.split(/(\s+)/);
  return tokens.map((tok, i) => {
    const key = `${keyBase}-${i}`;
    if (/^https?:\/\//.test(tok)) {
      return (
        <a key={key} href={tok} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {urlLabel(tok)}
        </a>
      );
    }
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(tok)) {
      return (
        <span key={key} title={tok} className="font-mono">
          {truncMiddle(tok)}
        </span>
      );
    }
    return <span key={key}>{tok}</span>;
  });
}

/** [label](url) markdown links, then falls through to the plain pass. */
function renderLinks(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(...renderPlain(text.slice(last, m.index), `${keyBase}-t${n}`));
    out.push(
      <a
        key={`${keyBase}-l${n}`}
        href={m[2]}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASS}
      >
        {m[1]} ↗
      </a>,
    );
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) out.push(...renderPlain(text.slice(last), `${keyBase}-t${n}`));
  return out;
}

/** **bold** spans; their contents still get link/address treatment. */
function renderBold(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(...renderLinks(text.slice(last, m.index), `${keyBase}-a${n}`));
    out.push(
      <strong key={`${keyBase}-b${n}`} className="font-semibold">
        {renderLinks(m[1], `${keyBase}-bi${n}`)}
      </strong>,
    );
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) out.push(...renderLinks(text.slice(last), `${keyBase}-a${n}`));
  return out;
}

/** `inline code` spans; contents are rendered verbatim. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /`([^`\n]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(...renderBold(text.slice(last, m.index), `${keyBase}-p${n}`));
    out.push(
      <code
        key={`${keyBase}-c${n}`}
        className="rounded bg-[rgba(128,128,128,.35)]/20 px-1 py-0.5 font-mono text-[0.9em] break-all"
      >
        {m[1]}
      </code>,
    );
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) out.push(...renderBold(text.slice(last), `${keyBase}-p${n}`));
  return out;
}

export default function MessageText({ text }: { text: string }) {
  // Fenced blocks first — everything between fences is verbatim, and the
  // <pre> scrolls horizontally on its own instead of stretching the bubble.
  const out: ReactNode[] = [];
  const re = /```[\w-]*\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(...renderInline(text.slice(last, m.index), `s${n}`));
    out.push(
      <pre
        key={`f${n}`}
        className="my-1.5 overflow-x-auto rounded-lg bg-[var(--bg)]/60 border border-[var(--line)]/60 px-3 py-2 font-mono text-xs whitespace-pre"
      >
        {m[1].replace(/\n$/, "")}
      </pre>,
    );
    last = m.index + m[0].length;
    n++;
  }
  if (last < text.length) out.push(...renderInline(text.slice(last), `s${n}`));
  return <>{out}</>;
}
