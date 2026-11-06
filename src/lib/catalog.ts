// What Wealspring sells on the web, and the decks that come free.
// Prices are NOT written here: each item names a Stripe Price by its lookup
// key (the same key in the sandbox and live), and pages read the Price from
// Stripe. The amounts live in scripts/stripe-sync-catalog.mjs, which creates
// and updates the Prices (decks $3.99, expansions $1.99, a deck with all its
// expansions = the deck + $1 per expansion).
//
// Stripe is shared with Whisp (the Eyes Wide Wellness account), so every
// Checkout session says which apps it's for in metadata.apps: 'wealspring',
// or 'whisp,wealspring' for the founders bundle. Each app's stripeWebhook
// acts on sessions that name it, so a bundle unlocks premium in both.
export const APP = 'wealspring';
export const BUNDLE_APPS = 'whisp,wealspring';

export const FOUNDER_CAP = 500;

// Founders comes as Wealspring alone, or Whisp + Wealspring (premium in both
// apps, and every deck and expansion here). Both count toward FOUNDER_CAP,
// and the bundle counts toward Whisp's 500 too (checked at checkout).
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
const back = (deckId: string, expansionId?: string) =>
  art(`public/decks/${deckId}/card-back${expansionId ? `-${expansionId}` : ''}.webp`);
const thumbs = (deckId: string, ids: string[]) => ids.map((id) => art(`public/decks/${deckId}/thumbs/${id}.webp`));

// Every deck, in the app's order, with its expansions. Ids must match the
// app's (src/data/decks), since the webhook adds them to the buyer's
// ownedDecks. A paid deck has a lookupKey; one with expansions can also be
// bought complete (lookupKey + '_complete'). Founders get every paid deck
// and expansion here.
export interface Expansion {
  id: string;
  name: string;
  subtitle: string;
  cards: number;
  cover: string;
  samples: string[];
  lookupKey: string;
}
export interface Deck {
  id: string;
  name: string;
  subtitle: string;
  cards: number;
  cover: string;
  samples: string[];
  free: boolean;
  lookupKey?: string;
  expansions: Expansion[];
}

export const DECKS: Deck[] = [
  {
    id: "tarot", name: "Rider–Waite Tarot", subtitle: "The Rider–Waite–Smith tradition", cards: 78,
    cover: back("tarot"), samples: thumbs("tarot", []),
    free: true,
    expansions: [],
  },
  {
    id: "saints", name: "Catholic Saints", subtitle: "A deck of holy companions", cards: 60,
    cover: back("saints"), samples: thumbs("saints", ["saint_francis_with_birds_and_wolf", "saint_therese_among_the_roses", "joan_of_arc_with_sacred_standard"]),
    free: true,
    expansions: [
      { id: "hidden-light", name: "Hidden Light", subtitle: "Saint Martin of Tours, Saint Mechthild and Saint Pio", cards: 3,
        cover: back("saints", "hidden-light"), samples: thumbs("saints", ["saint_martin_of_tours", "saint_mechthild", "saint_pio"]), lookupKey: "expansion_hidden_light" },
    ],
  },
  {
    id: "zodiac", name: "Zodiac & Astrology", subtitle: "Signs, planets, houses and the moon", cards: 49,
    cover: back("zodiac"), samples: thumbs("zodiac", ["antique_leo_constellation_oracle_card", "full_moon_over_cosmic_lotus", "venus_mirror_rose_and_doves"]),
    free: true,
    expansions: [],
  },
  {
    id: "archetypes", name: "Archetypes", subtitle: "The patterns we live by", cards: 36,
    cover: back("archetypes"), samples: thumbs("archetypes", ["the_hero_lifts_the_sun", "the_creators_cosmic_bloom", "the_mystic"]),
    free: true,
    expansions: [],
  },
  {
    id: "jungian", name: "Jungian Psychology", subtitle: "Symbols of the inner life", cards: 48,
    cover: back("jungian"), samples: thumbs("jungian", ["heron_at_the_golden_gates", "the_shadow", "golden_scarab_of_synchronicity"]),
    free: true,
    expansions: [],
  },
  {
    id: "hindu-deities", name: "Hindu Deities", subtitle: "Faces of the divine", cards: 36,
    cover: back("hindu-deities"), samples: thumbs("hindu-deities", ["ganesha_a_way_through", "lakshmi_on_a_lotus", "saraswati_by_the_lotus_river"]),
    free: true,
    expansions: [
      { id: "sacred-presence", name: "Sacred Presence", subtitle: "The Mahavidyas, the forms of Durga and the gods’ companions", cards: 18,
        cover: back("hindu-deities", "sacred-presence"), samples: thumbs("hindu-deities", ["lalita_tripura_sundari", "bhuvaneshvari", "matangi"]), lookupKey: "expansion_sacred_presence" },
    ],
  },
  {
    id: "dream-archetypes", name: "Dream Archetypes", subtitle: "The places and scenes of our dreams", cards: 38,
    cover: back("dream-archetypes"), samples: thumbs("dream-archetypes", ["the_childhood_home", "the_labyrinth", "the_night_sky"]),
    free: false, lookupKey: "deck_dream_archetypes",
    expansions: [],
  },
  {
    id: "animal-symbolism", name: "Animal Symbolism", subtitle: "What the animals have long stood for", cards: 40,
    cover: back("animal-symbolism"), samples: thumbs("animal-symbolism", ["gray_wolf", "monarch_butterfly", "great_horned_owl"]),
    free: false, lookupKey: "deck_animal_symbolism",
    expansions: [
      { id: "desert-canyon", name: "Desert & Canyon", subtitle: "Creatures of the desert and the canyon", cards: 18,
        cover: back("animal-symbolism", "desert-canyon"), samples: thumbs("animal-symbolism", ["arizona_bark_scorpion", "burrowing_owl", "cactus_wren"]), lookupKey: "expansion_desert_canyon" },
      { id: "woodlands-backyards", name: "Woodlands & Backyards", subtitle: "Creatures of the woods and the garden", cards: 18,
        cover: back("animal-symbolism", "woodlands-backyards"), samples: thumbs("animal-symbolism", ["american_robin", "black_capped_chickadee", "carolina_wren"]), lookupKey: "expansion_woodlands_backyards" },
      { id: "mountains-high-country", name: "Mountains & High Country", subtitle: "Creatures of the peaks and high meadows", cards: 18,
        cover: back("animal-symbolism", "mountains-high-country"), samples: thumbs("animal-symbolism", ["moose", "american_badger", "american_marten"]), lookupKey: "expansion_mountains_high_country" },
    ],
  },
  {
    id: "crystals-stones", name: "Crystals & Stones", subtitle: "The lore of stones", cards: 36,
    cover: back("crystals-stones"), samples: thumbs("crystals-stones", ["amethyst", "labradorite", "rose_quartz"]),
    free: false, lookupKey: "deck_crystals_stones",
    expansions: [
      { id: "hidden-treasures", name: "Hidden Treasures", subtitle: "Eighteen rarer stones and their lore", cards: 18,
        cover: back("crystals-stones", "hidden-treasures"), samples: thumbs("crystals-stones", ["angelite", "apophyllite", "aragonite"]), lookupKey: "expansion_hidden_treasures" },
    ],
  },
  {
    id: "sacred-messengers", name: "Angels & Sacred Messengers", subtitle: "Archangels, guardians and holy messengers", cards: 40,
    cover: back("sacred-messengers"), samples: thumbs("sacred-messengers", ["archangel_michael", "the_guardian_angel", "the_white_feather"]),
    free: false, lookupKey: "deck_sacred_messengers",
    expansions: [],
  },
  {
    id: "inner-alchemist", name: "Inner Alchemist", subtitle: "The stages of inner transformation", cards: 36,
    cover: back("inner-alchemist"), samples: thumbs("inner-alchemist", ["the_philosophers_stone", "the_crucible", "the_inner_marriage"]),
    free: false, lookupKey: "deck_inner_alchemist",
    expansions: [],
  },
  {
    id: "language-of-flowers", name: "The Language of Flowers", subtitle: "What flowers have long been said to mean", cards: 36,
    cover: back("language-of-flowers"), samples: thumbs("language-of-flowers", ["rose", "forget_me_not", "snowdrop"]),
    free: false, lookupKey: "deck_language_of_flowers",
    expansions: [],
  },
  {
    id: "love-connection", name: "Love & Connection", subtitle: "The ways we love and are loved", cards: 37,
    cover: back("love-connection"), samples: thumbs("love-connection", ["the_open_heart", "trust", "tenderness"]),
    free: false, lookupKey: "deck_love_connection",
    expansions: [],
  },
  {
    id: "shadow-garden", name: "Shadow Garden", subtitle: "Tending what grows in the dark", cards: 36,
    cover: back("shadow-garden"), samples: thumbs("shadow-garden", ["the_hidden_garden", "the_night_bloom", "the_whole_garden"]),
    free: false, lookupKey: "deck_shadow_garden",
    expansions: [],
  },
];

export const deckById = (id: string) => DECKS.find((d) => d.id === id) || null;
export const completeLookupKey = (deck: Deck) => `${deck.lookupKey}_complete`;

// What a Buy button can ask for: a paid deck, an expansion, or a paid deck
// with all its expansions ('<deckId>:complete'). ids are what the buyer gets.
export function purchasable(id: string): { lookupKey: string; ids: string[]; name: string } | null {
  const [deckId, complete] = id.split(':');
  for (const d of DECKS) {
    if (d.id === deckId && d.lookupKey) {
      if (complete === 'complete' && d.expansions.length) {
        return { lookupKey: completeLookupKey(d), ids: [d.id, ...d.expansions.map((x) => x.id)], name: `${d.name}, complete` };
      }
      if (!complete) return { lookupKey: d.lookupKey, ids: [d.id], name: d.name };
    }
    const x = d.expansions.find((e) => e.id === id);
    if (x) return { lookupKey: x.lookupKey, ids: [x.id], name: x.name };
  }
  return null;
}
