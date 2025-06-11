
/**
 * Extracts all image URLs from a deeply nested product variant structure.
 * Supports variants, subVariants, and subSubVariants.
 * Handles both DB-stored images (`image.url`) and images from updates (`image.data` starting with 'http').
 *
 * @param {Array} variants - Array of variant objects containing images and nested sub-variants.
 * @returns {Array} urls - Flat array of image URLs.
 */
function ExtractAllImageUrlsFromVariants(variants) {
    const urls = [];

    // Loop through each main variant
    for (const variant of variants || []) {
        // Extract image URLs from the main variant
        for (const image of variant.images || []) {
            if (image.url) {
                urls.push(image.url); // From DB
            } else if (image.data?.startsWith('http')) {
                urls.push(image.data); // URL from updated input
            }
        }

        // Loop through subVariants of the current variant
        for (const subVariant of variant.subVariants || []) {
            // Extract image URLs from subVariant
            for (const image of subVariant.images || []) {
                if (image.url) {
                    urls.push(image.url);
                } else if (image.data?.startsWith('http')) {
                    urls.push(image.data);
                }
            }

            // Loop through subSubVariants of the current subVariant
            for (const subSubVariant of subVariant.subSubVariants || []) {
                // Extract image URLs from subSubVariant
                for (const image of subSubVariant.images || []) {
                    if (image.url) {
                        urls.push(image.url);
                    } else if (image.data?.startsWith('http')) {
                        urls.push(image.data);
                    }
                }
            }
        }
    }

  return urls;
}

module.exports = { ExtractAllImageUrlsFromVariants };