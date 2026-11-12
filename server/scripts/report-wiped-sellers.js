// Default: print the read-only query plan. Paul reviews before --report on a live DB.
// This tool NEVER changes seller details or guesses a replacement store name.
require('dotenv').config();
const mongoose=require('mongoose');
const missingStore={$or:[{storeName:null},{storeName:''}]};
async function report(db) {
  const rows=[];
  for await (const seller of db.collection('sellers').find(missingStore,{projection:{_id:1,email:1,createdAt:1}})) {
    const [products,streams]=await Promise.all([
      db.collection('products').countDocuments({seller:seller._id}),
      db.collection('streams').countDocuments({seller:seller._id}),
    ]);
    if(products || streams)rows.push({...seller,products,streams,action:'Ask seller to re-enter store details; do not infer values.'});
  }
  return rows;
}
async function main() {
  if(!process.argv.includes('--report')) {
    console.log(JSON.stringify({dryRun:true,readOnly:true,query:missingStore,next:'After Paul approves: node scripts/report-wiped-sellers.js --report'},null,2));return;
  }
  if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI before running the report.');
  try {await mongoose.connect(process.env.MONGODB_URI);console.log(JSON.stringify(await report(mongoose.connection.db),null,2));}
  finally{await mongoose.disconnect();}
}
if(require.main===module)main().catch(()=>{console.error('Couldn’t produce the seller report. Check database access and try again.');process.exitCode=1;});
module.exports={missingStore,report};
