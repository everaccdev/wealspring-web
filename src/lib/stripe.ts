import Stripe from 'stripe';

const key = import.meta.env.STRIPE_SECRET_KEY as string | undefined;
export const stripe = key ? new Stripe(key) : null;

// The active Price holding a lookup key (lib/catalog), cached for five
// minutes. Null when Stripe isn't set up or no active Price has the key.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { price: Stripe.Price | null; fetchedAt: number }>();

export async function priceByLookupKey(lookupKey?: string) {
  if (!stripe || !lookupKey) return null;
  const hit = cache.get(lookupKey);
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.price;
  const { data } = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  const price = data[0] ?? null;
  cache.set(lookupKey, { price, fetchedAt: Date.now() });
  return price;
}

// "$39.97" / "/year" from a Stripe Price, or null if it can't be read —
// pages then leave the price out rather than show a wrong one.
export async function priceLabel(lookupKey?: string) {
  try {
    const p = await priceByLookupKey(lookupKey);
    if (!p || p.unit_amount == null) return null;
    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.unit_amount / 100);
    const per = p.recurring ? `/${p.recurring.interval}` : '';
    return { amount, per, cents: p.unit_amount, interval: p.recurring?.interval ?? null };
  } catch (e) {
    console.error('priceLabel failed', lookupKey, (e as Error).message);
    return null;
  }
}
