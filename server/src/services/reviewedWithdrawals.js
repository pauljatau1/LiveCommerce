// Review is the launch default. Legacy admin controllers remain available for old records.
const mongoose=require('mongoose');
const Withdrawal=require('../models/Withdrawal');
const Seller=require('../models/Seller');
const Transaction=require('../models/Transaction');
const paystack=require('../config/paystack');
const fail=(status,message)=>Object.assign(new Error(message),{status});
async function transaction(fn){const session=await mongoose.startSession();try{let result;await session.withTransaction(async()=>{result=await fn(session);});return result;}finally{await session.endSession();}}
async function request(sellerId,amount){
 if(!Number.isInteger(amount)||amount<1000)throw fail(400,'The smallest withdrawal is ₦1,000');
 const w=await transaction(async session=>{
  const seller=await Seller.findById(sellerId).session(session);
  if(!seller)throw fail(404,'Your store could not be found.');
  const bank=seller.bankDetails;
  if(!seller.isBankVerified||!bank?.bankIdentifierCode||!bank.accountNumber||!bank.accountName)throw fail(400,'Add and verify your bank account first.');
  const pending=await Withdrawal.aggregate([{$match:{seller:seller._id,status:{$in:['pending','processing']}}},{$group:{_id:null,total:{$sum:'$amount'}}}]).session(session);
  if(amount>seller.walletBalance-(pending[0]?.total || 0))throw fail(400,'That amount is above your available balance.');
  // Serialize requests on the seller, including concurrent requests in separate sessions.
  const locked=await Seller.updateOne({_id:seller._id},{$inc:{withdrawalRevision:1}},{session});
  if(!locked.modifiedCount)throw fail(409,'Please try the withdrawal again.');
  const [created]=await Withdrawal.create([{seller:sellerId,amount,bankDetails:bank,payoutFlow:'review',notes:[{content:'Withdrawal requested in the studio',addedBy:'seller'}]}],{session});
  return created;
 });
 await notifyRequest(w);
 return w;
}
async function notifyRequest(w){
 try{
  if(process.env.ADMIN_ALERT_EMAIL)await require('./email/mailer').send({to:process.env.ADMIN_ALERT_EMAIL,subject:'New withdrawal request',text:`A seller requested ₦${w.amount.toLocaleString('en-NG')}. Review withdrawal ${w._id} before paying.`,html:`<p>A seller requested ₦${w.amount.toLocaleString('en-NG')}.</p><p>Review withdrawal ${w._id} before paying.</p>`,tags:[{name:'type',value:'withdrawal-request'}],idempotencyKey:`withdrawal-request/${w._id}`});
  else console.warn('[withdrawal] ADMIN_ALERT_EMAIL is missing. Request saved for review.');
 }catch{console.warn('[withdrawal] Request saved; admin alert could not be sent.');}
}
async function approve(id,adminId){
 if(process.env.LEGACY_WITHDRAWAL_REQUESTS==='true')throw fail(409,'Switch off the legacy payout flow before approving reviewed withdrawals.');
 if(!process.env.PAYSTACK_SECRET_KEY)throw fail(503,'Payouts are not configured yet. Please try again later.');
 const reference=`withdrawal_${id}`;
 const w=await transaction(async session=>{
  const pending=await Withdrawal.findOne({_id:id,status:'pending','paymentInfo.transferReference':{$in:[null,'']}}).session(session).lean();
  if(!pending)throw fail(409,'This withdrawal has already been reviewed or is being processed.');
  const seller=await Seller.findById(pending.seller).session(session).lean();
  const inflight=await Withdrawal.aggregate([{$match:{seller:pending.seller,status:'processing'}},{$group:{_id:null,total:{$sum:'$amount'}}}]).session(session);
  if(!seller||!Number.isFinite(seller.walletBalance)||!Number.isFinite(pending.amount)||pending.amount<=0||pending.amount+(inflight[0]?.total || 0)>seller.walletBalance)throw fail(400,'This withdrawal exceeds the seller’s unreserved balance. Review the other requests first.');
  await Seller.updateOne({_id:seller._id},{$inc:{withdrawalRevision:1}},{session});
  return Withdrawal.findOneAndUpdate({_id:id,status:'pending'},{$set:{payoutFlow:'review',status:'processing','paymentInfo.transferReference':reference,'paymentInfo.initiatedAt':new Date()},$push:{notes:{content:`Approved by admin ${adminId}`,addedBy:'admin'}}},{new:true,session}).lean();
 });
 let transferStarted=false;
 try{
  const recipient=await paystack.post('/transferrecipient',{type:'nuban',name:w.bankDetails.accountName,account_number:w.bankDetails.accountNumber,bank_code:w.bankDetails.bankIdentifierCode,currency:'NGN'});
  const code=recipient.data?.data?.recipient_code;
  if(recipient.data?.status===false||!code)throw fail(502,'The bank account could not be prepared for payment.');
  await Withdrawal.updateOne({_id:id,status:'processing'},{$set:{'paymentInfo.transferRecipientCode':code}});
  transferStarted=true;
  const response=await paystack.post('/transfer',{source:'balance',amount:Math.round(w.amount*100),recipient:code,reference,currency:'NGN',reason:`Withdrawal ${w.reference}`});
  if(response.data?.status!==true)throw fail(502,'Paystack could not confirm the transfer.');
  await Withdrawal.updateOne({_id:id},{$set:{'paymentInfo.paystackStatus':response.data.data?.status || 'pending'}});
  // Even an immediate 'success' awaits the signed webhook or explicit verification.
  return Withdrawal.findById(id).lean();
 }catch(error){
  if(!transferStarted)await Withdrawal.updateOne({_id:id,status:'processing'},{$set:{status:'failed','paymentInfo.failureReason':'Could not prepare the bank account.'}});
  // A timeout may follow an accepted transfer: keep it processing, never send twice.
  throw fail(502,transferStarted?'Waiting for Paystack confirmation. Do not send this withdrawal again.':'Couldn’t prepare the bank account. Check it before requesting again.');
 }
}
async function reject(id,adminId,reason){
 if(process.env.LEGACY_WITHDRAWAL_REQUESTS==='true')throw fail(409,'Switch off the legacy payout flow before reviewing withdrawals.');
 const w=await Withdrawal.findOneAndUpdate({_id:id,status:'pending','paymentInfo.transferReference':{$in:[null,'']}},{$set:{payoutFlow:'review',status:'rejected',processedDate:new Date()},$push:{notes:{content:`Rejected by admin ${adminId}: ${String(reason || 'Please check your bank details.').slice(0,250)}`,addedBy:'admin'}}},{new:true}).lean();
 if(!w)throw fail(409,'Only a pending withdrawal can be rejected.');return w;
}
async function webhook(event,data){
 if(typeof data?.reference!=='string')return false;
 const exists=await Withdrawal.exists({payoutFlow:'review','paymentInfo.transferReference':data.reference});
 if(!exists)return false;
 await transaction(async session=>{
  const w=await Withdrawal.findById(exists._id).session(session);
  if(event==='transfer.success'&&w.status==='processing'){
   if(data.amount!=null&&Number(data.amount)!==Math.round(w.amount*100))throw fail(400,'The transfer amount did not match this withdrawal.');
   if(data.currency&&data.currency!=='NGN')throw fail(400,'The transfer currency did not match this withdrawal.');
   const updated=await Seller.updateOne({_id:w.seller,walletBalance:{$gte:w.amount}},{$inc:{walletBalance:-w.amount}},{session});
   if(updated.modifiedCount!==1)throw fail(409,'The seller balance needs reviewing before confirming this transfer.');
   w.status='completed';w.processedDate=new Date();w.paymentInfo.completedAt=new Date();w.paymentInfo.paystackStatus='success';
   await Transaction.create([{seller:w.seller,type:'withdrawal',amount:w.amount,status:'completed',bankDetails:w.bankDetails,description:`Withdrawal ${w.reference}`,paymentReference:data.reference}],{session});
  }else if(event==='transfer.failed'&&w.status==='processing'){
   w.status='failed';w.paymentInfo.failureReason='Paystack could not complete the transfer.';
  }else if(event==='transfer.reversed'&&['completed','processing'].includes(w.status)){
   if(w.status==='completed'){
    await Seller.updateOne({_id:w.seller},{$inc:{walletBalance:w.amount}},{session});
    await Transaction.updateOne({seller:w.seller,type:'withdrawal',paymentReference:data.reference},{$set:{status:'failed',description:'Withdrawal reversed; funds returned to your balance.'}},{session});
   }
   w.status='reversed';
  }else return; // Duplicate or out-of-order notification: do not debit/refund again.
  await w.save({session});
 });
 return true;
}
async function verify(id){
 const w=await Withdrawal.findOne({_id:id,payoutFlow:'review'}).lean();
 if(!w?.paymentInfo?.transferReference)throw fail(409,'This withdrawal has not been sent for payment.');
 const response=await paystack.get(`/transfer/verify/${encodeURIComponent(w.paymentInfo.transferReference)}`);
 if(response.data?.status!==true)throw fail(502,'Paystack could not confirm the transfer yet.');
 const data=response.data.data;
 if(['success','failed','reversed'].includes(data.status))await webhook(`transfer.${data.status}`,{...data,reference:w.paymentInfo.transferReference});
 return Withdrawal.findById(id).lean();
}
module.exports={request,approve,reject,webhook,verify,notifyRequest};
