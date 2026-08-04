"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh px-6 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-400 mb-8">
          Your agent and funds are fine — this page just hit an error.
          {error.digest && (
            <span className="block mt-2 text-xs text-zinc-600">
              Reference: {error.digest}
            </span>
          )}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-semibold hover:bg-zinc-200 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition"
          >
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
