import type { ExtractionHistoryItem } from '../types';

const HISTORY_KEY = 'knowledge-extractor:history';
const MAX_HISTORY_ITEMS = 12;

export function loadHistory(): ExtractionHistoryItem[] {
  try {
    const rawValue = window.localStorage.getItem(HISTORY_KEY);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: ExtractionHistoryItem[]): void {
  const nextItems = items.slice(0, MAX_HISTORY_ITEMS);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(nextItems));
}

export function upsertHistoryItem(
  items: ExtractionHistoryItem[],
  item: ExtractionHistoryItem,
): ExtractionHistoryItem[] {
  return [item, ...items.filter((current) => current.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);
}
