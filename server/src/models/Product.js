const mongoose = require('mongoose');

// Helper function to generate SKU
async function generateSKU(product) {
  const prefix = product.category ? product.category.substring(0, 3).toUpperCase() : 'PRD';
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const sku = `${prefix}-${timestamp}-${random}`;
  
  // Check if SKU already exists
  const exists = await mongoose.model('Product').findOne({ 'inventory.sku': sku });
  if (exists) {
    return generateSKU(product); // Recursively try again if SKU exists
  }
  
  return sku;
}

// Helper function to generate slug
async function generateSlug(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists
  while (await mongoose.model('Product').findOne({ 'seo.slug': slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  priceVariants: [{
    size: { type: String },
    price: { type: Number },
  }],
  category: { type: String, required: true },
  subCategory: { type: String },
  brand: { type: String },
  modelNumber: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  images: [{
    url: { type: String },
  }],
  blips: [{
    url: { type: String },
  }],
  stock: {
    type: Number,
    required: true,
    min: 0
  },
 
  shippingInfo: {
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'] }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['cm', 'in'] }
    },
    shippingMethods: [{
      name: String,
      estimatedDays: Number,
      cost: Number
    }]
  },
  returnPolicy: {
    allowed: { type: Boolean, default: true },
    periodInDays: { type: Number, default: 30 },
    conditions: [String]
  },
  stats: {
    views: { type: Number, default: 0 },
    lastRestocked: Date,
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 }
  },
  lowStockAlert: { type: Number, default: 5 },
  sku: { type: String, required: true },
  upc: { type: String },
  condition: {type: String},
  tags: [{ type: String }],
  colors: [{ type: String }],
  size: { type: String },
  material: { type: String },
  weight: { type: Number },
  dimensions: { type: String },
  shippingWeight: { type: Number },
  shippingDimensions: { type: String },
  taxClass: { type: String },
  taxRate: { type: Number },
  onSale: { type: Boolean, default: false },
  salePrice: { type: Number },
  warranty: { type: String },
  minimumPurchaseQuantity: { type: Number, default: 1 },
  vendor: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  reviews: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],
  logistics: {
    shippingOptions: [{ type: String }],
    deliveryTime: { type: String },
  },
  warehouseLocation: { type: String },
  status: { type: String, enum: ['draft', 'active'], default: 'draft' },
  ramSize: { type: String },
  storageCapacity: { type: String },
  screenSize: { type: String },
  resolution: { type: String },
  processor: { type: String },
  operatingSystem: { type: String },
  batteryLife: { type: String },
  connectivity: { type: String },
  ageRange: { type: String },
  ingredients: { type: String },
  scent: { type: String },
  calorieCount: { type: Number },
  compatibleDevices: { type: String },
  sportsType: { type: String },
  petType: { type: String },
  travelType: { type: String },
  gamingPlatform: { type: String },
  includedAccessories: { type: String },
  cleaningInstructions: { type: String },
  furnitureType: { type: String },
  durabilityRating: { type: String },
  energyEfficiency: { type: String },
  soundQuality: { type: String },
  waterproof: { type: Boolean },
  smartFeatures: { type: String },
  maxWeightCapacity: { type: Number },
  toyType: { type: String },
  musicGenre: { type: String },
  expirationDate: { type: Date },
  certifications: { type: String },
  ecoFriendly: { type: Boolean },
  originCountry: { type: String },
  careInstructions: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  inventory: {
    quantity: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    sku: { type: String, unique: true },
    barcode: { type: String },
  },
  variants: [{
    name: { type: String },
    options: [{
      value: { type: String },
      inventory: { type: Number, default: 0 },
      price: { type: Number },
      sku: { type: String },
    }]
  }],
  pricing: {
    compareAtPrice: { type: Number },
    costPerItem: { type: Number },
    profit: { type: Number },
    taxable: { type: Boolean, default: true },
    taxRate: { type: Number, default: 0 },
  },
  shipping: {
    weight: { type: Number, required: false },
    dimensions: {
      length: { type: Number, required: false },
      width: { type: Number, required: false },
      height: { type: Number, required: false }
    },
    freeShipping: { type: Boolean, default: false },
    shippingClass: { 
      type: String, 
      enum: ['standard', 'express', 'economy'],
      default: 'standard'
    },
    customShippingCost: { type: Number },
    restrictedLocations: [String],
  },
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
    slug: { type: String, unique: true },
  },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'archived', 'out_of_stock'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['visible', 'hidden', 'featured'],
    default: 'visible'
  },
  analytics: {
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    lastViewed: { type: Date },
    conversionRate: { type: Number, default: 0 },
  },
});

productSchema.pre('save', async function(next) {
  try {
    if (!this.inventory.sku) {
      this.inventory.sku = await generateSKU(this);
    }
    if (!this.seo.slug) {
      this.seo.slug = await generateSlug(this.name);
    }
    next();
  } catch (error) {
    next(error);
  }
});



module.exports = mongoose.model('Product', productSchema);
