import Stripe from 'stripe';

const key = import.meta.env.STRIPE_SECRET_KEY as string | undefined;
export const stripe = key ? new Stripe(key) : null;

// "$39.97" / "/year" from a Stripe Price, or null if it can't be read —
// pages then leave the price out rather than show a wrong one.
export async function priceLabel(priceId?: string) {
  if (!stripe || !priceId) return null;
  try {
    const p = await stripe.prices.retrieve(priceId);
    if (p.unit_amount == null) return null;
    const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(p.unit_amount / 100);
    const per = p.recurring ? `/${p.recurring.interval}` : '';
    return { amount, per, cents: p.unit_amount, interval: p.recurring?.interval ?? null };
  } catch (e) {
    console.error('priceLabel failed', priceId, (e as Error).message);
    return null;
  }
}
