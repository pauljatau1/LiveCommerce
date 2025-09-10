const sharp = require("sharp");
const { s3 } = require("../config/awsConfig");

const RESIZE_DIMENSIONS = [150, 320, 640, 1024, 1920];
const RESIZED_IMAGE_QUALITY = 92;

/**
 * Resize an image buffer to a specific max width while maintaining aspect ratio
 * @param {Buffer} buffer - The image buffer to resize
 * @param {number} maxWidth - Maximum width for the resized image
 * @param {string} format - Image format to preserve (default: 'jpeg')
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
 * @param {string} basePath - Base S3 path (e.g., 'sellers/sellerId/products/productId/images')
 * @param {string} fileName - Base filename without extension
 * @returns {Promise<Object>} - Object with original and resized image data
 */
async function uploadResizedImages(originalBuffer, basePath, fileName) {
  try {
    const uploadPromises = [];

    // Detect original image format
    const metadata = await sharp(originalBuffer).metadata();
    const originalFormat = metadata.format || 'jpeg';
    const extension = originalFormat === 'jpeg' ? 'jpg' : originalFormat;
    const contentType = `image/${originalFormat}`;

    // Upload original image with original format
    const originalKey = `${basePath}/${fileName}.${extension}`;
    uploadPromises.push(
      s3
        .upload({
          Bucket: process.env.CDN_S3_BUCKET,
          Key: originalKey,
          Body: originalBuffer,
          ContentType: contentType,
        })
        .promise()
    );

    // Upload resized versions (keeping original format)
    for (const width of RESIZE_DIMENSIONS) {
      const resizedBuffer = await resizeImage(originalBuffer, width, originalFormat);
      const resizedKey = `${basePath}/resized/${fileName}_${width}w.${extension}`;

      uploadPromises.push(
        s3
          .upload({
            Bucket: process.env.CDN_S3_BUCKET,
            Key: resizedKey,
            Body: resizedBuffer,
            ContentType: contentType,
          })
          .promise()
        );
    }

    const uploadResults = await Promise.all(uploadPromises);
    const originalUpload = uploadResults[0];
    const resizedUploads = uploadResults.slice(1);

    // Structure the response
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
 * Generate resized image URLs based on original image URL and entity info
 * @param {string} originalImageUrl - Original image URL
 * @param {string} basePath - Base S3 path
 * @param {string} fileName - Base filename without extension
 * @param {string} format - Image format to use for extension (default: 'jpeg')
 * @returns {Array} - Array of resized image URLs
 */
function getResizedImageUrls(originalImageUrl, basePath, fileName, format = 'jpeg') {
  const extension = format === 'jpeg' ? 'jpg' : format;
  return RESIZE_DIMENSIONS.map((width) => {
    const resizedKey = `${basePath}/resized/${fileName}_${width}w.${extension}`;
    return "https://" + process.env.CDN_URL + "/" + resizedKey;
  });
}

/**
 * Resize image to specific dimensions
 * @param {Buffer} buffer - Image buffer to resize
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} format - Output format (default: jpeg)
 * @returns {Promise<Buffer>} - Resized image buffer
 */
async function resizeImageToDimensions(buffer, width, height, format = "jpeg") {
  try {
    return await sharp(buffer)
      .resize(width, height, { fit: "cover" })
      .toFormat(format)
      .toBuffer();
  } catch (error) {
    console.error("Error resizing image to dimensions:", error);
    throw error;
  }
}

module.exports = {
  RESIZE_DIMENSIONS,
  RESIZED_IMAGE_QUALITY,
  resizeImage,
  uploadResizedImages,
  getResizedImageUrls,
  resizeImageToDimensions,
};
