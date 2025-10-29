const getPersonalizedBlipsService = require('../services/getPersonalizedBlips.service');
const getSuggestedBlipsService = require('../services/getSuggestedBlips.service');
const getRelatedBlipsService = require('../services/getRelatedBlips.service');
const getNewBlipsService = require('../services/getNewBlips.service');
const getTrendingBlipsService = require('../services/getTrendingBlips.service');
const getFollowingBlipsService = require('../services/getFollowingBlips.service');
const getTopBlipsService = require('../services/getTopBlips.service');
const getBlipsByCategoryService = require('../services/getBlipsByCategory.service');
const getBlipsByRandomCategoryService = require('../services/getBlipsByRandomCategory.service');
const getBlipsCategoriesService = require('../services/getBlipsCategories.service');
const saveBlipService = require('../services/saveBlip.service');
const unsaveBlipService = require('../services/unsaveBlip.service');
const isBlipSavedService = require('../services/isBlipSaved.service');
const getSavedBlipsService = require('../services/getSavedBlips.service');

exports.getPersonalizedBlips = async (req, res) => {
  try {
    const result = await getPersonalizedBlipsService.execute(req);

    res.json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Error in getPersonalizedBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch personalized blips',
      error: error.message
    });
  }
};

exports.getSuggestedBlips = async (req, res) => {
  try {
    const result = await getSuggestedBlipsService.execute(req);

    res.json({
      blips: result.blips,
      isPersonalized: result.isPersonalized,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips
    });
  } catch (error) {
    console.error('Detailed error in getSuggestedBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to retrieve suggested blips',
      error: error.message
    });
  }
};

exports.getRelatedBlips = async (req, res) => {
  try {
    const result = await getRelatedBlipsService.execute(req);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching related blips:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.getNewBlips = async (req, res) => {
  try {
    const result = await getNewBlipsService.execute(req);

    res.json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Error in getNewBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch new blips',
      error: error.message
    });
  }
};

exports.getTrendingBlips = async (req, res) => {
  try {
    const result = await getTrendingBlipsService.execute(req);

    res.json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips,
      sessionId: result.sessionId
    });
  } catch (error) {
    console.error('Error in getTrendingBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch trending blips',
      error: error.message
    });
  }
};

exports.getFollowingBlips = async (req, res) => {
  try {
    const result = await getFollowingBlipsService.execute(req);

    // Check if there was an authentication error
    if (result.error === 'Authentication required') {
      return res.status(401).json({
        status: false,
        message: 'Authentication required for following blips',
        error: result.error
      });
    }

    // Check if there was an error fetching followed sellers
    if (result.error) {
      return res.status(500).json({
        status: false,
        message: 'Failed to fetch following blips',
        error: result.error
      });
    }

    res.json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips,
      sessionId: result.sessionId,
      followedSellersCount: result.followedSellersCount,
      message: result.message
    });
  } catch (error) {
    console.error('Error in getFollowingBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch following blips',
      error: error.message
    });
  }
};

exports.getTopBlips = async (req, res) => {
  try {
    const result = await getTopBlipsService.execute(req);

    res.json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips
    });
  } catch (error) {
    console.error('Error in getTopBlips:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch top blips',
      error: error.message
    });
  }
};

exports.getBlipsByCategory = async (req, res) => {
  try {
    const result = await getBlipsByCategoryService.execute(req);

    if (result.error) {
      return res.status(400).json({
        status: false,
        message: result.error
      });
    }

    res.json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips
    });
  } catch (error) {
    console.error('Error in getBlipsByCategory:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch blips by category',
      error: error.message
    });
  }
};

exports.getBlipsByRandomCategory = async (req, res) => {
  try {
    const result = await getBlipsByRandomCategoryService.execute(req);

    res.json({
      blips: result.blips,
      selectedCategory: result.selectedCategory,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips
    });
  } catch (error) {
    console.error('Error in getBlipsByRandomCategory:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch blips by random category',
      error: error.message
    });
  }
};

/**
 * Get blips categories with statistics
 * For authenticated users: Returns their selected categories with stats
 * For non-authenticated users: Returns popular categories with high blip counts
 */
exports.getBlipsCategories = async (req, res) => {
  try {
    const result = await getBlipsCategoriesService.execute(req);

    res.json({
      status: true,
      categories: result.categories,
      totalCategories: result.totalCategories,
      isPersonalized: result.isPersonalized,
      message: result.message
    });
  } catch (error) {
    console.error('Error in getBlipsCategories:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to fetch blips categories',
      error: error.message
    });
  }
};

/**
 * Save a blip for the authenticated buyer
 */
exports.saveBlip = async (req, res) => {
  try {
    const result = await saveBlipService.execute(req);
    res.status(200).json({
      status: true,
      message: result.message,
      created: result.created
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      status: false,
      message: error.message || 'Failed to save blip'
    });
  }
};

/**
 * Check if a blip is saved by the authenticated buyer
 */
exports.isBlipSaved = async (req, res) => {
  try {
    const result = await isBlipSavedService.execute(req);
    res.status(200).json({
      status: true,
      isSaved: result.isSaved
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      status: false,
      message: error.message || 'Failed to check saved state'
    });
  }
};

/**
 * Unsave a blip for the authenticated buyer
 */
exports.unsaveBlip = async (req, res) => {
  try {
    const result = await unsaveBlipService.execute(req);
    res.status(200).json({
      status: true,
      message: result.message,
      removed: result.removed
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      status: false,
      message: error.message || 'Failed to unsave blip'
    });
  }
};

/**
 * Get all saved blips for the authenticated buyer (paginated)
 */
exports.getSavedBlips = async (req, res) => {
  try {
    const result = await getSavedBlipsService.execute(req);
    res.status(200).json({
      blips: result.blips,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalBlips: result.totalBlips
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      status: false,
      message: error.message || 'Failed to fetch saved blips'
    });
  }
};
