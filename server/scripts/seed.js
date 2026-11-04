// Seeds a fresh database with product categories and the first admin account.
// Safe to run more than once: existing records are left as they are.
//
//   MONGODB_URI=... ADMIN_EMAILS=you@example.com \
//   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_USERNAME=paul SEED_ADMIN_PASSWORD=... \
//   npm run seed
//
// The admin step is skipped when the SEED_ADMIN_* settings are not set.
// The server also runs this at startup (see server.js), so on hosts without a
// shell, set SEED_ADMIN_* once, deploy, then remove SEED_ADMIN_PASSWORD.

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const MajorCategory = require('../src/models/MajorCategory');
const Admin = require('../src/models/Admin');
const { isAllowedAdminEmail } = require('../src/config/admins');

const CATALOGUE = [
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

const seedCategories = async () => {
  let created = 0;
  for (const group of CATALOGUE) {
    const ids = [];
    for (const { name, subCategories } of group.categories) {
      let category = await Category.findOne({ name });
      if (!category) {
        category = await Category.create({ name, subCategories: subCategories.map((sub) => ({ name: sub })) });
        created += 1;
      }
      ids.push(category._id);
    }
    const major = await MajorCategory.findOne({ name: group.major });
    if (!major) {
      await MajorCategory.create({ name: group.major, categories: ids });
      created += 1;
    } else {
      const missing = ids.filter((id) => !major.categories.some((c) => c.equals(id)));
      if (missing.length) {
        major.categories.push(...missing);
        await major.save();
      }
    }
  }
  return created;
};

const seedAdmin = async () => {
  const email = process.env.SEED_ADMIN_EMAIL;
  const username = process.env.SEED_ADMIN_USERNAME;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !username || !password) return 'skipped (SEED_ADMIN_* not set)';
  if (!isAllowedAdminEmail(email)) return `skipped (${email} is not listed in ADMIN_EMAILS)`;
  if (password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) return `exists (${existing.email})`;
  await Admin.create({ email: email.toLowerCase(), username, password });
  return `created (${email.toLowerCase()})`;
};

// Seeds using the current database connection (used by the server at startup)
const seedDatabase = async (log = console) => {
  const created = await seedCategories();
  const admin = await seedAdmin();
  log.info(`[seed] categories: ${created} created; admin: ${admin}`);
  return { created, admin };
};

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);
  const created = await seedCategories();
  const admin = await seedAdmin();
  console.log(`Categories: ${created} created, ${await Category.countDocuments()} categories in total`);
  console.log(`Admin: ${admin}`);
};

if (require.main === module) {
  run()
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
      console.error(`Seed failed: ${error.message}`);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = { run, seedDatabase, CATALOGUE };
