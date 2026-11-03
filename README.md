# Wealspring — website

Built like Whisp's site (`../../whisp-website/whisp-web`): [Astro](https://astro.build) 4 in hybrid mode,
deployed on Netlify with `@astrojs/netlify`.

## Local dev

```bash
cp .env.example .env   # fill in from the app's .env (EXPO_PUBLIC_FIREBASE_*)
npm install
npm run dev            # → http://localhost:4321
```

## Pages

| Path | What it is |
|---|---|
| `/` | Home |
| `/auth/action` | Where every account email link lands: reset password, confirm email, undo an email change |
| `/founders` | Founders subscription (monthly / annual), capped at 500 |
| `/decks` | The six free decks, and expansions for sale |
| `/founders/success`, `/decks/success` | After checkout |
| `/delete-account` | How to delete an account (linked from the app stores) |
| `/api/checkout`, `/api/founder-count` | Server routes (Netlify functions) |

## Netlify

- Build command `npm run build`, publish directory `dist` (from `netlify.toml`).
- **Environment variables** (see `.env.example`): the three `PUBLIC_FIREBASE_*` values for
  Wealspring's Firebase project (`wealspring`, never Whisp's), and `STRIPE_SECRET_KEY`,
  `STRIPE_FOUNDERS_MONTHLY_PRICE`, `STRIPE_FOUNDERS_ANNUAL_PRICE`, `STRIPE_BUNDLE_MONTHLY_PRICE`,
  `STRIPE_BUNDLE_ANNUAL_PRICE`. Use a **restricted** Stripe key: Checkout Sessions write, Customers
  write, Prices read, Products read, Subscriptions read.
- The site's URL comes from Netlify (`URL`), so the domain is set in one place.

## Firebase, once the site has its domain

1. **Authentication › Settings › Authorized domains:** add the site's domain.
2. **Authentication › Templates › (any template) › Customize action URL:**
   `https://<domain>/auth/action`. One URL serves every template.

## Payments (Stripe — shared with Whisp)

Wealspring uses the Eyes Wide Wellness Stripe account that Whisp uses. Prices are read from Stripe,
never written in the code; `src/lib/catalog.ts` says what's sold.

1. **Products:** "Wealspring Founders" and "Whisp + Wealspring Founders", each with a monthly and
   an annual recurring Price. Put the four Price IDs in the Netlify env vars above. All four count
   toward the 500 founders cap. The bundle is founders-only and web-only (Apple subscriptions belong
   to one app).
2. **Expansions:** one Product + one-time Price each. Add the deck to `EXPANSIONS` in
   `src/lib/catalog.ts` (its `id` must match the app's deck id).
3. **Webhook:** Stripe › Developers › Webhooks › Add endpoint
   `https://us-central1-wealspring.cloudfunctions.net/stripeWebhook`, events
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   Its signing secret → `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` (in the app repo),
   and the Stripe secret key → `STRIPE_SECRET_KEY`. The webhook lives in the app repo's `payments/`
   folder, its own Functions codebase: `firebase deploy --only functions:payments`.
4. **Routing between the apps.** Every session names its apps in `metadata.apps`: `wealspring`, or
   `whisp,wealspring` for the bundle. Each app's `stripeWebhook` acts only on sessions that name it,
   so a bundle unlocks premium in both, each finding (or creating) the account with the checkout
   email in its own Firebase project. Whisp's webhook endpoint in Stripe also needs the
   `customer.subscription.updated` and `.deleted` events for cancellations.
