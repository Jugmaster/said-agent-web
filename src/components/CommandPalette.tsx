"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface PaletteAction {
  id: string;
  label: string;
  /** Right-aligned hint, e.g. a shortcut like "G C". */
  hint?: string;
  icon?: ReactNode;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  actions: PaletteAction[];
  /** Free text that matched no action — sent straight to the agent in chat. */
  onAsk: (query: string) => void;
}

/**
 * Desktop command palette (⌘K / Ctrl+K). Two kinds of results:
 * navigation/actions filtered by the query, plus an always-available
 * "Ask your agent" row that pipes the raw query into chat — the product is
 * chat-driven, so anything you can say to the agent you can say from here.
 */
export default function CommandPalette({ open, onClose, actions, onAsk }: Props) {
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  // Row model: matched actions first; the ask-row is appended whenever there's
  // a query (even one that also matches an action — "send 5 usdc" should offer
  // both the Send page and asking the agent).
  const askRow = query.trim().length > 0;
  const rowCount = matched.length + (askRow ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlight(0);
    // Focus after paint so the input exists.
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setHighlight(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function runRow(index: number): void {
    if (index < matched.length) {
      matched[index].run();
      onClose();
    } else if (askRow) {
      onAsk(query.trim());
      onClose();
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, rowCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rowCount > 0) runRow(highlight);
    }
  }

  const rowClass = (active: boolean) =>
    `flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition ${
      active ? "bg-zinc-800/80 text-white" : "text-zinc-300 hover:bg-zinc-800/40"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[16vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Type a command — or just tell your agent what to do…"
          spellCheck={false}
          className="w-full bg-transparent px-4 py-3.5 text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none border-b border-zinc-800"
        />

        <div ref={listRef} className="max-h-80 overflow-y-auto py-1.5">
          {matched.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => runRow(i)}
              onMouseEnter={() => setHighlight(i)}
              className={rowClass(i === highlight)}
            >
              {a.icon && <span className="text-zinc-500">{a.icon}</span>}
              <span className="flex-1">{a.label}</span>
              {a.hint && (
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                  {a.hint}
                </span>
              )}
            </button>
          ))}

          {askRow && (
            <button
              type="button"
              onClick={() => runRow(matched.length)}
              onMouseEnter={() => setHighlight(matched.length)}
              className={rowClass(highlight === matched.length)}
            >
              <span className="text-zinc-500">✦</span>
              <span className="flex-1">
                Ask your agent:{" "}
                <span className="text-zinc-400">“{query.trim()}”</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-600">
                ↵
              </span>
            </button>
          )}

          {rowCount === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-600">
              Nothing matches.
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-zinc-800 px-4 py-2 text-[11px] text-zinc-600">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">anything else goes to your agent</span>
        </div>
      </div>
    </div>
  );
}
