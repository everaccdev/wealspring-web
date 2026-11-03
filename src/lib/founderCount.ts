// Live founder count, as Whisp's: active Stripe subscriptions on every Price
// of the founders Products — Wealspring and the Whisp + Wealspring bundle,
// monthly and annual, including older Prices a lookup key has moved off
// (their founders keep their price, and still count). Cached in memory for five
// minutes. Returns null when Stripe can't be read — pages then show the offer
// without a number, and checkout refuses (fails closed) rather than risk
// selling past the cap.
import { stripe, priceByLookupKey } from './stripe';
import { FOUNDER_CAP, FOUNDERS_LOOKUP_KEYS } from './catalog';

// Below this, "3 of 500" reads as nobody else has joined; pages show neutral
// "spots open" copy instead. Display only — the cap itself is unaffected.
export const FOUNDER_REVEAL_THRESHOLD = 25;
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { count: number; fetchedAt: number } | null = null;

// Every Price, active or archived, of the Products the founders lookup keys
// point at.
async function foundersPriceIds() {
  const current = await Promise.all(FOUNDERS_LOOKUP_KEYS.map(priceByLookupKey));
  const products = [...new Set(current.flatMap((p) => (p ? [typeof p.product === 'string' ? p.product : p.product.id] : [])))];
  const lists = await Promise.all(products.map((product) => stripe!.prices.list({ product, limit: 100 })));
  return lists.flatMap((l) => l.data.map((p) => p.id));
}

async function countActive(priceId: string) {
  let count = 0;
  let startingAfter: string | undefined;
  for (;;) {
    const page = await stripe!.subscriptions.list({ price: priceId, status: 'active', limit: 100, starting_after: startingAfter });
    count += page.data.length;
    if (!page.has_more) return count;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) return count;
  }
}

const result = (count: number) => ({ count, remaining: Math.max(0, FOUNDER_CAP - count), capReached: count >= FOUNDER_CAP });

export async function getFounderCount() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return result(cache.count);
  if (!stripe) return null;
  try {
    const ids = await foundersPriceIds();
    if (ids.length === 0) return null;
    const counts = await Promise.all(ids.map(countActive));
    cache = { count: counts.reduce((a, b) => a + b, 0), fetchedAt: Date.now() };
    return result(cache.count);
  } catch (e) {
    console.error('getFounderCount failed', (e as Error).message);
    return cache ? result(cache.count) : null;
  }
}
