// Starts a Stripe Checkout session for one of:
//   { kind: 'founders', product: 'wealspring' | 'bundle',
//     plan: 'monthly' | 'annual', email? }                  — subscription
//   { kind: 'deck', item, email? }                            — one-time payment
//     item: a paid deck's id, an expansion's id, or '<deckId>:complete'
//     for a paid deck with all its expansions (lib/catalog purchasable)
// Optional uid (from a future in-app link) attaches the purchase to that exact
// account instead of resolving by email; paying for someone else's uid is a
// gift, not a vulnerability (Whisp's reasoning, same here).
// Every session names its apps in metadata.apps — see lib/catalog.ts. A
// bundle names both, so Whisp's webhook unlocks Whisp too.
export const prerender = false;

import type { APIRoute } from 'astro';
import { stripe, priceByLookupKey } from '../../lib/stripe';
import { APP, BUNDLE_APPS, FOUNDERS_PRODUCTS, purchasable, type FoundersPlan, type FoundersProduct } from '../../lib/catalog';
import { getFounderCount } from '../../lib/founderCount';

// Shown beside Stripe's email field, since the purchase goes to the account
// with the checkout email.
const EMAIL_NOTE = {
  wealspring: 'Use the email you sign in to Wealspring with. New to Wealspring? We’ll set up your account and email you a link to choose a password.',
  bundle: 'Use the email you sign in to Whisp and Wealspring with. Premium goes to the account with this email in each app; if you’re new to either, we’ll set one up.',
};

// Whisp's own founders count (its site's public endpoint). The bundle makes
// someone a Whisp founder too, so it also needs a place among Whisp's 500.
// Null when it can't be read, and the bundle then isn't sold (fails closed).
async function whispFounders(): Promise<{ capReached: boolean } | null> {
  try {
    const res = await fetch('https://getwhisp.app/api/founder-count', { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return data?.available ? { capReached: !!data.capReached } : null;
  } catch {
    return null;
  }
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request, site }) => {
  if (!stripe) return json(503, { error: 'not_configured', message: 'Purchases aren’t open yet.' });
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === 'string' && body.email.includes('@') ? body.email.trim().slice(0, 200) : undefined;
  const uid = typeof body?.uid === 'string' && body.uid.trim() ? body.uid.trim().slice(0, 128) : undefined;
  const base = site?.origin ?? new URL(request.url).origin;

  try {
    if (body?.kind === 'founders') {
      const plan: FoundersPlan = body?.plan === 'monthly' ? 'monthly' : 'annual';
      const product: FoundersProduct = body?.product === 'bundle' ? 'bundle' : 'wealspring';
      const priceId = (await priceByLookupKey(FOUNDERS_PRODUCTS[product][plan]))?.id;
      if (!priceId) return json(503, { error: 'not_configured', message: 'Founders pricing isn’t open yet.' });

      // The cap is real: if the count can't be read, refuse rather than risk
      // selling past it.
      const status = await getFounderCount();
      if (!status || status.capReached) {
        return json(409, { error: 'cap_reached', message: 'Every founders place has been taken. Standard plans are available in the app.' });
      }
      if (product === 'bundle') {
        const whisp = await whispFounders();
        if (!whisp || whisp.capReached) {
          return json(409, { error: 'whisp_cap_reached', message: whisp
            ? 'Every Whisp founders place has been taken, so the bundle is closed. Wealspring founders is still open.'
            : 'The bundle can’t be checked right now. Please try again in a few minutes.' });
        }
      }

      // Wealspring alone keeps the older app tag too, which Whisp's webhook
      // also reads; the bundle carries only apps, naming both.
      const meta = product === 'bundle'
        ? { apps: BUNDLE_APPS, kind: 'founders', plan, ...(uid && { uid }) }
        : { app: APP, apps: APP, kind: 'founders', plan, ...(uid && { uid }) };
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: email,
        allow_promotion_codes: true,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}/founders/success?session_id={CHECKOUT_SESSION_ID}${product === 'bundle' ? '&bundle=1' : ''}`,
        cancel_url: `${base}/founders`,
        custom_text: { submit: { message: EMAIL_NOTE[product === 'bundle' ? 'bundle' : 'wealspring'] } },
        metadata: meta,
        subscription_data: { metadata: meta },
      });
      return json(200, { url: session.url });
    }

    if (body?.kind === 'deck') {
      const item = purchasable(String(body?.item || body?.deckId || ''));
      const priceId = item && (await priceByLookupKey(item.lookupKey))?.id;
      if (!item || !priceId) return json(404, { error: 'unknown_deck', message: 'That deck isn’t for sale.' });
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        customer_creation: 'always',
        allow_promotion_codes: true,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}/decks/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/decks`,
        custom_text: { submit: { message: EMAIL_NOTE.wealspring } },
        // deckIds: everything bought (a complete deck is several); deckId,
        // the first, for older readers.
        metadata: { app: APP, apps: APP, kind: 'deck', deckId: item.ids[0], deckIds: item.ids.join(','), ...(uid && { uid }) },
      });
      return json(200, { url: session.url });
    }

    return json(400, { error: 'bad_request', message: 'Unknown purchase.' });
  } catch (err) {
    console.error('checkout error', (err as Error).message);
    return json(500, { error: 'checkout_failed', message: 'Checkout couldn’t start. Please try again.' });
  }
};
