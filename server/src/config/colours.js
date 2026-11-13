// Retain colour/lot data and code for rollback; launch uses one stock per product.
const coloursEnabled = () => process.env.COLOURS === 'true';

function productInput(body = {}) {
  if (coloursEnabled()) return { ...body };
  const plain = { ...body };
  for (const key of ['colour', 'color', 'colours', 'colors', 'colourVariants', 'colorVariants', 'colourQuantities', 'colorQuantities', 'variants']) {
    delete plain[key];
  }
  return plain;
}

module.exports = { coloursEnabled, productInput };
