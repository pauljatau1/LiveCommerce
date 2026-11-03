/**
 * Gadgets & Electronics Prioritization Helper
 * 
 * This utility provides functions to prioritize items from the "Gadgets & Electronics"
 * major category in API responses. Items belonging to this category will appear
 * first in the response arrays while maintaining their relative order within each group.
 */

// Categories that belong to "Gadgets & Electronics" major category
// These are extracted from the production category data
const GADGETS_CATEGORIES = new Set([
    // Smartphones & Mobile
    'Smartphones',
    'Feature Phones',
    'Refurbished Phones',
    'Region-Specific Phones',

    // Tablets
    'Tablets',
    'iPads',
    'Kids Tablets',
    'Refurbished Tablets',

    // Computers
    'Laptops',
    'Desktops & PC',
    'Refurbished Computers',
    'PC Components',

    // Wearable & Accessories
    'Wearable & Accessories',
    'Wearable Accessories', // Staging variant
    'Charging Devices',
    'Chargers', // Added to cover specific subcategory
    'Power Banks',
    'Photography Accessories',

    // Audio
    'Earphones & Headsets',
    'Bluetooth Speakers',
    'Smart Speakers',

    // Networking & Storage
    'Networking Devices',
    'Data Storage Devices',
    'Monitors',

    // TV & Entertainment
    'Televisions',
    'Projectors & Accessories',
    'Gaming Consoles & Devices',

    // Smart Devices
    'Smart Home Devices',
    'Portable Gadgets',

    // Cameras & Drones
    'Cameras & Photography',
    'Drones & Accessories',

    // Health
    'Health Devices'
]);

// Lowercase version for case-insensitive matching
const GADGETS_CATEGORIES_LOWER = new Set(
    Array.from(GADGETS_CATEGORIES).map(cat => cat.toLowerCase())
);

/**
 * Check if a category belongs to Gadgets & Electronics
 * @param {string} category - Category name to check
 * @returns {boolean} True if the category is under Gadgets & Electronics
 */
function isGadgetsCategory(category) {
    if (!category || typeof category !== 'string') return false;
    return GADGETS_CATEGORIES_LOWER.has(category.toLowerCase().trim());
}

/**
 * Prioritize items from Gadgets & Electronics category
 * Items belonging to Gadgets & Electronics will appear first,
 * followed by other items. Relative order within each group is maintained.
 * Checks both category and subCategory fields.
 * 
 * @param {Array} items - Array of items to prioritize
 * @param {string} categoryField - Field name containing the category (default: 'category')
 * @param {string} subCategoryField - Field name containing the subCategory (default: 'subCategory')
 * @returns {Array} Reordered array with gadgets items first
 */
function prioritizeGadgetsItems(items, categoryField = 'category', subCategoryField = 'subCategory') {
    if (!Array.isArray(items) || items.length === 0) {
        return items;
    }

    const gadgetsItems = [];
    const otherItems = [];

    for (const item of items) {
        const category = item[categoryField];
        const subCategory = item[subCategoryField];

        // Check if either category or subCategory matches the gadgets list
        if (isGadgetsCategory(category) || isGadgetsCategory(subCategory)) {
            gadgetsItems.push(item);
        } else {
            otherItems.push(item);
        }
    }

    // Return gadgets items first, then other items
    return [...gadgetsItems, ...otherItems];
}

/**
 * Prioritize categories that belong to Gadgets & Electronics
 * For use with category listing endpoints where items have a 'name' field
 * 
 * @param {Array} categories - Array of category objects with 'name' field
 * @returns {Array} Reordered array with gadgets categories first
 */
function prioritizeGadgetsCategories(categories) {
    if (!Array.isArray(categories) || categories.length === 0) {
        return categories;
    }

    const gadgetsCategories = [];
    const otherCategories = [];

    for (const category of categories) {
        const name = category?.name;
        if (isGadgetsCategory(name)) {
            gadgetsCategories.push(category);
        } else {
            otherCategories.push(category);
        }
    }

    // Return gadgets categories first, then other categories
    return [...gadgetsCategories, ...otherCategories];
}

module.exports = {
    GADGETS_CATEGORIES,
    isGadgetsCategory,
    prioritizeGadgetsItems,
    prioritizeGadgetsCategories
};
