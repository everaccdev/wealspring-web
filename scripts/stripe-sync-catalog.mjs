// Makes Stripe match what Wealspring sells: one Product per deck, expansion,
// complete deck and founders plan, each with a Price at the amount below and
// the lookup key the site reads (src/lib/catalog.ts). Run it against the
// sandbox first, then live. Safe to run again: anything already right is left
// alone; a price that changed gets a new Price, the lookup key moves onto it
// and the old one-time Price is archived. Each Product shows its card back
// at checkout.
//
//   KEY=sk_test_… node scripts/stripe-sync-catalog.mjs            # shows what it would do
//   KEY=sk_test_… node scripts/stripe-sync-catalog.mjs --apply    # does it
//
// The key needs Products and Prices write (a secret key, or a restricted key
// with those two), not the site's own key.
//
// Amounts: decks $3.99, expansions $1.99, a deck with all its expansions the
// deck + $1 per expansion. Founders plans keep their prices.
import Stripe from 'stripe';

const { KEY } = process.env;
const apply = process.argv.includes('--apply');
if (!KEY) { console.error('Set KEY to a Stripe secret key.'); process.exit(1); }
const stripe = new Stripe(KEY);
const mode = /_live_/.test(KEY) ? 'LIVE' : 'sandbox';

const DECK = 399, EXPANSION = 199, PER_EXPANSION_IN_COMPLETE = 100;
const back = (deckId, expansionId) =>
  `https://firebasestorage.googleapis.com/v0/b/wealspring.firebasestorage.app/o/${encodeURIComponent(`public/decks/${deckId}/card-back${expansionId ? `-${expansionId}` : ''}.webp`)}?alt=media`;
const key = (id) => id.replace(/-/g, '_');

// Paid decks and every expansion (free decks can have paid expansions).
const PAID_DECKS = [
  { id: 'dream-archetypes', name: 'Dream Archetypes', expansions: [] },
  { id: 'animal-symbolism', name: 'Animal Symbolism', expansions: [
    { id: 'desert-canyon', name: 'Desert & Canyon' },
    { id: 'woodlands-backyards', name: 'Woodlands & Backyards' },
    { id: 'mountains-high-country', name: 'Mountains & High Country' },
  ] },
  { id: 'crystals-stones', name: 'Crystals & Stones', expansions: [{ id: 'hidden-treasures', name: 'Hidden Treasures' }] },
  { id: 'sacred-messengers', name: 'Angels & Sacred Messengers', expansions: [] },
  { id: 'inner-alchemist', name: 'Inner Alchemist', expansions: [] },
  { id: 'language-of-flowers', name: 'The Language of Flowers', expansions: [] },
  { id: 'love-connection', name: 'Love & Connection', expansions: [] },
  { id: 'shadow-garden', name: 'Shadow Garden', expansions: [] },
];
const FREE_DECK_EXPANSIONS = [
  { deck: { id: 'saints', name: 'Catholic Saints' }, id: 'hidden-light', name: 'Hidden Light' },
  { deck: { id: 'hindu-deities', name: 'Hindu Deities' }, id: 'sacred-presence', name: 'Sacred Presence' },
];

const ITEMS = [];
for (const d of PAID_DECKS) {
  ITEMS.push({ lookupKey: `deck_${key(d.id)}`, name: `${d.name} Deck`, amount: DECK, image: back(d.id), metadata: { app: 'wealspring', deckId: d.id } });
  for (const x of d.expansions) {
    ITEMS.push({ lookupKey: `expansion_${key(x.id)}`, name: `${x.name} Expansion (${d.name})`, amount: EXPANSION, image: back(d.id, x.id), metadata: { app: 'wealspring', deckId: x.id, parentDeck: d.id } });
  }
  if (d.expansions.length) {
    ITEMS.push({
      lookupKey: `deck_${key(d.id)}_complete`,
      name: `${d.name}, Complete (deck + ${d.expansions.length} expansion${d.expansions.length === 1 ? '' : 's'})`,
      amount: DECK + PER_EXPANSION_IN_COMPLETE * d.expansions.length,
      image: back(d.id),
      metadata: { app: 'wealspring', deckIds: [d.id, ...d.expansions.map((x) => x.id)].join(',') },
    });
  }
}
for (const x of FREE_DECK_EXPANSIONS) {
  ITEMS.push({ lookupKey: `expansion_${key(x.id)}`, name: `${x.name} Expansion (${x.deck.name})`, amount: EXPANSION, image: back(x.deck.id, x.id), metadata: { app: 'wealspring', deckId: x.id, parentDeck: x.deck.id } });
}
ITEMS.push(
  { lookupKey: 'wealspring_founders_monthly', product: 'Wealspring Founders', name: 'Wealspring Founders', amount: 399, interval: 'month' },
  { lookupKey: 'wealspring_founders_annual', product: 'Wealspring Founders', name: 'Wealspring Founders', amount: 3899, interval: 'year' },
  { lookupKey: 'bundle_founders_monthly', product: 'Whisp + Wealspring Founders', name: 'Whisp + Wealspring Founders', amount: 599, interval: 'month' },
  { lookupKey: 'bundle_founders_annual', product: 'Whisp + Wealspring Founders', name: 'Whisp + Wealspring Founders', amount: 4799, interval: 'year' },
);

const money = (c, interval) => `$${(c / 100).toFixed(2)}${interval ? `/${interval}` : ''}`;
const productCache = new Map();

async function findProduct(name) {
  if (productCache.has(name)) return productCache.get(name);
  const found = (await stripe.products.search({ query: `name:'${name.replace(/'/g, "\\'")}' AND active:'true'` })).data[0] || null;
  productCache.set(name, found);
  return found;
}

console.log(`Stripe ${mode} · ${apply ? 'applying' : 'dry run'}\n`);
let changes = 0;
for (const it of ITEMS) {
  const [current] = (await stripe.prices.list({ lookup_keys: [it.lookupKey], active: true, expand: ['data.product'], limit: 1 })).data;
  const right = current && current.unit_amount === it.amount && current.currency === 'usd'
    && (current.recurring?.interval || null) === (it.interval || null);
  const productName = it.product || it.name;
  let product = current?.product && typeof current.product === 'object' && !current.product.deleted ? current.product : await findProduct(productName);
  const needsImage = it.image && product && !(product.images || []).includes(it.image);

  if (right && !needsImage) { console.log(`= ${it.lookupKey}: ${money(it.amount, it.interval)}`); continue; }
  changes++;
  const what = !current ? 'new' : !right ? `${money(current.unit_amount, current.recurring?.interval)} → ${money(it.amount, it.interval)}` : 'card back image';
  console.log(`${apply ? '+' : '·'} ${it.lookupKey}: ${productName}, ${money(it.amount, it.interval)} (${what})`);
  if (!apply) continue;

  if (!product) {
    product = await stripe.products.create({ name: productName, metadata: it.metadata || {}, ...(it.image ? { images: [it.image] } : {}) });
    productCache.set(productName, product);
  } else if (needsImage) {
    product = await stripe.products.update(product.id, { images: [it.image] });
  }
  if (!right) {
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      unit_amount: it.amount,
      lookup_key: it.lookupKey,
      transfer_lookup_key: true,
      ...(it.interval ? { recurring: { interval: it.interval } } : {}),
    });
    // One-time prices are replaced outright; founders' old recurring prices
    // stay active so existing subscribers keep theirs (and still count).
    if (current && !current.recurring) {
      // A product's default price can't be archived, so the new one takes its place first.
      await stripe.products.update(product.id, { default_price: price.id });
      await stripe.prices.update(current.id, { active: false });
    }
    console.log(`  → ${price.id}`);
  }
}
console.log(changes ? (apply ? '\nDone.' : '\nNothing changed. Run again with --apply to make the changes marked ·') : '\nEverything already matches.');
