import type { Rates } from "./engine";
import { clearCalcCache } from "./line";

interface Stored {
  date: string;
  rates: Rates;
  fetchedAt: number;
}

const KEY = "datmd:rates";
const URL = "https://api.frankfurter.dev/v1/latest"; // ECB reference rates, base EUR, no key, CORS-enabled
const MAX_AGE = 12 * 60 * 60 * 1000;
const RETRY_AFTER = 60 * 1000;

let current: Stored | null = null;
let inflight = false;
let lastFailure = 0;
const listeners = new Set<() => void>();

try {
  if (typeof localStorage !== "undefined") current = JSON.parse(localStorage.getItem(KEY) ?? "null");
} catch {
  current = null;
}

export const getRates = (): Rates | null => current?.rates ?? null;

export function subscribeRates(cb: () => void) {
  listeners.add(cb);
  return () => void listeners.delete(cb);
}

/** Fetches rates when missing or stale. Only called once a document actually uses currencies. */
export function requestRates() {
  const fresh = current && Date.now() - current.fetchedAt < MAX_AGE;
  if (fresh || inflight || Date.now() - lastFailure < RETRY_AFTER || typeof navigator === "undefined" || !navigator.onLine) return;
  inflight = true;
  fetch(URL)
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((data: { date: string; rates: Rates }) => {
      if (!data?.rates || typeof data.rates !== "object") throw new Error("bad rates");
      current = { date: data.date, rates: data.rates, fetchedAt: Date.now() };
      try {
        localStorage.setItem(KEY, JSON.stringify(current));
      } catch {}
      clearCalcCache();
      for (const l of listeners) l();
    })
    .catch(() => {
      lastFailure = Date.now(); // stale cached rates (if any) keep working offline
    })
    .finally(() => {
      inflight = false;
    });
}
