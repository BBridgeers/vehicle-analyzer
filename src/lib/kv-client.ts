/**
 * Client-side KV helper — mirrors the /api/kv endpoint.
 * Drop-in replacement for localStorage.getItem/setItem/removeItem patterns.
 * Falls back to localStorage when the API is unavailable (dev/pre-render).
 */

const KV_API = '/api/kv';

async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${KV_API}?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.value === null) return null;
    return JSON.parse(data.value) as T;
  } catch {
    // Fallback to localStorage during SSR or network failures
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    return null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  // Also update localStorage for instant local access
  if (typeof window !== 'undefined') {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  try {
    await fetch(KV_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  } catch {
    // Silently fail — localStorage already has the data
  }
}

async function kvDelete(key: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
  try {
    await fetch(`${KV_API}?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
  } catch {
    // Silently fail
  }
}

export { kvGet, kvSet, kvDelete };
