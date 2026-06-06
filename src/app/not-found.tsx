import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100dvh-65px)] px-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold mb-3 tracking-tight">404</div>
          <p className="text-zinc-400 mb-8">
            This page doesn&apos;t exist — but your agent still does.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/agents" className="hover:text-white transition">
              Agents
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/launches" className="hover:text-white transition">
              Launches
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/stats" className="hover:text-white transition">
              Stats
            </Link>
            <span className="text-zinc-700">·</span>
            <Link href="/docs" className="hover:text-white transition">
              Docs
            </Link>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-zinc-200 transition"
          >
            ← Back home
          </Link>
        </div>
      </main>
    </>
  );
}
