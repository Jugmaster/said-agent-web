/**
 * A small in-memory cache for upstream calls the token routes make. Keeps a
 * value for `ttlMs`, de-duplicates in-flight requests for the same key, and
 * serves the last good value when the upstream fails (rate limits, mostly).
 * Per server instance, which is what we run.
 */
const store = new Map<string, { value: unknown; at: number }>();
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>, opts: { staleOnError?: boolean } = {}): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = (async () => {
    try {
      const v = await load();
      store.set(key, { value: v, at: Date.now() });
      return v;
    } catch (err) {
      if (opts.staleOnError !== false && hit) return hit.value as T;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}
