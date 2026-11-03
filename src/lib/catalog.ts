// What Wealspring sells on the web, and the decks that are free for everyone.
// Prices are NOT written here: each item names a Stripe Price, and pages read
// the amount from Stripe, so changing a price happens only in Stripe.
//
// Stripe is shared with Whisp (the Eyes Wide Wellness account), so every
// Checkout session says which apps it's for in metadata.apps: 'wealspring',
// or 'whisp,wealspring' for the founders bundle. Each app's stripeWebhook
// acts on sessions that name it, so a bundle unlocks premium in both.
export const APP = 'wealspring';
export const BUNDLE_APPS = 'whisp,wealspring';

export const FOUNDER_CAP = 500;

// Founders comes as Wealspring alone, or Whisp + Wealspring (premium in both
// apps, and Wealspring's launch expansions). Both count toward FOUNDER_CAP.
export const FOUNDERS_PRODUCTS = {
  wealspring: {
    name: 'Wealspring',
    monthly: import.meta.env.STRIPE_FOUNDERS_MONTHLY_PRICE,
    annual: import.meta.env.STRIPE_FOUNDERS_ANNUAL_PRICE,
  },
  bundle: {
    name: 'Wealspring + Whisp',
    monthly: import.meta.env.STRIPE_BUNDLE_MONTHLY_PRICE,
    annual: import.meta.env.STRIPE_BUNDLE_ANNUAL_PRICE,
  },
} as const;
export type FoundersProduct = keyof typeof FOUNDERS_PRODUCTS;
export type FoundersPlan = 'monthly' | 'annual';

export const FOUNDERS_PRICE_IDS = Object.values(FOUNDERS_PRODUCTS)
  .flatMap((p) => [p.monthly, p.annual])
  .filter(Boolean) as string[];

// Public card art in Wealspring's Storage bucket (world-readable).
const art = (path: string) =>
  `https://firebasestorage.googleapis.com/v0/b/wealspring.firebasestorage.app/o/${encodeURIComponent(path)}?alt=media`;

// The six launch decks: free for everyone, in the app's order.
// TODO: Tarot's art still lives in Whisp's bucket (see the app's CLAUDE.md);
// switch this URL once it's copied to Wealspring's.
export const FREE_DECKS = [
  { id: 'tarot', name: 'Rider–Waite Tarot', subtitle: 'The Rider–Waite–Smith tradition', cards: 78,
    cover: 'https://firebasestorage.googleapis.com/v0/b/life-signs-be094.firebasestorage.app/o/public%2FtarotCards%2Fthe_high_priestess.webp?alt=media&token=455bd676-a049-452d-9797-889c2ad3c6d6' },
  { id: 'saints', name: 'Catholic Saints', subtitle: 'A deck of holy companions', cards: 60, cover: art('public/decks/saints/saint_francis_with_birds_and_wolf.webp') },
  { id: 'zodiac', name: 'Zodiac & Astrology', subtitle: 'Signs, planets, houses and the moon', cards: 49, cover: art('public/decks/zodiac/antique_leo_constellation_oracle_card.webp') },
  { id: 'archetypes', name: 'Archetypes', subtitle: 'The patterns we live by', cards: 36, cover: art('public/decks/archetypes/the_hero_lifts_the_sun.webp') },
  { id: 'jungian', name: 'Jungian Psychology', subtitle: 'Symbols of the inner life', cards: 48, cover: art('public/decks/jungian/heron_at_the_golden_gates.webp') },
  { id: 'hindu-deities', name: 'Hindu Deities', subtitle: 'Faces of the divine', cards: 36, cover: art('public/decks/hindu-deities/ganesha_a_way_through.webp') },
];

// Decks and expansions for sale. Each id must match the deck's id in the app
// (src/data/decks), where the deck also sets includedWithFounders — founders
// get the expansions that exist at launch; later ones are sold to everyone.
// Empty until the first expansion ships; /decks then shows it with a Buy
// button. Shape:
//   { id: 'runes', name: 'Elder Futhark Runes', subtitle: '…', cards: 24,
//     cover: art('public/decks/runes/…'), priceId: 'price_…',
//     includedWithFounders: true }
export interface Expansion {
  id: string;
  name: string;
  subtitle: string;
  cards: number;
  cover: string;
  priceId: string;
  includedWithFounders: boolean;
}
export const EXPANSIONS: Expansion[] = [];

export const expansionById = (id: string) => EXPANSIONS.find((e) => e.id === id) || null;
