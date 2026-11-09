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

const { CATALOGUE, LEGACY_CATALOGUE, LAUNCH_CATEGORY_NAMES } = require('../src/config/catalogue');

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
// Point every show's share link at the current buyer app (old links went to
// app.auqli.live). Runs on each start, so changing BUYER_APP_URL updates them all.
const fixStreamLinks = async () => {
  const { buyerAppUrl } = require('../src/utils/helpers');
  const Stream = require('../src/models/Stream');
  const base = `${buyerAppUrl()}/live/`;
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const res = await Stream.updateMany(
    { streamLink: { $not: new RegExp(`^${escaped}`) } },
    [{ $set: { streamLink: { $concat: [base, { $toString: '$_id' }] } } }]
  );
  return res.modifiedCount || 0;
};

// Repair show order lists saved without an amount (or with the buyer as an
// object): they made every later save of that show fail validation, e.g.
// showing or hiding a product after the first sale.
const repairShowOrders = async () => {
  const Stream = require('../src/models/Stream');
  const res = await Stream.updateMany(
    { orders: { $elemMatch: { $or: [{ amount: { $exists: false } }, { amount: null }, { 'buyer._id': { $exists: true } }] } } },
    [{
      $set: {
        orders: {
          $map: {
            input: '$orders',
            as: 'o',
            in: {
              $mergeObjects: ['$$o', {
                amount: { $ifNull: ['$$o.amount', { $ifNull: ['$$o.orderDetails.orderTotal', { $ifNull: ['$$o.orderDetails.totalAmount', 0] }] }] },
                buyer: { $cond: [{ $eq: [{ $type: '$$o.buyer' }, 'object'] }, '$$o.buyer._id', '$$o.buyer'] },
              }],
            },
          },
        },
      },
    }]
  );
  return res.modifiedCount || 0;
};

const seedDatabase = async (log = console) => {
  const created = await seedCategories();
  const admin = await seedAdmin();
  const links = await fixStreamLinks();
  const repaired = await repairShowOrders();
  log.info(`[seed] categories: ${created} created; admin: ${admin}; show links updated: ${links}; shows repaired: ${repaired}`);
  return { created, admin, links, repaired };
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

module.exports = { run, seedDatabase, fixStreamLinks, repairShowOrders, CATALOGUE };
