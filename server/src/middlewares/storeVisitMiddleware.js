const Seller = require('../models/Seller');

exports.trackStoreVisit = async (req, res, next) => {
  try {
    const sellerId = req.params.sellerId || req.body.sellerId;
    if (sellerId) {
      await Seller.findByIdAndUpdate(sellerId, { $inc: { storeVisits: 1 } });
    }
    next();
  } catch (error) {
    next(error);
  }
};
