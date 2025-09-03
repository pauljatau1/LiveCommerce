const getPersonalizedBlipsService = require('../services/getPersonalizedBlips.service');
const getSuggestedBlipsService = require('../services/getSuggestedBlips.service');
const getRelatedBlipsService = require('../services/getRelatedBlips.service');
const getNewBlipsService = require('../services/getNewBlips.service');
const getTrendingBlipsService = require('../services/getTrendingBlips.service');
const getFollowingBlipsService = require('../services/getFollowingBlips.service');

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
