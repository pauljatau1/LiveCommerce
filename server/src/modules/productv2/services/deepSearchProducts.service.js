const productRepository = require('../repositories/product.repository');
const Fuse = require('fuse.js');

function getSortOptions(sortBy, order) {
  const direction = order === 'asc' ? 1 : -1;
  switch (sortBy) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'oldest':
      return { createdAt: 1 };
    case 'popular':
      return { 'analytics.views': -1 };
    case 'best_selling':
      return { 'stats.soldCount': -1 };
    case 'rating':
      return { 'stats.averageRating': -1 };
    case 'newest':
    default:
      return { createdAt: direction };
  }
}

class DeepSearchProductsService {
  async execute(req) {
    const {
      query = '',
      minPrice,
      maxPrice,
      condition,
      sortBy = 'newest',
      order = 'desc',
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }
    if (condition) {
      filter.condition = new RegExp(`^${condition}$`, 'i');
    }

    let searchResults = [];
    let total = 0;

    if (query.trim()) {
      const searchTerms = query.trim().split(/\s+/).filter(term => term.length > 0);
      const expandedTerms = [...searchTerms];
      searchTerms.forEach(term => {
        if (term.length > 2) {
          if (term.endsWith('s') && term.length > 3) {
            expandedTerms.push(term.slice(0, -1));
          } else if (!term.endsWith('s')) {
            expandedTerms.push(`${term}s`);
          }
        }
      });

      const orConditions = [];
      if (query.trim().length === 1) {
        const singleChar = query.trim();
        orConditions.push(
          { name: { $regex: singleChar, $options: 'i' } },
          { category: { $regex: singleChar, $options: 'i' } },
          { subCategory: { $regex: singleChar, $options: 'i' } },
          { brand: { $regex: singleChar, $options: 'i' } }
        );
      } else {
        orConditions.push(
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: `^${query}$`, $options: 'i' } },
          { subCategory: { $regex: `^${query}$`, $options: 'i' } },
          { subSubCategory: { $regex: `^${query}$`, $options: 'i' } }
        );
        expandedTerms.forEach(term => {
          orConditions.push(
            { name: { $regex: term, $options: 'i' } },
            { description: { $regex: term, $options: 'i' } },
            { category: { $regex: term, $options: 'i' } },
            { subCategory: { $regex: term, $options: 'i' } },
            { subSubCategory: { $regex: term, $options: 'i' } },
            { brand: { $regex: term, $options: 'i' } },
            { tags: { $regex: term, $options: 'i' } },
            { sku: { $regex: term, $options: 'i' } }
          );
        });
      }

      const mongoSearchQuery = { ...filter, $or: orConditions };
      const MAX_SEARCH_RESULTS = 200;
      total = await productRepository.count(mongoSearchQuery);

      let dbResults = await productRepository.findProducts(mongoSearchQuery, 0, MAX_SEARCH_RESULTS);

      if (dbResults.length > 0) {
        const fuse = new Fuse(dbResults, {
          keys: [
            { name: 'name', weight: 2.0 },
            { name: 'category', weight: 1.8 },
            { name: 'subCategory', weight: 1.5 },
            { name: 'subSubCategory', weight: 1.2 },
            { name: 'description', weight: 1.0 },
            { name: 'brand', weight: 0.8 },
            { name: 'tags', weight: 0.7 },
            { name: 'sku', weight: 0.5 }
          ],
          threshold: 0.45,
          distance: 200,
          includeScore: true,
          findAllMatches: true,
          ignoreLocation: true,
          minMatchCharLength: query.trim().length === 1 ? 1 : 2,
          location: 0,
          shouldSort: true
        });

        const fuzzyResults = fuse.search(query);
        const boostedResults = fuzzyResults.map(result => {
          const item = result.item;
          let score = result.score;
          let boost = 1.0;
          if (item.category) {
            const categoryLower = (item.category || '').toLowerCase();
            const queryLower = query.toLowerCase();
            if (categoryLower === queryLower) boost *= 0.3; else if (new RegExp(`\\b${queryLower}\\b`).test(categoryLower)) boost *= 0.4;
          }
          if (item.subCategory) {
            const subLower = (item.subCategory || '').toLowerCase();
            const queryLower = query.toLowerCase();
            if (subLower === queryLower) boost *= 0.5; else if (new RegExp(`\\b${queryLower}\\b`).test(subLower)) boost *= 0.6;
          }
          if (item.name && item.name.toLowerCase().includes(query.toLowerCase())) boost *= 0.7;
          if (item.name) {
            const nameLower = item.name.toLowerCase();
            const matchCount = expandedTerms.filter(term => nameLower.includes(term.toLowerCase())).length;
            if (matchCount > 1) boost *= (0.8 - (matchCount * 0.05));
          }
          return { ...result, score: score * boost };
        });

        boostedResults.sort((a, b) => a.score - b.score);
        const mappedResults = boostedResults.map(r => r.item);

        const sortOptions = getSortOptions(sortBy, order);
        mappedResults.sort((a, b) => {
          const sortKey = Object.keys(sortOptions)[0];
          const sortDirection = sortOptions[sortKey];
          const getValue = (obj, path) => path.split('.').reduce((o, key) => (o && o[key] !== undefined ? o[key] : null), obj);
          const aValue = getValue(a, sortKey);
          const bValue = getValue(b, sortKey);
          if (aValue === null && bValue === null) return 0;
          if (aValue === null) return sortDirection > 0 ? -1 : 1;
          if (bValue === null) return sortDirection > 0 ? 1 : -1;
          return sortDirection * (aValue > bValue ? 1 : aValue < bValue ? -1 : 0);
        });

        searchResults = mappedResults.slice(skip, skip + limit);
        if (fuzzyResults.length < total) total = fuzzyResults.length;
      }
    } else {
      total = await productRepository.count(filter);
      // Default newest first like v1 when no query
      const sortOptions = getSortOptions(sortBy, order);
      searchResults = await productRepository.findProductsSorted(filter, sortOptions, skip, limit);
    }

    return {
      products: searchResults,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      filters: {
        query,
        priceRange: { min: minPrice, max: maxPrice },
        condition,
        sortBy,
        order,
      }
    };
  }
}

module.exports = new DeepSearchProductsService();


