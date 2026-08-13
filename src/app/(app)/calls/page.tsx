"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { commsCall, getComms, type CommsCallRecord } from "@/lib/api";
import { timeAgo } from "@/lib/format";

// Your agent makes real phone calls: give it a number and a task, it speaks,
// and the transcript + recording land back here. Single-balance doctrine:
// the $0.54 comes "from your balance" — routing between wallets is server-side
// plumbing the user never sees.

const CALL_COST = "$0.54";

export default function CallsPage() {
  return <AuthGate>{(platformId) => <CallsInner platformId={platformId} />}</AuthGate>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    routing: { label: "Preparing…", cls: "bg-amber-500/10 text-amber-300 border-amber-800" },
    in_progress: { label: "Calling…", cls: "bg-sky-500/10 text-sky-300 border-sky-800" },
    completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-800" },
    failed: { label: "Failed", cls: "bg-red-500/10 text-red-300 border-red-900" },
  };
  const m = map[status] ?? { label: status, cls: "bg-zinc-800 text-zinc-300 border-zinc-700" };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>
  );
}

function CallCard({ call }: { call: CommsCallRecord }) {
  const [open, setOpen] = useState(false);
  const hasDetail = call.summary || call.transcript || call.recordingUrl;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{call.to}</span>
            <StatusBadge status={call.status} />
          </div>
          <p className="text-xs text-zinc-400 mt-1 truncate">{call.task}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-zinc-500">{timeAgo(call.createdAt.replace(" ", "T") + "Z")}</p>
          {hasDetail && (
            <button
              onClick={() => setOpen(!open)}
              className="text-xs text-zinc-300 underline mt-1"
            >
              {open ? "Hide" : "Transcript"}
            </button>
          )}
        </div>
      </div>
      {call.status === "failed" && call.error && (
        <p className="text-xs text-red-400 mt-2">{call.error}</p>
      )}
      {open && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
          {call.summary && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Summary</p>
              <p className="text-sm text-zinc-300">{call.summary}</p>
            </div>
          )}
          {call.transcript && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Transcript</p>
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans max-h-72 overflow-y-auto">
                {formatTranscript(call.transcript)}
              </pre>
            </div>
          )}
          {call.recordingUrl && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">Recording</p>
              <audio controls src={call.recordingUrl} className="w-full h-9" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Transcript may be a plain string or a JSON array of {user, text} turns.
function formatTranscript(raw: string): string {
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) {
      return j
        .map((t: { user?: string; speaker?: string; text?: string }) =>
          `${(t.user ?? t.speaker ?? "?").toString().toUpperCase()}: ${t.text ?? ""}`)
        .join("\n");
    }
  } catch {
    /* plain text */
  }
  return raw;
}

function CallsInner({ platformId }: { platformId: string }) {
  const [calls, setCalls] = useState<CommsCallRecord[] | null>(null);
  const [phone, setPhone] = useState("");
  const [task, setTask] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await getComms(platformId);
      setCalls(r.calls);
      return r.calls;
    } catch {
      setCalls((c) => c ?? []);
      return [];
    }
  }, [platformId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while any call is active — the server pulls transcripts as calls
  // complete, so this is what makes the page feel live.
  useEffect(() => {
    const active = (calls ?? []).some((c) => c.status === "routing" || c.status === "in_progress");
    if (active && !pollRef.current) {
      pollRef.current = setInterval(() => void load(), 8000);
    } else if (!active && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [calls, load]);

  const phoneValid = /^\+1\d{10}$/.test(phone.trim());
  const taskValid = task.trim().length >= 5 && task.trim().length <= 500;
  const canCall = phoneValid && taskValid && !placing;

  async function placeCall() {
    if (!canCall) return;
    setPlacing(true);
    setError(null);
    try {
      const r = await commsCall({ platformId, phoneNumber: phone.trim(), task: task.trim() });
      if (!r.ok) {
        setError(r.message ?? "Couldn't place the call.");
      } else {
        setTask("");
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't place the call.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calls</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Your agent makes the call — tell it who to ring and what to say. You
          get the summary, full transcript, and recording here. {CALL_COST} per
          call, paid from your balance. US &amp; Canada numbers for now.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 mb-6">
        <div>
          <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-2">
            Phone number
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+14155551234"
            inputMode="tel"
            spellCheck={false}
            className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none font-mono text-sm"
          />
          {phone.trim() && !phoneValid && (
            <p className="text-xs text-zinc-500 mt-1.5">
              US &amp; Canada numbers only for now, e.g. +14155551234. More
              countries soon.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide text-zinc-500 mb-2">
            What should your agent say?
          </label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Call this restaurant and book a table for 2 tomorrow at 8pm under the name Callum."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm resize-none"
          />
        </div>
        <button
          onClick={() => void placeCall()}
          disabled={!canCall}
          className="w-full py-3 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 disabled:opacity-40"
        >
          {placing ? "Placing call…" : `Call now · ${CALL_COST}`}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      <div className="space-y-2">
        {calls === null ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
          </div>
        ) : calls.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">
            No calls yet. Your agent&apos;s first one is a tap away.
          </p>
        ) : (
          calls.map((c) => <CallCard key={c.id} call={c} />)
        )}
      </div>
    </div>
  );
}
