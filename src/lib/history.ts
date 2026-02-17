import type { HistoryEntry, Vehicle, AnalysisResult } from "./types";

const STORAGE_KEY = "vehicle-analyzer-history";
const MAX_ENTRIES = 50;

/**
 * Save an analysis to localStorage history
 */
export function saveToHistory(
    vehicle: Vehicle,
    analysis: AnalysisResult
): HistoryEntry {
    const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        vehicle,
        analysis,
    };

    const history = getHistory();
    history.unshift(entry);

    // Keep only the most recent entries
    if (history.length > MAX_ENTRIES) {
        history.length = MAX_ENTRIES;
    }

    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    return entry;
}

/**
 * Get analysis history from localStorage
 */
export function getHistory(): HistoryEntry[] {
    if (typeof window === "undefined") return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Delete a single history entry
 */
export function deleteFromHistory(id: string): void {
    const history = getHistory().filter((entry) => entry.id !== id);
    if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
    }
}
