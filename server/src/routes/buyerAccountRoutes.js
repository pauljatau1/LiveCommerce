// Profile actions used on the shop and inside a live show's bank-consent sheet.
const router = require('express').Router();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const Buyer = require('../models/Buyer');
const {verifyToken,isBuyer} = require('../middlewares/authMiddleware');
router.put('/profile/phone',verifyToken,isBuyer, async (req,res)=>{
  const {phoneDigits,phoneProblem}=require('../utils/phone');
  const phone=phoneDigits(req.body?.phoneNumber);
  if(phoneProblem(phone))return res.status(400).json({message:phoneProblem(phone)});
  try {
    const buyer=await Buyer.findByIdAndUpdate(req.user.id,{$set:{phoneNumber:phone,phoneVerified:false}},{new:true});
    if(!buyer)return res.status(404).json({message:'Please sign in again.'});
    res.json({success:true,phoneNumber:phone});
  }catch{return res.status(500).json({message:'Couldn’t save your phone number. Please try again.'});}
});
router.put('/profile/courier-phone',verifyToken,isBuyer,async(req,res)=>{
 const {phoneDigits,phoneProblem}=require('../utils/phone'),phone=phoneDigits(req.body?.phoneNumber);
 if(phoneProblem(phone))return res.status(400).json({message:phoneProblem(phone)});
 if(!require('mongoose').isValidObjectId(req.body?.addressId))return res.status(400).json({message:'Choose your delivery address first.'});
 try{
  const buyer=await Buyer.findOneAndUpdate({_id:req.user.id,'shippingAddresses._id':req.body.addressId},{$set:{phoneNumber:phone,phoneVerified:false,'shippingAddresses.$.phoneNumber':phone},$unset:{'shippingAddresses.$.shipbubbleCode':1,'shippingAddresses.$.shipbubbleKey':1}},{new:true});
  if(!buyer)return res.status(404).json({message:'We couldn’t find that delivery address.'});
  res.json({success:true,phoneNumber:phone});
 }catch{res.status(500).json({message:'Couldn’t save your courier phone number. Please try again.'});}
});
router.post('/profile/change-password',verifyToken,isBuyer,rateLimit({windowMs:15*60*1000,max:5,keyGenerator:req=>String(req.user.id),message:{message:'Too many tries. Wait 15 minutes before trying again.'}}),async(req,res)=>{
  const {currentPassword,newPassword}=req.body || {};
  if(typeof currentPassword!=='string'||typeof newPassword!=='string'||newPassword.length<8||Buffer.byteLength(newPassword)>72)return res.status(400).json({message:'Enter your current password and a new password of 8–72 characters.'});
  try {
    const account=await Buyer.findById(req.user.id).select('+password');
    if(!account?.password || !await bcrypt.compare(currentPassword,account.password))return res.status(400).json({message:'Your current password doesn’t match. Please try again.'});
    const password=await bcrypt.hash(newPassword,10);
    const updated=await Buyer.findOneAndUpdate({_id:account._id,password:account.password},{$set:{password},$inc:{authVersion:1}},{new:true});
    if(!updated)return res.status(409).json({message:'Your password changed. Please sign in again.'});
    const token=await require('../services/auth/sessions').issueToken(updated._id,'Buyer','500w',updated.authVersion);
    try {
      const {authEmail}=require('../utils/authEmail');
      await require('../services/termiiEmailService').sendRawHTMLEmail({email:updated.email,idempotencyKey:`password-changed/${updated._id}-${updated.authVersion}`,...authEmail({}, {forceCurrent:true,kind:'passwordChanged',audience:'buyer',name:updated.firstName,email:updated.email})});
    }catch{console.warn('[profile] Could not send password-change email.');}
    res.json({success:true,token,message:'Password changed. Other devices have been signed out.'});
  }catch{return res.status(500).json({message:'Couldn’t change your password. Please try again.'});}
});
module.exports=router;
