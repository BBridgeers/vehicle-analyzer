import type { HistoryEntry, Vehicle, AnalysisResult } from "./types";
import { kvGet, kvSet } from "./kv-client";

const STORAGE_KEY = "vehicle-analyzer-history";
const MAX_ENTRIES = 50;

/**
 * Save an analysis to KV (Upstash Redis) with localStorage fallback
 */
export async function saveToHistory(
    vehicle: Vehicle,
    analysis: AnalysisResult
): Promise<HistoryEntry> {
    const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        vehicle,
        analysis,
    };

    const history = await getHistory();
    history.unshift(entry);

    // Keep only the most recent entries
    if (history.length > MAX_ENTRIES) {
        history.length = MAX_ENTRIES;
    }

    await kvSet(STORAGE_KEY, history);
    return entry;
}

/**
 * Get analysis history from KV (Upstash Redis)
 */
export async function getHistory(): Promise<HistoryEntry[]> {
    try {
        const data = await kvGet<HistoryEntry[]>(STORAGE_KEY);
        return data ?? [];
    } catch {
        return [];
    }
}

/**
 * Delete a single history entry
 */
export async function deleteFromHistory(id: string): Promise<void> {
    const history = (await getHistory()).filter((entry) => entry.id !== id);
    await kvSet(STORAGE_KEY, history);
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
    await kvSet(STORAGE_KEY, []);
}
