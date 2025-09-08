require('dotenv').config();
const sharp = require('sharp');
const { s3 } = require('../src/config/awsConfig');

/**
 * Migration: Backfill resized images for all products
 * 
 * This migration processes all product images and creates resized versions.
 * Only processes images hosted on CDN domains:
 * - https://cdn.staging.auqli.live/
 * - https://cdn.auqli.live/
 * 
 * Optimizations include:
 * - Cursor-based processing with batching to prevent memory leaks
 * - Direct S3 downloads for CDN-hosted images
 * - S3 existence checks to skip already processed images
 * - Memory cleanup for image buffers
 * - Garbage collection between batches
 */

const RESIZE_DIMENSIONS = [150, 320, 640, 1024, 1920];
const RESIZED_IMAGE_QUALITY = 92;

/**
 * Check if image already has resized versions in S3
 * @param {string} basePath - Base S3 path
 * @param {string} fileName - Base filename without extension
 * @returns {Promise<boolean>} - True if resized versions exist
 */
async function checkResizedImagesExist(basePath, fileName, extPreferred) {
  // Verify ALL sizes for the provided extension if available; otherwise attempt discovery.
  return await findExistingExtension(basePath, fileName, extPreferred) !== null;
}

async function headExists(key) {
  try {
    await s3.headObject({ Bucket: process.env.CDN_S3_BUCKET, Key: key }).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') return false;
    console.warn(`Error during headObject for key ${key}: ${error.message}`);
    return false;
  }
}

async function findExistingExtension(basePath, fileName, extPreferred) {
  // If we know the preferred extension, check only that to avoid false positives.
  if (extPreferred) {
    const allExistPreferred = await Promise.all(
      RESIZE_DIMENSIONS.map((w) => headExists(`${basePath}/resized/${fileName}_${w}w.${extPreferred}`))
    );
    if (allExistPreferred.every(Boolean)) return extPreferred;
  }
  // Fallback to common extensions if preferred is unknown from URL
  const fallbackExtensions = ['jpg', 'png', 'webp'];
  for (const ext of fallbackExtensions) {
    const allExist = await Promise.all(
      RESIZE_DIMENSIONS.map((w) => headExists(`${basePath}/resized/${fileName}_${w}w.${ext}`))
    );
    if (allExist.every(Boolean)) return ext;
  }
  return null;
}

function getExtensionFromSourceUrl(url) {
  try {
    if (!url) return null;
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').pop();
    if (!last || !last.includes('.')) return null;
    let ext = last.split('.').pop().toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    // Guard against querystrings like .jpg?x=1 (URL.pathname excludes query)
    if (ext.length > 5) return null;
    return ext;
  } catch (_) {
    return null;
  }
}

/**
 * Check if image URL is accessible and valid
 * @param {string} imageUrl - Image URL to check
 * @returns {Promise<boolean>} - True if image is accessible and valid
 */
async function isImageAccessible(imageUrl) {
  try {
    // Only check CDN URLs
    if (!shouldProcessImage(imageUrl)) {
      return false;
    }
    
    // Extract key from CDN URL
    const key = extractS3Key(imageUrl);
    
    // Check if object exists in S3
    await s3.headObject({
      Bucket: process.env.CDN_S3_BUCKET,
      Key: key
    }).promise();
    
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
      console.log(`Image not found in S3: ${imageUrl}`);
      return false;
    }
    console.warn(`Error checking image accessibility: ${error.message}`);
    return false;
  }
}

/**
 * Check if URL is a CDN image that should be processed
 * @param {string} imageUrl - Image URL
 * @returns {boolean} - True if it's a CDN image that should be processed
 */
function shouldProcessImage(imageUrl) {
  if (!imageUrl) return false;
  
  // Only process images from our CDN domains
  return imageUrl.startsWith('https://cdn.staging.auqli.live/') || 
         imageUrl.startsWith('https://cdn.auqli.live/');
}

/**
 * Extract S3 key from CDN URL
 * @param {string} imageUrl - Image URL from CDN
 * @returns {string} - S3 key
 */
function extractS3Key(imageUrl) {
  try {
    // For CDN URLs like: https://cdn.staging.auqli.live/sellers/68076f44d21cd481a2113775/products/68b5ddcbf5a211baaab4ed2e/images/7ad9b526-42bc-4a96-85f3-62acd41ddcfa.jpg
    // We want to extract: sellers/68076f44d21cd481a2113775/products/68b5ddcbf5a211baaab4ed2e/images/7ad9b526-42bc-4a96-85f3-62acd41ddcfa.jpg
    
    const url = new URL(imageUrl);
    return url.pathname.substring(1); // Remove leading slash
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    throw error;
  }
}

/**
 * Download image from CDN URL and return buffer
 * @param {string} imageUrl - Image URL to download
 * @returns {Promise<Buffer>} - Image buffer
 */
async function downloadImage(imageUrl) {
  try {
    // Only process CDN URLs
    if (!shouldProcessImage(imageUrl)) {
      throw new Error(`URL is not a CDN image: ${imageUrl}`);
    }
    
    // Extract key from CDN URL
    const key = extractS3Key(imageUrl);
    
    console.log(`Downloading from S3: ${key}`);
    
    const response = await s3.getObject({
      Bucket: process.env.CDN_S3_BUCKET,
      Key: key
    }).promise();
    
    // Validate the downloaded buffer
    if (!response.Body || !Buffer.isBuffer(response.Body)) {
      throw new Error('Invalid response body from S3');
    }
    
    const buffer = response.Body;
    
    // Check if buffer is empty
    if (buffer.length === 0) {
      throw new Error('Downloaded image buffer is empty');
    }
    
    // Validate that it's actually an image by trying to get metadata
    try {
      await sharp(buffer).metadata();
    } catch (sharpError) {
      throw new Error(`Invalid image format: ${sharpError.message}`);
    }
    
    return buffer;
  } catch (error) {
    console.error(`Error downloading image from ${imageUrl}:`, error.message);
    throw error;
  }
}

/**
 * Resize an image buffer to a specific max width while maintaining aspect ratio
 * @param {Buffer} buffer - The image buffer to resize
 * @param {number} maxWidth - Maximum width for the resized image
 * @param {string} format - Image format to preserve
 * @returns {Promise<Buffer>} - Resized image buffer
 */
async function resizeImage(buffer, maxWidth, format = 'jpeg') {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Calculate new height maintaining aspect ratio
    const newHeight = Math.round((metadata.height * maxWidth) / metadata.width);
    
    let resizedImage = image.resize(maxWidth, newHeight, { fit: "inside" });
    
    // Preserve original format
    if (format === 'jpeg' || format === 'jpg') {
      resizedImage = resizedImage.jpeg({ quality: RESIZED_IMAGE_QUALITY });
    } else if (format === 'png') {
      resizedImage = resizedImage.png({ quality: RESIZED_IMAGE_QUALITY });
    } else if (format === 'webp') {
      resizedImage = resizedImage.webp({ quality: RESIZED_IMAGE_QUALITY });
    } else {
      // Default to JPEG for other formats
      resizedImage = resizedImage.jpeg({ quality: RESIZED_IMAGE_QUALITY });
    }
    
    return await resizedImage.toBuffer();
  } catch (error) {
    console.error("Error resizing image:", error);
    throw error;
  }
}

/**
 * Upload original image and create resized versions to S3
 * @param {Buffer} originalBuffer - Original image buffer
 * @param {string} basePath - Base S3 path
 * @param {string} fileName - Base filename without extension
 * @returns {Promise<Object>} - Object with original and resized image data
 */
async function uploadResizedImages(originalBuffer, basePath, fileName) {
  try {
    // Validate input buffer
    if (!originalBuffer || !Buffer.isBuffer(originalBuffer)) {
      throw new Error('Invalid original buffer provided');
    }
    if (originalBuffer.length === 0) {
      throw new Error('Original buffer is empty');
    }

    // Detect original image format with better error handling
    let metadata;
    try {
      metadata = await sharp(originalBuffer).metadata();
    } catch (sharpError) {
      throw new Error(`Failed to read image metadata: ${sharpError.message}`);
    }

    const originalFormat = metadata.format || 'jpeg';
    const extension = originalFormat === 'jpeg' ? 'jpg' : originalFormat;
    const contentType = `image/${originalFormat}`;

    console.log(`Processing image: ${fileName}.${extension} (${metadata.width}x${metadata.height}, ${originalFormat})`);

    // Precompute resized buffers first to avoid partial uploads if a resize fails
    const resizedBuffers = [];
    for (const width of RESIZE_DIMENSIONS) {
      try {
        const resizedBuffer = await resizeImage(originalBuffer, width, originalFormat);
        resizedBuffers.push({ width, buffer: resizedBuffer });
      } catch (resizeError) {
        throw new Error(`Failed to resize image to ${width}w: ${resizeError.message}`);
      }
    }

    // Prepare uploads, track uploaded keys for cleanup on failure (all-or-nothing)
    const keysToUpload = [];
    const uploadPromises = [];

    const originalKey = `${basePath}/${fileName}.${extension}`;
    keysToUpload.push(originalKey);
    uploadPromises.push(
      s3.upload({ Bucket: process.env.CDN_S3_BUCKET, Key: originalKey, Body: originalBuffer, ContentType: contentType }).promise()
    );

    for (const { width, buffer } of resizedBuffers) {
      const resizedKey = `${basePath}/resized/${fileName}_${width}w.${extension}`;
      keysToUpload.push(resizedKey);
      uploadPromises.push(
        s3.upload({ Bucket: process.env.CDN_S3_BUCKET, Key: resizedKey, Body: buffer, ContentType: contentType }).promise()
      );
    }

    let uploadResults;
    try {
      uploadResults = await Promise.all(uploadPromises);
    } catch (uploadError) {
      // Cleanup any uploaded artifacts to enforce all-or-nothing
      try {
        const deleteParams = {
          Bucket: process.env.CDN_S3_BUCKET,
          Delete: { Objects: keysToUpload.map((Key) => ({ Key })) }
        };
        await s3.deleteObjects(deleteParams).promise();
        console.warn(`Rolled back partial uploads for ${basePath}/${fileName}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup partial uploads for ${basePath}/${fileName}: ${cleanupError.message}`);
      }
      throw uploadError;
    }

    const originalUpload = uploadResults[0];
    const resizedUploads = uploadResults.slice(1);

    const result = {
      original: {
        url: 'https://' + process.env.CDN_URL + `/${originalUpload.Key}`,
        key: originalUpload.Key,
        location: originalUpload.Location
      },
      resizedImages: resizedUploads.map((upload, index) => ({
        width: RESIZE_DIMENSIONS[index],
        url: 'https://' + process.env.CDN_URL + `/${upload.Key}`,
        key: upload.Key,
        location: upload.Location
      }))
    };

    return result;
  } catch (error) {
    console.error("Error uploading resized images:", error);
    throw error;
  }
}

/**
 * Extract filename from URL
 * @param {string} url - Image URL
 * @returns {string} - Filename without extension
 */
function extractFilenameFromUrl(url) {
  try {
    const urlParts = url.split('/');
    const filenameWithExt = urlParts[urlParts.length - 1];
    const filenameWithoutExt = filenameWithExt.split('.')[0];
    return filenameWithoutExt || 'image';
  } catch (error) {
    console.error('Error extracting filename from URL:', error);
    return 'image';
  }
}

/**
 * Process main product images
 * @param {Object} product - Product document
 * @returns {Promise<Array>} - Updated images array
 */
async function processMainProductImages(product) {
  const updatedImages = [];
  
  for (let i = 0; i < product.images.length; i++) {
    const image = product.images[i];
    
    try {
      console.log(`Processing main product image ${i + 1}/${product.images.length} for product ${product._id}`);
      
      // If DB claims resizedImages exist, verify S3 actually has full set; otherwise reprocess
      if (image.resizedImages && image.resizedImages.length > 0) {
        const sourceUrl = image.url || image.originalUrl;
        if (sourceUrl && shouldProcessImage(sourceUrl)) {
          const fileNameProbe = extractFilenameFromUrl(sourceUrl);
          const basePathProbe = `sellers/${product.seller}/products/${product._id}/images`;
          const existingExtProbe = await findExistingExtension(basePathProbe, fileNameProbe);
          if (existingExtProbe) {
            console.log(`Skipping image ${i + 1} - verified resized set exists in S3`);
            updatedImages.push(image);
            continue;
          }
          console.log(`Resized URLs exist in DB but not in S3 - reprocessing image ${i + 1}`);
        } else {
          console.log(`Resized URLs exist in DB but source URL not processable - keeping as is for image ${i + 1}`);
          updatedImages.push(image);
          continue;
        }
      }
      
      if (!image.url) {
        console.log(`Skipping image ${i + 1} - no URL`);
        updatedImages.push(image);
        continue;
      }
      
      // Skip if not a CDN image
      if (!shouldProcessImage(image.url)) {
        console.log(`Skipping image ${i + 1} - not a CDN image: ${image.url}`);
        updatedImages.push(image);
        continue;
      }
      
      // Check if image is accessible in S3
      const isAccessible = await isImageAccessible(image.url);
      if (!isAccessible) {
        console.log(`Skipping image ${i + 1} - image not accessible in S3: ${image.url}`);
        updatedImages.push(image);
        continue;
      }
      
      // Generate filename and base path
      const fileName = extractFilenameFromUrl(image.url);
      const basePath = `sellers/${product.seller}/products/${product._id}/images`;
      
      // Check if resized versions already exist in S3
      const urlExt = getExtensionFromSourceUrl(image.url);
      const existingExt = await findExistingExtension(basePath, fileName, urlExt);
      if (existingExt) {
        console.log(`Skipping image ${i + 1} - resized versions already exist in S3`);
        // Generate the resized image URLs since they exist in S3
        const resizedImages = RESIZE_DIMENSIONS.map(width => ({
          width: width,
          url: `https://${process.env.CDN_URL}/${basePath}/resized/${fileName}_${width}w.${existingExt}`
        }));
        
        // Keep original image but populate resizedImages
        updatedImages.push({
          ...image,
          originalUrl: image.url, // Save the old URL for safety
          resizedImages: resizedImages
        });
        continue;
      }
      
      // Download original image
      let imageBuffer = await downloadImage(image.url);
      
      // Upload to new location with resized versions
      const uploadResults = await uploadResizedImages(imageBuffer, basePath, fileName);
      
      // Update image data - preserve original URL for safety
      updatedImages.push({
        url: uploadResults.original.url,
        originalUrl: image.url, // Save the old URL for safety
        resizedImages: uploadResults.resizedImages
      });
      
      // Clear the buffer to free memory
      imageBuffer = null;
      
      console.log(`Successfully processed main product image ${i + 1}`);
      
    } catch (error) {
      console.error(`Error processing main product image ${i + 1}:`, error.message);
      // Keep original image if processing fails
      updatedImages.push(image);
    }
  }
  
  return updatedImages;
}

/**
 * Process variant images recursively
 * @param {Array} variants - Variants array
 * @param {string} productId - Product ID
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Array>} - Updated variants array
 */
async function processVariantImages(variants, productId, sellerId) {
  const updatedVariants = [];
  
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    const updatedVariant = { ...variant };
    
    try {
      console.log(`Processing variant ${i + 1}/${variants.length} (${variant.name}: ${variant.value})`);
      
      // Process variant images
      if (variant.images && variant.images.length > 0) {
        const updatedImages = [];
        
        for (let j = 0; j < variant.images.length; j++) {
          const image = variant.images[j];
          
          try {
            console.log(`  Processing variant image ${j + 1}/${variant.images.length}`);
            
            // If DB claims resizedImages exist, verify S3 actually has full set; otherwise reprocess
            if (image.resizedImages && image.resizedImages.length > 0) {
              const sourceUrl = image.data || image.originalData;
              if (sourceUrl && shouldProcessImage(sourceUrl)) {
                const fileNameProbe = extractFilenameFromUrl(sourceUrl);
                const basePathProbe = `sellers/${sellerId}/products/${productId}/variants/${variant._id}/images`;
                const existingExtProbe = await findExistingExtension(basePathProbe, fileNameProbe);
                if (existingExtProbe) {
                  console.log(`  Skipping variant image ${j + 1} - verified resized set exists in S3`);
                  updatedImages.push(image);
                  continue;
                }
                console.log(`  Resized URLs exist in DB but not in S3 - reprocessing variant image ${j + 1}`);
              } else {
                console.log(`  Resized URLs exist in DB but source URL not processable - keeping variant image ${j + 1}`);
                updatedImages.push(image);
                continue;
              }
            }
            
            if (!image.data) {
              console.log(`  Skipping variant image ${j + 1} - no data`);
              updatedImages.push(image);
              continue;
            }
            
            // Skip if not a CDN image
            if (!shouldProcessImage(image.data)) {
              console.log(`  Skipping variant image ${j + 1} - not a CDN image: ${image.data}`);
              updatedImages.push(image);
              continue;
            }
            
            // Check if image is accessible in S3
            const isAccessible = await isImageAccessible(image.data);
            if (!isAccessible) {
              console.log(`  Skipping variant image ${j + 1} - image not accessible in S3: ${image.data}`);
              updatedImages.push(image);
              continue;
            }
            
            // Generate filename and base path
            const fileName = extractFilenameFromUrl(image.data);
            const basePath = `sellers/${sellerId}/products/${productId}/variants/${variant._id}/images`;
            
            // Check if resized versions already exist in S3
            const urlExt = getExtensionFromSourceUrl(image.data);
            const existingExt = await findExistingExtension(basePath, fileName, urlExt);
            if (existingExt) {
              console.log(`  Skipping variant image ${j + 1} - resized versions already exist in S3`);
              // Generate the resized image URLs since they exist in S3
              const resizedImages = RESIZE_DIMENSIONS.map(width => ({
                width: width,
                url: `https://${process.env.CDN_URL}/${basePath}/resized/${fileName}_${width}w.${existingExt}`
              }));
              
              // Keep original image but populate resizedImages
              updatedImages.push({
                ...image,
                originalData: image.data, // Save the old URL for safety
                resizedImages: resizedImages
              });
              continue;
            }
            
            // Download original image
            let imageBuffer = await downloadImage(image.data);
            
            // Upload to new location with resized versions
            const uploadResults = await uploadResizedImages(imageBuffer, basePath, fileName);
            
            // Update image data - preserve original URL for safety
            updatedImages.push({
              data: uploadResults.original.url,
              originalData: image.data, // Save the old URL for safety
              contentType: image.contentType,
              isDefault: image.isDefault,
              resizedImages: uploadResults.resizedImages
            });
            
            // Clear the buffer to free memory
            imageBuffer = null;
            
            console.log(`  Successfully processed variant image ${j + 1}`);
            
          } catch (error) {
            console.error(`  Error processing variant image ${j + 1}:`, error.message);
            // Keep original image if processing fails
            updatedImages.push(image);
          }
        }
        
        updatedVariant.images = updatedImages;
      }
      
      // Process subvariants recursively
      if (variant.subVariants && variant.subVariants.length > 0) {
        updatedVariant.subVariants = await processSubvariantImages(
          variant.subVariants, 
          productId, 
          sellerId, 
          variant._id
        );
      }
      
      updatedVariants.push(updatedVariant);
      
    } catch (error) {
      console.error(`Error processing variant ${i + 1}:`, error.message);
      updatedVariants.push(variant);
    }
  }
  
  return updatedVariants;
}

/**
 * Process subvariant images recursively
 * @param {Array} subvariants - Subvariants array
 * @param {string} productId - Product ID
 * @param {string} sellerId - Seller ID
 * @param {string} variantId - Parent variant ID
 * @returns {Promise<Array>} - Updated subvariants array
 */
async function processSubvariantImages(subvariants, productId, sellerId, variantId) {
  const updatedSubvariants = [];
  
  for (let i = 0; i < subvariants.length; i++) {
    const subvariant = subvariants[i];
    const updatedSubvariant = { ...subvariant };
    
    try {
      console.log(`Processing subvariant ${i + 1}/${subvariants.length} (${subvariant.name}: ${subvariant.value})`);
      
      // Process subvariant images
      if (subvariant.images && subvariant.images.length > 0) {
        const updatedImages = [];
        
        for (let j = 0; j < subvariant.images.length; j++) {
          const image = subvariant.images[j];
          
          try {
            console.log(`  Processing subvariant image ${j + 1}/${subvariant.images.length}`);
            
            // If DB claims resizedImages exist, verify S3 actually has full set; otherwise reprocess
            if (image.resizedImages && image.resizedImages.length > 0) {
              const sourceUrl = image.data || image.originalData;
              if (sourceUrl && shouldProcessImage(sourceUrl)) {
                const fileNameProbe = extractFilenameFromUrl(sourceUrl);
                const basePathProbe = `sellers/${sellerId}/products/${productId}/variants/${subvariant._id}/images`;
                const existingExtProbe = await findExistingExtension(basePathProbe, fileNameProbe);
                if (existingExtProbe) {
                  console.log(`  Skipping subvariant image ${j + 1} - verified resized set exists in S3`);
                  updatedImages.push(image);
                  continue;
                }
                console.log(`  Resized URLs exist in DB but not in S3 - reprocessing subvariant image ${j + 1}`);
              } else {
                console.log(`  Resized URLs exist in DB but source URL not processable - keeping subvariant image ${j + 1}`);
                updatedImages.push(image);
                continue;
              }
            }
            
            if (!image.data) {
              console.log(`  Skipping subvariant image ${j + 1} - no data`);
              updatedImages.push(image);
              continue;
            }
            
            // Skip if not a CDN image
            if (!shouldProcessImage(image.data)) {
              console.log(`  Skipping subvariant image ${j + 1} - not a CDN image: ${image.data}`);
              updatedImages.push(image);
              continue;
            }
            
            // Check if image is accessible in S3
            const isAccessible = await isImageAccessible(image.data);
            if (!isAccessible) {
              console.log(`  Skipping subvariant image ${j + 1} - image not accessible in S3: ${image.data}`);
              updatedImages.push(image);
              continue;
            }
            
            // Generate filename and base path
            const fileName = extractFilenameFromUrl(image.data);
            const basePath = `sellers/${sellerId}/products/${productId}/variants/${subvariant._id}/images`;
            
            // Check if resized versions already exist in S3
            const urlExt = getExtensionFromSourceUrl(image.data);
            const existingExt = await findExistingExtension(basePath, fileName, urlExt);
            if (existingExt) {
              console.log(`  Skipping subvariant image ${j + 1} - resized versions already exist in S3`);
              // Generate the resized image URLs since they exist in S3
              const resizedImages = RESIZE_DIMENSIONS.map(width => ({
                width: width,
                url: `https://${process.env.CDN_URL}/${basePath}/resized/${fileName}_${width}w.${existingExt}`
              }));
              
              // Keep original image but populate resizedImages
              updatedImages.push({
                ...image,
                originalData: image.data, // Save the old URL for safety
                resizedImages: resizedImages
              });
              continue;
            }
            
            // Download original image
            let imageBuffer = await downloadImage(image.data);
            
            // Upload to new location with resized versions
            const uploadResults = await uploadResizedImages(imageBuffer, basePath, fileName);
            
            // Update image data - preserve original URL for safety
            updatedImages.push({
              data: uploadResults.original.url,
              originalData: image.data, // Save the old URL for safety
              contentType: image.contentType,
              isDefault: image.isDefault,
              resizedImages: uploadResults.resizedImages
            });
            
            // Clear the buffer to free memory
            imageBuffer = null;
            
            console.log(`  Successfully processed subvariant image ${j + 1}`);
            
          } catch (error) {
            console.error(`  Error processing subvariant image ${j + 1}:`, error.message);
            // Keep original image if processing fails
            updatedImages.push(image);
          }
        }
        
        updatedSubvariant.images = updatedImages;
      }
      
      // Process subsubvariants recursively
      if (subvariant.subSubVariants && subvariant.subSubVariants.length > 0) {
        updatedSubvariant.subSubVariants = await processSubsubvariantImages(
          subvariant.subSubVariants, 
          productId, 
          sellerId, 
          subvariant._id
        );
      }
      
      updatedSubvariants.push(updatedSubvariant);
      
    } catch (error) {
      console.error(`Error processing subvariant ${i + 1}:`, error.message);
      updatedSubvariants.push(subvariant);
    }
  }
  
  return updatedSubvariants;
}

/**
 * Process subsubvariant images
 * @param {Array} subsubvariants - Subsubvariants array
 * @param {string} productId - Product ID
 * @param {string} sellerId - Seller ID
 * @param {string} subvariantId - Parent subvariant ID
 * @returns {Promise<Array>} - Updated subsubvariants array
 */
async function processSubsubvariantImages(subsubvariants, productId, sellerId, subvariantId) {
  const updatedSubsubvariants = [];
  
  for (let i = 0; i < subsubvariants.length; i++) {
    const subsubvariant = subsubvariants[i];
    const updatedSubsubvariant = { ...subsubvariant };
    
    try {
      console.log(`Processing subsubvariant ${i + 1}/${subsubvariants.length} (${subsubvariant.name}: ${subsubvariant.value})`);
      
      // Process subsubvariant images
      if (subsubvariant.images && subsubvariant.images.length > 0) {
        const updatedImages = [];
        
        for (let j = 0; j < subsubvariant.images.length; j++) {
          const image = subsubvariant.images[j];
          
          try {
            console.log(`  Processing subsubvariant image ${j + 1}/${subsubvariant.images.length}`);
            
            // If DB claims resizedImages exist, verify S3 actually has full set; otherwise reprocess
            if (image.resizedImages && image.resizedImages.length > 0) {
              const sourceUrl = image.data || image.originalData;
              if (sourceUrl && shouldProcessImage(sourceUrl)) {
                const fileNameProbe = extractFilenameFromUrl(sourceUrl);
                const basePathProbe = `sellers/${sellerId}/products/${productId}/variants/${subsubvariant._id}/images`;
                const existingExtProbe = await findExistingExtension(basePathProbe, fileNameProbe);
                if (existingExtProbe) {
                  console.log(`  Skipping subsubvariant image ${j + 1} - verified resized set exists in S3`);
                  updatedImages.push(image);
                  continue;
                }
                console.log(`  Resized URLs exist in DB but not in S3 - reprocessing subsubvariant image ${j + 1}`);
              } else {
                console.log(`  Resized URLs exist in DB but source URL not processable - keeping subsubvariant image ${j + 1}`);
                updatedImages.push(image);
                continue;
              }
            }
            
            if (!image.data) {
              console.log(`  Skipping subsubvariant image ${j + 1} - no data`);
              updatedImages.push(image);
              continue;
            }
            
            // Skip if not a CDN image
            if (!shouldProcessImage(image.data)) {
              console.log(`  Skipping subsubvariant image ${j + 1} - not a CDN image: ${image.data}`);
              updatedImages.push(image);
              continue;
            }
            
            // Check if image is accessible in S3
            const isAccessible = await isImageAccessible(image.data);
            if (!isAccessible) {
              console.log(`  Skipping subsubvariant image ${j + 1} - image not accessible in S3: ${image.data}`);
              updatedImages.push(image);
              continue;
            }
            
            // Generate filename and base path
            const fileName = extractFilenameFromUrl(image.data);
            const basePath = `sellers/${sellerId}/products/${productId}/variants/${subsubvariant._id}/images`;
            
            // Check if resized versions already exist in S3
            const urlExt = getExtensionFromSourceUrl(image.data);
            const existingExt = await findExistingExtension(basePath, fileName, urlExt);
            if (existingExt) {
              console.log(`  Skipping subsubvariant image ${j + 1} - resized versions already exist in S3`);
              // Generate the resized image URLs since they exist in S3
              const resizedImages = RESIZE_DIMENSIONS.map(width => ({
                width: width,
                url: `https://${process.env.CDN_URL}/${basePath}/resized/${fileName}_${width}w.${existingExt}`
              }));
              
              // Keep original image but populate resizedImages
              updatedImages.push({
                ...image,
                originalData: image.data, // Save the old URL for safety
                resizedImages: resizedImages
              });
              continue;
            }
            
            // Download original image
            let imageBuffer = await downloadImage(image.data);
            
            // Upload to new location with resized versions
            const uploadResults = await uploadResizedImages(imageBuffer, basePath, fileName);
            
            // Update image data - preserve original URL for safety
            updatedImages.push({
              data: uploadResults.original.url,
              originalData: image.data, // Save the old URL for safety
              contentType: image.contentType,
              isDefault: image.isDefault,
              resizedImages: uploadResults.resizedImages
            });
            
            // Clear the buffer to free memory
            imageBuffer = null;
            
            console.log(`  Successfully processed subsubvariant image ${j + 1}`);
            
          } catch (error) {
            console.error(`  Error processing subsubvariant image ${j + 1}:`, error.message);
            // Keep original image if processing fails
            updatedImages.push(image);
          }
        }
        
        updatedSubsubvariant.images = updatedImages;
      }
      
      updatedSubsubvariants.push(updatedSubsubvariant);
      
    } catch (error) {
      console.error(`Error processing subsubvariant ${i + 1}:`, error.message);
      updatedSubsubvariants.push(subsubvariant);
    }
  }
  
  return updatedSubsubvariants;
}

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Starting migration: Backfill resized images for all products');
    
    try {
      // Use cursor instead of loading all products at once
      const cursor = db.collection('products').find({});
      
      let processedCount = 0;
      let errorCount = 0;
      const batchSize = 50; // Process 10 products at a time
      let batch = [];
      
      // Process products in batches to manage memory
      while (await cursor.hasNext()) {
        const product = await cursor.next();
        batch.push(product);
        
        // Process batch when it reaches the size limit or when cursor is exhausted
        if (batch.length >= batchSize || !(await cursor.hasNext())) {
          console.log(`\n=== Processing Batch ${Math.floor(processedCount / batchSize) + 1} (${batch.length} products) ===`);
          
          // Process each product in the batch
          for (const product of batch) {
            try {
              console.log(`Processing Product ${product._id} (${processedCount + 1})`);
              
              const updates = {};
              
              // Process main product images
              if (product.images && product.images.length > 0) {
                console.log(`Processing ${product.images.length} main product images`);
                updates.images = await processMainProductImages(product);
              }
              
              // Process variant images
              if (product.variants && product.variants.length > 0) {
                console.log(`Processing ${product.variants.length} variants`);
                updates.variants = await processVariantImages(product.variants, product._id, product.seller);
              }
              
              // Update the product in database
              if (Object.keys(updates).length > 0) {
                await db.collection('products').updateOne(
                  { _id: product._id },
                  { $set: updates }
                );
                console.log(`Successfully updated product ${product._id}`);
              } else {
                console.log(`No updates needed for product ${product._id}`);
              }
              
              processedCount++;
              
            } catch (error) {
              console.error(`Error processing product ${product._id}:`, error.message);
              errorCount++;
            }
          }
          
          // Clear batch array to free memory
          batch = [];
          
          // Force garbage collection if available (Node.js with --expose-gc flag)
          if (global.gc) {
            global.gc();
            console.log('Garbage collection performed');
          }
          
          // Add a small delay to allow memory cleanup
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      await cursor.close();
      
      console.log(`\n=== Migration Complete ===`);
      console.log(`Total products processed: ${processedCount}`);
      console.log(`Errors encountered: ${errorCount}`);
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {

  }
};

