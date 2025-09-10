const { v4: uuidv4 } = require('uuid');
const Category = require('../../../models/Category');
const Product = require('../../../models/Product');
const { uploadResizedImages } = require('../../../utils/imageProcessor');

class CreateProductService {
  async execute(req) {
    try {
      const sellerId = req.user.id;

      // Validate required fields
      const requiredFields = ['name', 'description', 'price', 'category', 'stock'];
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        return { status: 400, body: { message: `Missing required fields: ${missingFields.join(', ')}` } };
      }

      // Parse JSON fields with error handling
      const parseJsonField = (field, fieldName) => {
        if (!field) return undefined;
        try {
          return typeof field === 'string' ? JSON.parse(field) : field;
        } catch (error) {
          throw new Error(`Invalid JSON format for ${fieldName}: ${error.message}`);
        }
      };

      const parsedBody = {
        ...req.body,
        returnPolicy: parseJsonField(req.body.returnPolicy, 'returnPolicy'),
        shippingInfo: parseJsonField(req.body.shippingInfo, 'shippingInfo'),
        seo: parseJsonField(req.body.seo, 'seo'),
      };

      if (typeof req.body.tags === 'string') {
        parsedBody.tags = req.body.tags.split(',').map(tag => tag.trim());
      }
      if (typeof req.body.colors === 'string') {
        parsedBody.colors = req.body.colors.split(',').map(color => color.trim());
      }

      // Validate category and subcategory
      const categoryDoc = await Category.findOne({ name: parsedBody.category });
      if (!categoryDoc) {
        return { status: 400, body: { message: 'Invalid category' } };
      }
      if (parsedBody.subCategory) {
        const validSubCategory = categoryDoc.subCategories.some(sub => sub.name === parsedBody.subCategory);
        if (!validSubCategory) {
          return { status: 400, body: { message: 'Invalid subcategory for the selected category' } };
        }
      }

      // Prepare images and variants to process AFTER product is saved
      let imagesLinks = [];
      let imagesToProcess = [];
      if (req.body.images && Array.isArray(req.body.images)) {
        imagesToProcess = req.body.images;
      }

      let variantsToProcess = [];
      if (req.body.variants && Array.isArray(req.body.variants)) {
        variantsToProcess = req.body.variants;
      }

      // Create new product with empty images; we'll process uploads after save
      const newProduct = new Product({
        ...parsedBody,
        seller: sellerId,
        images: imagesLinks,
      });

      await newProduct.save();

      // Process main product images with resizing after product is saved
      if (imagesToProcess.length > 0) {
        const imageProcessingPromises = imagesToProcess.map(async (image) => {
          const base64Data = image.data.split(',')[1] || image.data;
          if (!base64Data) {
            console.error('Invalid base64 data for main product image:', image);
            throw new Error('Invalid base64 data');
          }

          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = uuidv4();
          const basePath = `sellers/${sellerId}/products/${newProduct._id}/images`;

          const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

          return {
            url: uploadResults.original.url,
            resizedImages: uploadResults.resizedImages
          };
        });

        imagesLinks = await Promise.all(imageProcessingPromises);
        newProduct.images = imagesLinks;
        await newProduct.save();
      }

      // Process variant images with resizing after product is saved
      if (variantsToProcess.length > 0) {
        // Save variants to get their auto-generated IDs
        newProduct.variants = variantsToProcess;
        await newProduct.save();

        // Process variants and nested images
        const processedVariants = await Promise.all(newProduct.variants.map(async (variant) => {
          // Process main variant images
          let variantImages = [];
          if (variant?.images?.length > 0 && Array.isArray(variant.images)) {
            const variantImagePromises = variant.images.map(async (image) => {
              if (!image?.data) {
                console.log('Skipping variant image processing - no image data');
                return null;
              }

              const base64Data = image.data.split(',')[1] || image.data;
              if (!base64Data) {
                console.error('Invalid base64 data for variant image:', image);
                return null;
              }

              const buffer = Buffer.from(base64Data, 'base64');
              const fileName = uuidv4();
              const basePath = `sellers/${sellerId}/products/${newProduct._id}/variants/${variant._id}/images`;

              const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

              return {
                data: uploadResults.original.url,
                contentType: image.contentType,
                isDefault: image.isDefault || false,
                resizedImages: uploadResults.resizedImages
              };
            });

            variantImages = (await Promise.all(variantImagePromises)).filter(img => img !== null);
          }

          // Process subvariants
          const processedSubVariants = await Promise.all((variant.subVariants || []).map(async (subVariant) => {
            let subVariantImages = [];
            if (subVariant?.images?.length > 0 && Array.isArray(subVariant.images)) {
              const subVariantImagePromises = subVariant.images.map(async (image) => {
                if (!image?.data) {
                  console.log('Skipping subvariant image processing - no image data');
                  return null;
                }

                const base64Data = image.data.split(',')[1] || image.data;
                if (!base64Data) {
                  console.error('Invalid base64 data for subvariant image:', image);
                  return null;
                }

                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = uuidv4();
                const basePath = `sellers/${sellerId}/products/${newProduct._id}/variants/${subVariant._id}/images`;

                const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

                return {
                  data: uploadResults.original.url,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false,
                  resizedImages: uploadResults.resizedImages
                };
              });

              subVariantImages = (await Promise.all(subVariantImagePromises)).filter(img => img !== null);
            }

            // Process subsubvariants
            const processedSubSubVariants = await Promise.all((subVariant.subSubVariants || []).map(async (subSubVariant) => {
              let subSubVariantImages = [];
              if (subSubVariant?.images?.length > 0 && Array.isArray(subSubVariant.images)) {
                const subSubVariantImagePromises = subSubVariant.images.map(async (image) => {
                  if (!image?.data) {
                    console.log('Skipping subsubvariant image processing - no image data');
                    return null;
                  }

                  const base64Data = image.data.split(',')[1] || image.data;
                  if (!base64Data) {
                    console.error('Invalid base64 data for subsubvariant image:', image);
                    return null;
                  }

                  const buffer = Buffer.from(base64Data, 'base64');
                  const fileName = uuidv4();
                  const basePath = `sellers/${sellerId}/products/${newProduct._id}/variants/${subSubVariant._id}/images`;

                  const uploadResults = await uploadResizedImages(buffer, basePath, fileName);

                  return {
                    data: uploadResults.original.url,
                    contentType: image.contentType,
                    isDefault: image.isDefault || false,
                    resizedImages: uploadResults.resizedImages
                  };
                });

                subSubVariantImages = (await Promise.all(subSubVariantImagePromises)).filter(img => img !== null);
              }

              return {
                ...subSubVariant,
                images: subSubVariantImages
              };
            }));

            return {
              ...subVariant,
              images: subVariantImages,
              subSubVariants: processedSubSubVariants
            };
          }));

          return {
            ...variant,
            images: variantImages,
            subVariants: processedSubVariants
          };
        }));

        // Update product with processed variants
        newProduct.variants = processedVariants;
        await newProduct.save();
      }

      // Populate seller minimal fields
      const populatedProduct = await Product.findById(newProduct._id)
        .populate('seller', 'name avatarUrl about');

      // Schedule auction if needed
      if (newProduct.status === 'offline_auction') {
        const agenda = require('../../../config/agenda').agenda;
        await agenda.schedule(newProduct.auction.startDate, 'update-auction-status', { productId: newProduct._id, newStatus: 'ongoing' });
        await agenda.schedule(newProduct.auction.endDate, 'update-auction-status', { productId: newProduct._id, newStatus: 'ended' });
        const orderCreationTime = new Date(newProduct.auction.endDate.getTime() + 60000);
        await agenda.schedule(orderCreationTime, 'create-auction-winner-order', { productId: newProduct._id });
      }

      return { status: 201, body: populatedProduct };
    } catch (error) {
      if (error.message.includes('Invalid JSON format')) {
        return { status: 400, body: { message: 'Data format error', error: error.message } };
      }
      if (error.name === 'ValidationError') {
        return { status: 400, body: { message: 'Validation error', error: Object.values(error.errors).map(err => err.message) } };
      }
      return { status: 500, body: { message: 'Failed to create product', error: error.message, details: error.stack } };
    }
  }
}

module.exports = new CreateProductService();


