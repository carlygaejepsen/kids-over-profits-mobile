import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * The programs and companies this reader opened last, for the home screen. Kept on the phone only
 * (AsyncStorage), never sent anywhere; "Clear" empties it.
 */
export type RecentItem = { kind: 'facility' | 'operator'; slug: string; name: string; place?: string };

const KEY = 'kop.recent.v1';
export const RECENT_MAX = 6;

let items: RecentItem[] = [];
let loaded: Promise<void> | null = null;
const listeners = new Set<(list: RecentItem[]) => void>();

function load(): Promise<void> {
  if (!loaded) {
    loaded = AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];
        if (Array.isArray(parsed)) items = parsed.filter((i) => i && i.slug && i.name).slice(0, RECENT_MAX);
      })
      .catch(() => undefined);
  }
  return loaded;
}

function publish(next: RecentItem[]) {
  items = next;
  listeners.forEach((fn) => fn(items));
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
}

/** Put a page at the top of the list (once: opening it again moves it up). */
export async function rememberRecent(item: RecentItem): Promise<void> {
  if (!item.slug || !item.name) return;
  await load();
  const rest = items.filter((i) => !(i.kind === item.kind && i.slug === item.slug));
  publish([item, ...rest].slice(0, RECENT_MAX));
}

export async function clearRecent(): Promise<void> {
  await load();
  publish([]);
}

/** The list, kept current while the screen is mounted. */
export function useRecent(): RecentItem[] {
  const [list, setList] = useState<RecentItem[]>(items);
  useEffect(() => {
    let live = true;
    listeners.add(setList);
    void load().then(() => live && setList(items));
    return () => {
      live = false;
      listeners.delete(setList);
    };
  }, []);
  return list;
}

/** Tests only: forget the in-memory copy so the next read goes to storage again. */
export function resetRecentForTests() {
  items = [];
  loaded = null;
  listeners.clear();
}
