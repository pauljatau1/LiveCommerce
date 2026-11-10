// AI helpers for sellers. Each call costs model quota, so calls are limited
// per seller.
const express = require('express');
const rateLimit = require('express-rate-limit');
const { verifyToken, isSeller, adminAuth } = require('../middlewares/authMiddleware');
const listingDraft = require('../services/ai/listingDraftService');

const { signDraft } = require('../services/ai/listingCorrections');
const ListingCorrection = require('../models/ListingCorrection');

const router = express.Router();

const perSellerLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.AI_DRAFTS_PER_HOUR) || 40,
  keyGenerator: (req) => `ai:${req.user.id}`,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'You have used the AI a lot this hour. Try again later, or fill the form yourself.' },
});

const handle = (fn) => async (req, res) => {
  try {
    res.json({ success: true, draft: await fn(req.body || {}, req) });
  } catch (error) {
    if (error instanceof listingDraft.ListingDraftError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('[ai] listing draft failed:', error.message);
    res.status(500).json({ success: false, message: 'Something went wrong. You can fill the form yourself.' });
  }
};

/**
 * @swagger
 * /api/v2/ai/listing-draft:
 *   post:
 *     summary: Draft a product listing from photos (Gemini)
 *     tags: [AI]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               images: { type: array, items: { type: object, properties: { data: { type: string, description: base64 }, contentType: { type: string } } } }
 *               note: { type: string }
 */
router.post('/listing-draft', verifyToken, isSeller, perSellerLimit, handle(async (body, req) => {
  const draft = await listingDraft.draftFromPhotos(body);
  return { ...draft, draftProof: signDraft(draft, req.user.id) };
}));

/**
 * @swagger
 * /api/v2/ai/listing-draft/refine:
 *   post:
 *     summary: Change a listing draft with a plain-language instruction
 *     tags: [AI]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/listing-draft/refine', verifyToken, isSeller, perSellerLimit, handle((body) => listingDraft.refineDraft(body)));

router.get('/status', verifyToken, isSeller, (req, res) => res.json({ success: true, listingDraft: listingDraft.isConfigured() }));

// Times a tiny call to Gemini; used to diagnose slow or failing drafts
router.get('/check', verifyToken, isSeller, perSellerLimit, async (req, res) => {
  if (!listingDraft.isConfigured()) return res.json({ success: false, configured: false });
  res.json({ success: true, ...(await listingDraft.checkConnection()) });
});

// Bounded, newest-first list. Verify an actual admin record, not just a JWT role.
router.get('/listing-corrections', adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Math.min(10000, parseInt(req.query.page, 10) || 1));
    const limit = 50;
    const corrections = await ListingCorrection.find().sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit + 1).lean();
    res.json({ corrections: corrections.slice(0, limit), page, hasMore: corrections.length > limit });
  } catch (error) {
    res.status(500).json({ message: 'Could not load listing corrections' });
  }
});

module.exports = router;
