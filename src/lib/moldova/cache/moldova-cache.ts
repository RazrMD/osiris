/**
 * OSIRIS — Moldova Intelligence Layer Cache
 * High-performance in-memory cache with stale-on-error fallback, deduplication, and metrics.
 */

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  inflight: Promise<T> | null;
  hits: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();
const MAX_ENTRIES = 200;

function evict(): void {
  if (memoryStore.size <= MAX_ENTRIES) return;
  for (const [key, entry] of memoryStore.entries()) {
    if (memoryStore.size <= MAX_ENTRIES) break;
    if (entry.inflight) continue;
    memoryStore.delete(key);
  }
}

export async function fetchWithMoldovaCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  fallbackValue?: T,
): Promise<T> {
  const now = Date.now();
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;

  // Cache hit & still fresh
  if (entry && now < entry.expiresAt && entry.data !== undefined) {
    entry.hits++;
    return entry.data;
  }

  // Deduplicate in-flight requests
  if (entry?.inflight) {
    return entry.inflight;
  }

  const inflight = (async () => {
    try {
      const data = await fetcher();
      memoryStore.set(key, {
        data,
        cachedAt: now,
        expiresAt: now + ttlMs,
        inflight: null,
        hits: (entry?.hits ?? 0) + 1,
      });
      return data;
    } catch (err) {
      console.warn(`[Moldova Intel Cache] Fetch failed for key "${key}":`, err);
      // Serve stale data if available
      if (entry && entry.data !== undefined) {
        // Extend stale cache by 60 seconds to prevent hammering
        memoryStore.set(key, {
          data: entry.data,
          cachedAt: entry.cachedAt,
          expiresAt: now + 60_000,
          inflight: null,
          hits: entry.hits + 1,
        });
        return entry.data;
      }
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw err;
    }
  })();

  memoryStore.set(key, {
    data: entry?.data as T,
    cachedAt: entry?.cachedAt ?? now,
    expiresAt: entry?.expiresAt ?? 0,
    inflight,
    hits: entry?.hits ?? 0,
  } as CacheEntry<unknown>);
  evict();

  return inflight;
}

export function peekMoldovaCache<T>(key: string): T | undefined {
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined;
  return entry?.data;
}

export function clearMoldovaCache(): void {
  memoryStore.clear();
}
