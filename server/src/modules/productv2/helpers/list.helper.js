// Common seller population fields array (kept consistent with existing controllers)
const sellerPopulationFields = [
  'firstName',
  'lastName',
  'businessName',
  'storeName',
  'stats.averageRating',
  'stats.totalReviews',
  'storeAvatar',
  'isVerified',
  'email',
  'phoneNumber',
  'businessAddress',
  'warehouseDetails',
  'sellerAddress',
  'offersStorePickup'
];

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function reorderToAvoidSellerClusters(products) {
  if (!products.length) return [];

  const productsBySeller = {};
  products.forEach(product => {
    const sellerId = product.seller._id.toString();
    if (!productsBySeller[sellerId]) {
      productsBySeller[sellerId] = [];
    }
    productsBySeller[sellerId].push(product);
  });

  const sellerIds = Object.keys(productsBySeller);
  if (sellerIds.length <= 1) return products;

  const result = [];
  let lastUsedSellerIndices = [];

  while (result.length < products.length && sellerIds.some(id => productsBySeller[id].length > 0)) {
    const availableSellers = sellerIds.filter((id, index) =>
      productsBySeller[id].length > 0 && !lastUsedSellerIndices.includes(index)
    );

    if (availableSellers.length === 0) {
      lastUsedSellerIndices = [];
      continue;
    }

    const randomIndex = Math.floor(Math.random() * availableSellers.length);
    const selectedSellerId = availableSellers[randomIndex];
    const sellerIndex = sellerIds.indexOf(selectedSellerId);

    lastUsedSellerIndices.push(sellerIndex);
    if (lastUsedSellerIndices.length > sellerIds.length / 2) {
      lastUsedSellerIndices.shift();
    }

    const product = productsBySeller[selectedSellerId].shift();
    result.push(product);
  }

  return result;
}

module.exports = {
  sellerPopulationFields,
  shuffleArray,
  reorderToAvoidSellerClusters
};


