const { s3 } = require('../../../config/awsConfig');
const { v4: uuidv4 } = require('uuid');
const Category = require('../../../models/Category');
const Product = require('../../../models/Product');

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

      // Handle main product images
      let imagesLinks = [];
      if (req.body.images && Array.isArray(req.body.images)) {
        for (let image of req.body.images) {
          const buffer = Buffer.from(image.data, 'base64');
          const params = {
            Bucket: process.env.CDN_S3_BUCKET,
            Key: `${uuidv4()}.jpg`,
            Body: buffer,
            ContentType: image.contentType,
          };
          const data = await s3.upload(params).promise();
          imagesLinks.push({ url: 'https://' + process.env.CDN_URL + `/${data.Key}` });
        }
      }

      // Process variant images (variant -> subVariant -> subSubVariant)
      if (req.body.variants && Array.isArray(req.body.variants)) {
        parsedBody.variants = await Promise.all(req.body.variants.map(async (variant) => {
          let variantImages = [];
          if (variant?.images?.length > 0 && Array.isArray(variant.images)) {
            for (let image of variant.images) {
              if (!image?.data) continue;
              const base64Data = image.data.split(',')[1] || image.data;
              if (!base64Data) continue;
              const buffer = Buffer.from(base64Data, 'base64');
              const params = {
                Bucket: process.env.CDN_S3_BUCKET,
                Key: `variants/colors/${uuidv4()}-${variant.value}.jpg`,
                Body: buffer,
                ContentType: image.contentType,
              };
              const data = await s3.upload(params).promise();
              variantImages.push({
                data: `https://` + process.env.CDN_URL + `/${data.Key}`,
                contentType: image.contentType,
                isDefault: image.isDefault || false
              });
            }
          }

          const processedSubVariants = await Promise.all((variant.subVariants || []).map(async (subVariant) => {
            const subVariantImages = [];
            if (subVariant?.images?.length > 0 && Array.isArray(subVariant.images)) {
              for (let image of subVariant.images) {
                if (!image?.data) continue;
                const base64Data = image.data.split(',')[1] || image.data;
                if (!base64Data) continue;
                const buffer = Buffer.from(base64Data, 'base64');
                const params = {
                  Bucket: process.env.CDN_S3_BUCKET,
                  Key: `variants/sizes/${uuidv4()}-${variant.value}_${subVariant.value}.jpg`,
                  Body: buffer,
                  ContentType: image.contentType,
                };
                const data = await s3.upload(params).promise();
                subVariantImages.push({
                  data: `https://` + process.env.CDN_URL + `/${data.Key}`,
                  contentType: image.contentType,
                  isDefault: image.isDefault || false
                });
              }
            }

            const processedSubSubVariants = await Promise.all((subVariant.subSubVariants || []).map(async (subSubVariant) => {
              const subSubVariantImages = [];
              if (subSubVariant?.images?.length > 0 && Array.isArray(subSubVariant.images)) {
                for (let image of subSubVariant.images) {
                  if (!image?.data) continue;
                  const base64Data = image.data.split(',')[1] || image.data;
                  if (!base64Data) continue;
                  const buffer = Buffer.from(base64Data, 'base64');
                  const params = {
                    Bucket: process.env.CDN_S3_BUCKET,
                    Key: `variants/materials/${uuidv4()}-${variant.value}_${subVariant.value}_${subSubVariant.value}.jpg`,
                    Body: buffer,
                    ContentType: image.contentType,
                  };
                  const data = await s3.upload(params).promise();
                  subSubVariantImages.push({
                    data: `https://` + process.env.CDN_URL + `/${data.Key}`,
                    contentType: image.contentType,
                    isDefault: image.isDefault || false
                  });
                }
              }

              return { ...subSubVariant, images: subSubVariantImages };
            }));

            return { ...subVariant, images: subVariantImages, subSubVariants: processedSubSubVariants };
          }));

          return { ...variant, images: variantImages, subVariants: processedSubVariants };
        }));
      }

      // Create new product
      const newProduct = new Product({
        ...parsedBody,
        seller: sellerId,
        images: imagesLinks,
      });

      await newProduct.save();

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


