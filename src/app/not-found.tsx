import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-65px)] px-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold mb-3 tracking-tight">404</div>
          <p className="text-[var(--dim)] mb-8">
            This page doesn&apos;t exist — but your agent still does.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--faint)] mb-8">
            <Link href="/" className="hover:text-[var(--ink)] transition">
              Home
            </Link>
            <span className="text-[var(--faint)]">·</span>
            <Link href="/agents" className="hover:text-[var(--ink)] transition">
              Agents
            </Link>
            <span className="text-[var(--faint)]">·</span>
            <Link href="/stats" className="hover:text-[var(--ink)] transition">
              Stats
            </Link>
            <span className="text-[var(--faint)]">·</span>
            <Link href="/docs" className="hover:text-[var(--ink)] transition">
              Docs
            </Link>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[var(--ink)] text-[var(--bg)] rounded-lg font-semibold hover:opacity-85 transition"
          >
            ← Back home
          </Link>
        </div>
      </main>
    </>
  );
}
