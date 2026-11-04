// What Wealspring sells on the web, and the decks that are free for everyone.
// Prices are NOT written here: each item names a Stripe Price by its lookup
// key (the same key in the sandbox and live), and pages read the Price from
// Stripe, so changing a price happens only in Stripe: create the new Price
// and move the lookup key onto it.
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
    monthly: 'wealspring_founders_monthly',
    annual: 'wealspring_founders_annual',
  },
  bundle: {
    name: 'Wealspring + Whisp',
    monthly: 'bundle_founders_monthly',
    annual: 'bundle_founders_annual',
  },
} as const;
export type FoundersProduct = keyof typeof FOUNDERS_PRODUCTS;
export type FoundersPlan = 'monthly' | 'annual';

export const FOUNDERS_LOOKUP_KEYS: string[] = Object.values(FOUNDERS_PRODUCTS)
  .flatMap((p) => [p.monthly, p.annual]);

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

// Decks and expansions for sale. Each id must match the app's (src/data/decks:
// a deck's id, or an expansion's id in its deck's expansions), since the
// webhook adds it to the buyer's ownedDecks. An expansion names its deck in
// parent, and needs that deck in the app. Founders get everything here
// (includedWithFounders), as they all exist at launch; later releases are
// sold to everyone.
export interface Expansion {
  id: string;
  name: string;
  subtitle: string;
  cards: number;
  cover: string;
  lookupKey: string;
  includedWithFounders: boolean;
  parent?: { id: string; name: string };
}
const SAINTS = { id: 'saints', name: 'Catholic Saints' };
const ANIMALS = { id: 'animal-symbolism', name: 'Animal Symbolism' };
export const EXPANSIONS: Expansion[] = [
  { id: 'dream-archetypes', name: 'Dream Archetypes', subtitle: 'The places and scenes of our dreams', cards: 38,
    cover: art('public/decks/dream-archetypes/the_childhood_home.webp'), lookupKey: 'deck_dream_archetypes', includedWithFounders: true },
  { id: 'animal-symbolism', name: 'Animal Symbolism', subtitle: 'What the animals have long stood for', cards: 40,
    cover: art('public/decks/animal-symbolism/gray_wolf.webp'), lookupKey: 'deck_animal_symbolism', includedWithFounders: true },
  { id: 'crystals-stones', name: 'Crystals & Stones', subtitle: 'The lore of stones', cards: 36,
    cover: art('public/decks/crystals-stones/amethyst.webp'), lookupKey: 'deck_crystals_stones', includedWithFounders: true },
  { id: 'hidden-light', name: 'Hidden Light', subtitle: 'Saint Martin of Tours, Saint Mechthild and Saint Pio', cards: 3, parent: SAINTS,
    cover: art('public/decks/saints/saint_pio.webp'), lookupKey: 'expansion_hidden_light', includedWithFounders: true },
  { id: 'desert-canyon', name: 'Desert & Canyon', subtitle: 'Creatures of the desert and the canyon', cards: 18, parent: ANIMALS,
    cover: art('public/decks/animal-symbolism/greater_roadrunner.webp'), lookupKey: 'expansion_desert_canyon', includedWithFounders: true },
  { id: 'woodlands-backyards', name: 'Woodlands & Backyards', subtitle: 'Creatures of the woods and the garden', cards: 18, parent: ANIMALS,
    cover: art('public/decks/animal-symbolism/american_robin.webp'), lookupKey: 'expansion_woodlands_backyards', includedWithFounders: true },
  { id: 'mountains-high-country', name: 'Mountains & High Country', subtitle: 'Creatures of the peaks and high meadows', cards: 18, parent: ANIMALS,
    cover: art('public/decks/animal-symbolism/moose.webp'), lookupKey: 'expansion_mountains_high_country', includedWithFounders: true },
];

export const expansionById = (id: string) => EXPANSIONS.find((e) => e.id === id) || null;
