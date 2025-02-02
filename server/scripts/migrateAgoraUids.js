const mongoose = require('mongoose');
const Seller = require('../src/models/Seller');
require('dotenv').config();

async function generateUniqueAgoraUid() {
  const min = 100000;
  const max = 4294967295;
  let uid, exists, attempts = 0;

  do {
    uid = Math.floor(min + Math.random() * (max - min));
    exists = await Seller.findOne({ agoraUid: uid }).lean();
    attempts++;
    
    if (attempts > 10) {
      throw new Error('Failed to generate unique UID after 10 attempts');
    }
  } while (exists);

  return uid;
}

async function migrateUids() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const sellers = await Seller.find({
    $or: [
      { agoraUid: { $exists: false } },
      { agoraUid: { $gt: 4294967295 } }
    ]
  }).lean();

  for (const seller of sellers) {
    let newUid;
    let attempts = 0;
    
    do {
      newUid = Math.floor(100000 + Math.random() * (4294967295 - 100000));
      const exists = await Seller.findOne({ agoraUid: newUid }).lean();
      if (!exists) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      console.error(`Failed to generate unique UID for seller ${seller._id}`);
      continue;
    }

    await Seller.updateOne(
      { _id: seller._id },
      { $set: { agoraUid: newUid } }
    );
    
    console.log(`Updated UID for seller ${seller._id} to ${newUid}`);
  }

  process.exit(0);
}

migrateUids().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 