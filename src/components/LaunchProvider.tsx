"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Launch } from "@/lib/launch";

const OFF: Launch = { launched: false, fundingOpen: false, mint: null, ticker: null };
const Ctx = createContext<Launch>(OFF);

/**
 * Carries the launch state the root layout read on the server down to client
 * components. The value is a plain object and identical on both sides, so
 * the server HTML and the hydrated tree agree.
 */
export function LaunchProvider({ value, children }: { value: Launch; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLaunch(): Launch {
  return useContext(Ctx);
}
