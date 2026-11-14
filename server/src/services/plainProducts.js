const mongoose = require('mongoose');
const { coloursEnabled } = require('../config/colours');

// Keep legacy lot IDs: holds and order references rely on them. Only the view
// changes. Never rewrite the seller's title or remove stored rollback metadata.
async function productsForDisplay(rows = []) {
  if (coloursEnabled() || !rows.some(row => row.product?.catalogueProductId)) return rows;
  const ids = [...new Set(rows.filter(row => row.product?.catalogueProductId).map(row => String(row.product.catalogueProductId)))];
  const products = await mongoose.model('Product').find({ _id: { $in: ids } }).select('name stock').lean();
  const byId = new Map(products.map(p => [String(p._id), p]));
  return rows.map(row => {
    const source = row.toObject ? row.toObject() : row;
    const product = byId.get(String(source.product?.catalogueProductId));
    if (!product) return source;
    const view = { ...source.product, name: product.name, quantity: product.stock };
    for (const key of ['colour', 'colourVariants', 'colourQuantities']) delete view[key];
    return { ...source, product: view };
  });
}

async function streamForDisplay(stream) {
  if (!stream) return stream;
  const rows = await productsForDisplay(stream.products || []);
  return rows === stream.products ? stream : { ...(stream.toObject ? stream.toObject() : stream), products: rows };
}

module.exports = { productsForDisplay, streamForDisplay };
