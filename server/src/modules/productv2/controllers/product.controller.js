const getPersonalizedProductsService = require('../services/getPersonalizedProducts.service');
const createProductService = require('../services/createProduct.service');
const getAllProductsService = require('../services/getAllProducts.service');
const getJustArrivedProductsService = require('../services/getJustArrivedProducts.service');
const getTrendingProductsService = require('../services/getTrendingProducts.service');
const getProductByIdService = require('../services/getProductById.service');
const getProductService = require('../services/getProduct.service');
const deepSearchProductsService = require('../services/deepSearchProducts.service');

exports.getPersonalizedProducts = async (req, res) => {
  try {
    const result = await getPersonalizedProductsService.execute(req);

    res.json({
      products: result.products,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalProducts: result.totalProducts,
      hasMore: result.hasMore,
      isPersonalized: result.isPersonalized
    });
  } catch (error) {
    console.error('Error in getPersonalizedProducts (v2):', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch personalized products',
      error: error.message
    });
  }
};

exports.createProduct = async (req, res) => {
  const result = await createProductService.execute(req);
  return res.status(result.status).json(result.body);
};

exports.getAllProducts = async (req, res) => {
  try {
    const result = await getAllProductsService.execute(req);
    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: result.pagination,
        filters: result.filters
      }
    });
  } catch (error) {
    console.error('Error in getAllProducts (v2):', error);
    res.status(500).json({ success: false, message: 'Error retrieving products', error: error.message });
  }
};

exports.getJustArrivedProducts = async (_req, res) => {
  try {
    const result = await getJustArrivedProductsService.execute();
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error in getJustArrivedProducts (v2):', error);
    res.status(500).json({ success: false, message: 'Error retrieving just arrived products', error: error.message });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    const result = await getTrendingProductsService.execute(req);
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error in getTrendingProducts (v2):', error);
    res.status(500).json({ success: false, message: 'Error retrieving trending products', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const result = await getProductByIdService.execute(req);
    if (result.notFound) return res.status(404).json({ message: 'Product not found' });
    if (result.error) return res.status(500).json({ message: result.error, sellerId: result.sellerId });
    res.json(result.product);
  } catch (error) {
    console.error('Error in getProductById (v2):', error);
    res.status(500).json({ message: 'Failed to retrieve product', error: error.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const result = await getProductService.execute(req);
    if (result.notFound) return res.status(404).json({ message: 'Product not found' });
    res.json(result.product);
  } catch (error) {
    console.error('Error in getProduct (v2):', error);
    res.status(500).json({ message: 'Failed to retrieve product', error: error.message });
  }
};

exports.deepSearchProducts = async (req, res) => {
  try {
    const result = await deepSearchProductsService.execute(req);
    res.json(result);
  } catch (error) {
    console.error('Error in deepSearchProducts (v2):', error);
    res.status(500).json({ message: 'Failed to deep search products', error: error.message });
  }
};


