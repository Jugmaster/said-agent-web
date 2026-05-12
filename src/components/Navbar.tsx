"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgent } from "@/hooks/useAgent";

function shortAddr(a: string | null | undefined): string {
  if (!a) return "—";
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export default function Navbar() {
  const { ready, authenticated, user, login } = usePrivy();
  const agent = useAgent();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <nav className="flex justify-between items-center px-4 md:px-8 py-4 border-b border-zinc-800/60 sticky top-0 bg-zinc-950/60 backdrop-blur-md z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">SAID Agent</span>
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/launches" className="text-zinc-400 hover:text-white transition">
            Launches
          </Link>
          <Link href="/agents" className="text-zinc-400 hover:text-white transition">
            Agents
          </Link>
          <a
            href="https://x.com/saidagent"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white transition"
          >
            @saidagent
          </a>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!ready ? (
          <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
        ) : !authenticated ? (
          <button
            onClick={login}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-zinc-200 transition"
          >
            Log in
          </button>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 border border-zinc-800 hover:border-zinc-700 rounded-lg text-sm transition"
            >
              <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold">
                {(user?.email?.address?.[0] ?? user?.wallet?.address?.[0] ?? "•").toUpperCase()}
              </span>
              <span className="hidden sm:inline text-zinc-300">
                {agent.status === "ready"
                  ? agent.agentName ?? shortAddr(agent.walletAddress)
                  : agent.status === "linking"
                    ? "linking…"
                    : agent.status === "error"
                      ? "error"
                      : "—"}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <div className="text-xs text-zinc-500">signed in as</div>
                  <div className="text-sm text-zinc-200 truncate">
                    {user?.email?.address ?? user?.wallet?.address ?? user?.id}
                  </div>
                </div>
                {agent.status === "ready" && (
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="text-xs text-zinc-500">agent wallet</div>
                    <code className="text-xs text-zinc-300 font-mono">
                      {shortAddr(agent.walletAddress)}
                    </code>
                  </div>
                )}
                <Link
                  href="/chat"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                >
                  Chat
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                >
                  Portfolio
                </Link>
                <Link
                  href="/activity"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm hover:bg-zinc-800 transition"
                >
                  Activity
                </Link>
                <button
                  onClick={() => {
                    agent.logout();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 transition border-t border-zinc-800"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
