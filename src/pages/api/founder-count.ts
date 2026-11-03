export const prerender = false;

import type { APIRoute } from 'astro';
import { getFounderCount, FOUNDER_REVEAL_THRESHOLD } from '../../lib/founderCount';

// { available: false } when Stripe can't be read: the page shows the offer
// without a number rather than a wrong one.
export const GET: APIRoute = async () => {
  const r = await getFounderCount();
  const body = r ? { available: true, ...r, reveal: r.count >= FOUNDER_REVEAL_THRESHOLD } : { available: false };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
