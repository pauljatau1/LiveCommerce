// Product catalogue. The launch category is clothing.
// scripts/seed.js creates these categories on every start, and the AI listing
// helper and the studio offer only these when they exist.
// Size never gets its own field: sellers write it in the title or description.

// Seeded on every start.
const CATALOGUE = [
  {
    major: 'Clothing',
    categories: [
      { name: 'Women', subCategories: ['Dresses', 'Tops', 'Trousers and jeans', 'Skirts', 'Native wear', 'Two-pieces'] },
      { name: 'Men', subCategories: ['Shirts', 'T-shirts and polos', 'Trousers and jeans', 'Native wear', 'Suits'] },
      { name: 'Thrift', subCategories: ["Women's thrift", "Men's thrift", "Kids' thrift"] },
      { name: 'Shoes', subCategories: ['Sneakers', 'Heels', 'Sandals and slides', 'Formal shoes'] },
      { name: 'Bags', subCategories: ['Handbags', 'Backpacks', 'Purses and clutches', 'Travel bags'] },
      { name: 'Accessories', subCategories: ['Jewellery', 'Watches', 'Belts', 'Caps and hats', 'Sunglasses'] },
    ],
  },
];

// The earlier anime and gaming catalogue. No longer seeded; kept for reference.
// Existing databases keep these categories: the seed never deletes anything.
const LEGACY_CATALOGUE = [
  {
    major: 'Anime & Manga',
    categories: [
      { name: 'Figures', subCategories: ['Scale figures', 'Nendoroid and chibi', 'Prize figures', 'Blind boxes'] },
      { name: 'Plushies & Keychains', subCategories: ['Plushies', 'Keychains', 'Acrylic stands'] },
      { name: 'Manga & Comics', subCategories: ['Manga volumes', 'Comics', 'Artbooks'] },
      { name: 'Apparel & Cosplay', subCategories: ['T-shirts and hoodies', 'Cosplay', 'Accessories'] },
      { name: 'Posters & Art', subCategories: ['Posters', 'Prints', 'Wall scrolls'] },
    ],
  },
  {
    major: 'Gaming',
    categories: [
      { name: 'Trading Cards', subCategories: ['Single cards', 'Booster packs', 'Sealed boxes'] },
      { name: 'Gaming Accessories', subCategories: ['Controllers', 'Headsets', 'Keyboards and mice'] },
      { name: 'Game Collectibles', subCategories: ['Figures and statues', 'Replicas', 'Merch'] },
    ],
  },
];

const LAUNCH_CATEGORY_NAMES = CATALOGUE.flatMap((g) => g.categories.map((c) => c.name));

const CONDITIONS = ['New with tags', 'Thrift', 'Fairly used'];

module.exports = { CATALOGUE, LEGACY_CATALOGUE, LAUNCH_CATEGORY_NAMES, CONDITIONS };
