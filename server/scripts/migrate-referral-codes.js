// Run once before launch: node scripts/migrate-referral-codes.js

require('dotenv').config();
const mongoose = require('mongoose');
const Buyer  = require('../src/models/Buyer');
const Seller = require('../src/models/Seller');

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCode() {
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');

  const buyers = await Buyer.find({ referralCode: { $exists: false } });
  console.log(`Buyers without code: ${buyers.length}`);
  for (const buyer of buyers) {
    let code, exists = true;
    while (exists) {
      code = generateCode();
      exists = !!(await Buyer.exists({ referralCode: code }));
    }
    await Buyer.updateOne({ _id: buyer._id }, { $set: { referralCode: code } });
  }

  const sellers = await Seller.find({ referralCode: { $exists: false } });
  console.log(`Sellers without code: ${sellers.length}`);
  for (const seller of sellers) {
    let code, exists = true;
    while (exists) {
      code = generateCode();
      exists = !!(await Buyer.exists({ referralCode: code })) ||
               !!(await Seller.exists({ referralCode: code }));
    }
    await Seller.updateOne({ _id: seller._id }, { $set: { referralCode: code } });
  }

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch(console.error);
