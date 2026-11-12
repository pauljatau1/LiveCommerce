// Studio "Getting started": Your store → Pickup address → Get paid → Finished.
// Mounted at /api/v2/studio/onboarding. Sellers only, scoped to req.user.id.
// The account name for payouts always comes from Paystack, never from the form.
const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, isSeller } = require('../middlewares/authMiddleware');
const bankService = require('../services/bankService');
const { LAUNCH_CATEGORY_NAMES } = require('../config/catalogue');
require('../models/Seller');

const router = express.Router();
router.use(verifyToken, isSeller);

const Seller = () => mongoose.model('Seller');
const clean = (s, max) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
const digits = (s) => String(s || '').replace(/\D/g, '');
const fail = (res, error, fallback) => {
  console.error('[onboarding]', error.message);
  res.status(error.status || 500).json({ success: false, message: error.status ? error.message : fallback });
};
const bad = (res, message) => res.status(400).json({ success: false, message });

const view = (s) => {
  const a = require('../services/serviceArea').pickupAddress(s);
  const b = s.bankDetails || {};
  return {
    serviceArea: require('../services/serviceArea').serviceAreaConfig(),
    store: { storeName: s.storeName || '', aboutStore: s.aboutStore || '', avatar: s.storeAvatar?.url || null, categories: (s.categories || []).map((c) => c.name), done: Boolean(s.storeName) },
    pickup: a.addressLine1 ? { state: a.state, city: a.city, lga: a.lga, latitude:a.latitude, longitude:a.longitude, addressSource:a.addressSource, formattedAddress:a.formattedAddress, addressLine1: a.addressLine1, landmark: a.addressLine2 || '', phone: s.warehouseDetails?.contactNumber || s.phoneNumber || '', done: true } : { done: false, phone: s.warehouseDetails?.contactNumber || s.phoneNumber || '' },
    bank: b.accountNumber ? { bankName: b.bankName, last4: String(b.accountNumber).slice(-4), accountName: b.accountName, done: Boolean(s.isBankVerified) } : { done: false },
    firstName: s.firstName || '',
    categories: LAUNCH_CATEGORY_NAMES,
  };
};

// GET → what's done and what's left
router.get('/', async (req, res) => {
  try {
    const s = await Seller().findById(req.user.id).lean();
    if (!s) return res.status(404).json({ success: false, message: 'Seller not found' });
    res.json({ success: true, ...view(s) });
  } catch (error) { fail(res, error, "Couldn't load your setup. Try again."); }
});

// PUT /store { storeName, aboutStore, categories }
router.put('/store', async (req, res) => {
  const storeName = clean(req.body?.storeName, 60);
  const aboutStore = clean(req.body?.aboutStore, 80);
  const categories = [...new Set((Array.isArray(req.body?.categories) ? req.body.categories : []).filter((c) => LAUNCH_CATEGORY_NAMES.includes(c)))];
  if (storeName.length < 2) return bad(res, 'Add a store name: this is what buyers see on your shows.');
  try {
    const s = await Seller().findByIdAndUpdate(req.user.id, { $set: { storeName, aboutStore, categories: categories.map((name) => ({ name, subCategories: [] })) } }, { new: true }).lean();
    res.json({ success: true, ...view(s) });
  } catch (error) { fail(res, error, "Couldn't save your store. Try again."); }
});

// PUT /pickup { state, city, addressLine1, landmark, phone } → where couriers collect from
router.put('/pickup', async (req, res) => {
  const state = clean(req.body?.state, 60);
  const city = clean(req.body?.city, 60);
  const addressLine1 = clean(req.body?.addressLine1, 160);
  const landmark = clean(req.body?.landmark, 120);
  const {phoneDigits,phoneProblem}=require('../utils/phone');
  const phone = phoneDigits(req.body?.phone);
  if (!require('../services/serviceArea').inServiceArea(state)) return bad(res, require('../services/serviceArea').pickupMessage());
  if (!state || !city || !addressLine1) return bad(res, 'Add your state, area and street address.');
  if (phoneProblem(phone)) return bad(res, phoneProblem(phone));
  try {
    const address = { country: 'NG', state, city, addressLine1, addressLine2: landmark || undefined, ...require('../services/areaDirectory').validateArea({...req.body,state,city,addressLine1}) };
    const s = await Seller().findByIdAndUpdate(req.user.id, {
      $set: {
        'warehouseDetails.address': address,
        'warehouseDetails.contactNumber': phone,
        businessAddress: address,
        hasFilledAddress: true,
        hasFilledBusinessAddress: true,
        phoneNumber: phone,
      },
      $unset: { shipbubbleAddress: 1, pickupValidation:1 }, // checked again with Shipbubble on the next quote
    }, { new: true }).lean();
    res.json({ success: true, ...view(s) });
  } catch (error) { fail(res, error, "Couldn't save the address. Your answers are still here: try again."); }
});

// GET /banks → Nigerian banks (Paystack, cached a day)
router.get('/banks', async (req, res) => {
  try {
    const banks = await bankService.getBankList();
    res.json({ success: true, banks: banks.filter((b) => b.active !== false).map((b) => ({ code: b.code, name: b.name })) });
  } catch (error) { fail(res, error, "Couldn't load the bank list. Check your connection and try again."); }
});

const resolve = async (accountNumber, bankCode) => {
  if (!/^\d{10}$/.test(accountNumber)) { const e = new Error('Account numbers have 10 digits.'); e.status = 400; throw e; }
  if (!bankCode) { const e = new Error('Pick your bank.'); e.status = 400; throw e; }
  try {
    const r = await bankService.verifyBankAccount(accountNumber, bankCode);
    if (!r?.account_name) throw new Error('no name');
    return r.account_name;
  } catch (error) {
    const e = new Error("We couldn't find that bank account. Check the 10 digits, or pick a different bank.");
    e.status = 422;
    throw e;
  }
};

// POST /bank/check { bankCode, accountNumber } → { accountName } for "Yes, that's me"
router.post('/bank/check', async (req, res) => {
  try {
    const accountName = await resolve(digits(req.body?.accountNumber), String(req.body?.bankCode || ''));
    res.json({ success: true, accountName });
  } catch (error) { fail(res, error, "Couldn't check the account. Try again."); }
});

// PUT /bank { bankCode, bankName, accountNumber } → saved with the name Paystack returns
router.put('/bank', async (req, res) => {
  try {
    const accountNumber = digits(req.body?.accountNumber);
    const bankCode = String(req.body?.bankCode || '');
    const accountName = await resolve(accountNumber, bankCode); // checked again here: the name never comes from the form
    const s = await Seller().findByIdAndUpdate(req.user.id, {
      $set: {
        bankDetails: { bankCountry: 'Nigeria', bankName: clean(req.body?.bankName, 100), bankAccountType: 'savings', accountCurrency: 'NGN', accountNumber, accountName, bankIdentifierCode: bankCode },
        isBankVerified: true,
      },
    }, { new: true }).lean();
    res.json({ success: true, ...view(s) });
  } catch (error) { fail(res, error, "Couldn't save your bank. Try again."); }
});

module.exports = router;
