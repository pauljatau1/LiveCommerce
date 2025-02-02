const mongoose = require('mongoose');
const Seller = require('../src/models/Seller');
require('dotenv').config();

async function generateUniqueAgoraUid() {
  let uid;
  let exists;
  
  do {
    const ts = Date.now().toString().substr(0, 9);
    const rand = Math.floor(Math.random() * 9000) + 1000;
    uid = parseInt(ts + rand, 10);
    exists = await Seller.findOne({ agoraUid: uid }).lean();
  } while (exists);

  return uid;
}

async function migrateUids() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  const sellers = await Seller.find({ agoraUid: { $exists: false } }).lean();
  
  for (const seller of sellers) {
    const newUid = await generateUniqueAgoraUid();
    
    await Seller.updateOne(
      { _id: seller._id },
      { $set: { agoraUid: newUid } }
    );
    
    console.log(`Updated UID for seller ${seller._id}`);
  }

  process.exit(0);
}

migrateUids().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 