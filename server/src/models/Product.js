const mongoose = require('mongoose');
const NotificationController = require('../controllers/notificationController');

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

// Sub-sub-variant Schema (e.g., wool, plastic, rubber)
const subSubVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },     // e.g., "wool", "plastic"
  value: { type: String, required: true },    // e.g., "wool", "plastic"
  price: { type: Number },
  stock: { type: Number, default: 0 },
  sku: { type: String },
  images: [{
    data: { type: String, required: true },
    contentType: { type: String },
    isDefault: { type: Boolean, default: false }
  }]
});

// Sub-variant Schema (e.g., small, medium)
const subVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },     // e.g., "small", "medium"
  value: { type: String, required: true },    // e.g., "small", "medium"
  price: { type: Number },
  stock: { type: Number, default: 0 },
  images: [{
    data: { type: String, required: true },
    contentType: { type: String },
  }],
  subSubVariants: [subSubVariantSchema]          // Array of material options
});

// Main variant type schema (Color)
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },     // e.g., "Color"
  value: { type: String, required: true },    // e.g., "red", "blue"
  price: { type: Number, required: true },

  totalStock: { type: Number },
  images: [{
    data: { type: String, required: true },
    contentType: { type: String },
  }],
  subVariants: [subVariantSchema],
});



// Add blip comment schema
const blipSchema = new mongoose.Schema({
  url: { type: String },
  contentType: { type: String },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' }],
  likesCount: { type: Number, default: 0 },
  comments: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

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
  subSubCategory: { type: String },
  brand: { type: String },
  modelNumber: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  images: [{
    url: { type: String },
  }],
  blips: [blipSchema],
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
    soldCount: { type: Number, default: 0 },
    lastViewed: { type: Date },
    lastRestocked: { type: Date }
  },
  lowStockAlert: { type: Number, default: 5 },
  sku: { type: String, required: true },
  upc: { type: String },
  condition: {type: String},
  tags: [{ type: String }],
  colors: { type: [String], required: false },
  size: { type: String, required: false },
  material: { type: String },
  weight: { type: Number },
  dimensions: { type: String },
  shippingWeight: { type: Number },
  shippingDimensions: { type: String },
  taxClass: { type: String },
  taxRate: { type: Number },
  warranty: { type: String },
  minimumPurchaseQuantity: { type: Number, default: 1 },
  vendor: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  reviews: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer', required: true },
    firstName: { type: String },
    lastName: { type: String },
    title: { type: String },
    rating: { type: Number },
    comment: { type: String },
    images: [{
      url: { type: String, required: true },
      contentType: { type: String }
    }],
    purchasedVariant: {
      color: { type: String },
      size: { type: String },
      material: { type: String }
    },
    createdAt: { type: Date, default: () => new Date().toISOString() },
    updatedAt: { type: Date }
  }],
  logistics: {
    shippingOptions: [{ type: String }],
    deliveryTime: { type: String },
  },
  warehouseLocation: { type: String },
  status: { type: String, enum: ['draft', 'active'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  inventory: {
    quantity: { type: Number, required: true, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    sku: { type: String, unique: true },
    barcode: { type: String },
  },
  variants: [variantSchema],
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
  // Jewelry fields
  jewelry_gemstonetype: { type: String },
  jewelry_metaltype: { type: String },
  jewelry_chainincluded: { type: Boolean },
  jewelry_weight: { type: Number },
  jewelry_dimensions: { type: String },
  jewelry_designstyle: { type: String },
  jewelry_length: { type: Number },
  jewelry_thickness: { type: Number },
  jewelry_clasptype: { type: String },
  jewelry_material: { type: String },
  jewelry_settingtype: { type: String },
  jewelry_closuretype: { type: String },
  jewelry_diameter: { type: Number },
  jewelry_finish: { type: String },
  jewelry_size: { type: String },
  jewelry_circumference: { type: Number },
  jewelry_adjustable: { type: Boolean },

  // Fashion fields
  fashion_material: { type: String },
  fashion_sizes: [{ type: String }],
  fashion_style: { type: String },
  fashion_sleevetype: { type: String },
  fashion_length: { type: String },
  fashion_heeltype: { type: String },
  fashion_closure: { type: String },
  fashion_occasion: { type: String },
  fashion_colors: [{ type: String }],
  fashion_stonetype: { type: String },
  fashion_fit: { type: String },
  fashion_patterns: [{ type: String }],
  fashion_pattern: { type: String },

  // Electronics fields
  electronics_screensize: { type: String },
  electronics_resolution: { type: String },
  electronics_smartfeatures: [{ type: String }],
  electronics_connectivityoptions: [{ type: String }],
  electronics_energyrating: { type: String },
  electronics_paneltype: { type: String },
  electronics_compatibility: { type: String },
  electronics_cablelength: { type: Number },
  electronics_supportedresolutions: [{ type: String }],
  electronics_storagecapacity: { type: String },
  electronics_remotetype: { type: String },
  electronics_appcompatibility: [{ type: String }],
  electronics_wifiversion: { type: String },
  electronics_channels: { type: Number },
  electronics_audiooutputpower: { type: Number },
  electronics_brand: { type: String },
  electronics_dimensions: { type: String },
  electronics_length: { type: Number },
  electronics_poweroutput: { type: Number },
  electronics_subwoofer: { type: Boolean },
  electronics_wallmountable: { type: Boolean },
  electronics_batterylife: { type: String },
  electronics_portabilityfeatures: [{ type: String }],
  electronics_waterresistancerating: { type: String },
  electronics_frequencyrange: { type: String },
  electronics_wirelessplugin: { type: String },
  electronics_weightrange: { type: String },
  electronics_resistancelevel: { type: String },
  electronics_padding: { type: String },
  electronics_thickness: { type: String },
  electronics_surfacetype: { type: String },
  electronics_capacity: { type: String },
  electronics_temperaturerating: { type: String },
  electronics_fit: { type: String },
  electronics_pattern: { type: String },
  electronics_spfrating: { type: String },

  // Travel fields
  travel_producttype: { type: String },
  travel_material: { type: String },
  travel_size: { type: String },
  travel_wheeltype: { type: String },
  travel_locktype: { type: String },
  travel_weight: { type: Number },
  travel_capacity: { type: Number },
  travel_features: [{ type: String }],
  travel_compartments: { type: Number },
  travel_voltage: { type: String },
  travel_certification: { type: String },
  travel_temperaturerating: { type: String },
  travel_insulationtype: { type: String },
  travel_spfrating: { type: String },

  // Sports & Outdoors fields
  sports_producttype: { type: String },
  sports_resistancetype: { type: String },
  sports_display: { type: String },
  sports_weightcapacity: { type: Number },
  sports_length: { type: Number },
  sports_connectivity: { type: String },
  sports_batterylife: { type: String },
  sports_weightrange: { type: String },
  sports_resistancelevel: { type: String },
  sports_padding: { type: String },
  sports_thickness: { type: String },
  sports_surfacetype: { type: String },
  sports_capacity: { type: String },
  sports_temperaturerating: { type: String },
  sports_stringtension: { type: String },
  sports_shoetype: { type: String },
  sports_size: { type: String },
  sports_features: [{ type: String }],

  // Health & Beauty fields
  healthbeauty_producttype: { type: String },
  healthbeauty_shade: { type: String },
  healthbeauty_coverage: { type: String },
  healthbeauty_skintype: { type: String },
  healthbeauty_finish: { type: String },
  healthbeauty_keyingredients: [{ type: String }],
  healthbeauty_spf: { type: Number },
  healthbeauty_crueltyfree: { type: Boolean },
  healthbeauty_eyeshadowtype: { type: String },
  healthbeauty_shadecount: { type: Number },
  healthbeauty_waterproof: { type: Boolean },
  healthbeauty_eyeliner: { type: String },
  healthbeauty_applicatortype: { type: String },
  healthbeauty_longlasting: { type: Boolean },
  healthbeauty_tint: { type: String },
  healthbeauty_nailpolishtype: { type: String },
  healthbeauty_quickdry: { type: Boolean },
  healthbeauty_cleansetype: { type: String },
  healthbeauty_keybenefits: [{ type: String }],
  healthbeauty_keybenefit: { type: String },
  healthbeauty_size: { type: String },
  healthbeauty_absorbencylevel: { type: String },
  healthbeauty_form: { type: String },
  healthbeauty_flavor: { type: String },
  healthbeauty_ingredients: [{ type: String }],
  healthbeauty_features: [{ type: String }],
  healthbeauty_usage: { type: String },

  // Home & Living fields
  home_producttype: { type: String },
  home_material: { type: String },
  home_frame: { type: String },
  home_dimensions: { type: String },
  home_batteryrequired: { type: Boolean },
  home_framematerial: { type: String },
  home_design: { type: String },
  home_height: { type: Number },
  home_theme: { type: String },
  home_seatingcapacity: { type: Number },
  home_bedsize: { type: String },
  home_adjustableheight: { type: Boolean },
  home_numbershelves: { type: Number },
  home_weatherproof: { type: Boolean },
  home_bulbtype: { type: String },
  home_adjustablebrightness: { type: Boolean },
  home_powersource: { type: String },
  home_numberbulbs: { type: Number },
  home_wattage: { type: Number },
  home_colortemperature: { type: String },
  home_capacity: { type: String },
  home_lidincluded: { type: Boolean },
  home_stackable: { type: Boolean },
  home_foldable: { type: Boolean },
  home_threadcount: { type: Number },
  home_absorbent: { type: Boolean },
  home_ergonomichandle: { type: Boolean },
  home_portable: { type: Boolean },

  // Toys fields
  toys_producttype: { type: String },
  toys_agegroup: { type: String },
  toys_material: { type: String },
  toys_screensize: { type: String },
  toys_features: [{ type: String }],
  toys_batterylife: { type: String },
  toys_instrumenttype: { type: String },
  toys_topics: [{ type: String }],
  toys_agerange: { type: String },
  toys_character: { type: String },
  toys_weightlimit: { type: Number },
  toys_toolsincluded: [{ type: String }],
  toys_activity: { type: String },
  toys_finish: { type: String },
  toys_piecescount: { type: Number },
  toys_numberofplayers: { type: Number },
  toys_brand: { type: String },
  toys_series: { type: String },
  toys_numberofpieces: { type: Number },
  toys_theme: { type: String },

  // Gaming fields
  gaming_model: { type: String },
  gaming_accessories: [{ type: String }],
  gaming_storagecapacity: { type: String },
  gaming_type: { type: String },
  gaming_features: [{ type: String }],
  gaming_batterylife: { type: String },
  gaming_weightrange: { type: String },
  gaming_resistancelevel: { type: String },
  gaming_padding: { type: String },
  gaming_thickness: { type: String },
  gaming_surfacetype: { type: String },
  gaming_capacity: { type: String },
  gaming_temperaturerating: { type: String },
  gaming_stringtension: { type: String },
  gaming_shoetype: { type: String },
  gaming_size: { type: String },
  gaming_features: [{ type: String }],

  // Appliances fields
  appliances_producttype: { type: String },
  appliances_capacity: { type: Number },
  appliances_energyefficiency: { type: String },
  appliances_coolingtechnology: { type: String },
  appliances_features: [{ type: String }],
  appliances_power: { type: Number },
  appliances_coolingcapacity: { type: Number },
  appliances_energyrating: { type: String },
  appliances_heatingtechnology: { type: String },
  appliances_bagless: { type: Boolean },
  appliances_suctionpower: { type: Number },
  appliances_tankcapacity: { type: Number },
  appliances_heatuptime: { type: Number },
  appliances_coveragearea: { type: Number },
  appliances_noiselevel: { type: Number },
  appliances_outputpower: { type: Number },
  appliances_fueltype: { type: String },

  // Kitchen & Dining fields
  kitchen_material: { type: String },
  kitchen_size: { type: String },
  kitchen_inductioncompatible: { type: Boolean },
  kitchen_capacity: { type: Number },
  kitchen_lidincluded: { type: Boolean },
  kitchen_handletype: { type: String },
  kitchen_ovensafe: { type: Boolean },
  kitchen_heatresistance: { type: String },
  kitchen_numberofcups: { type: Number },
  kitchen_leakproof: { type: Boolean },
  kitchen_rackincluded: { type: Boolean },
  kitchen_shapetype: { type: String },
  kitchen_dishwashersafe: { type: Boolean },
  kitchen_length: { type: Number },
  kitchen_lockingmechanism: { type: String },
  kitchen_bladetype: { type: String },
  kitchen_bladematerial: { type: String },
  kitchen_bladelength: { type: Number },
  kitchen_finish: { type: String },
  kitchen_sharpeningangle: { type: Number },
  kitchen_multistage: { type: Boolean },
  kitchen_jarcapacity: { type: Number },
  kitchen_features: [{ type: String }],

  // Computing fields
  computing_screensize: { type: String },
  computing_processor: { type: String },
  computing_ram: { type: String },
  computing_storage: { type: String },
  computing_operatingsystem: { type: String },
  computing_touchscreen: { type: Boolean },
  computing_batterylife: { type: String },
  computing_type: { type: String },
  computing_graphics: { type: String },
  computing_vram: { type: String },
  computing_features: [{ type: String }],
  computing_connectivity: [{ type: String }],
  computing_dpi: { type: Number },
  computing_panelType: { type: String },
  computing_refreshRate: { type: String },
  computing_microphone: { type: Boolean },
  computing_security: { type: String },
  computing_cores: { type: Number },
  computing_clockspeed: { type: String },
  computing_noiselevel: { type: String },
  computing_resolution: { type: String },
  computing_compatibility: { type: String },
  computing_coverage: { type: String },
  computing_speed: { type: String },
  computing_printspeed: { type: String },
  computing_brand: { type: String },
  computing_vramsize: { type: String },

  // Phones fields
  phones_operatingsystem: { type: String },
  phones_screensize: { type: String },
  phones_storagecapacity: { type: String },
  phones_camera: { type: String },
  phones_batterylife: { type: String },
  phones_connectivity: [{ type: String }],
  phones_simtype: { type: String },
  phones_condition: { type: String },
  phones_warranty: { type: String },

  // Tablets fields
  tablets_models: {type: String},
  tablets_storageCapacity: {type: String},
  tablets_Connectivity: {type: String},
  tablets_batteryLife: {type: String},
  tablets_Durability: {type: String},
  tablets_ParentalControls: {type: Boolean},
  tablets_PreinstalledApps: {type: Boolean},

  // Mobile Accessories fields
  mobileAccessories_Type: {type: String},
  mobileAccessories_Output: {type: String},
  mobileAccessories_Connector: {type: String},
  mobileAccessories_Features: {type: String},
  mobileAccessories_Capacity: {type: String},
  mobileAccessories_Input: {type: String},
  mobileAccessories_Material: {type: String},
  mobileAccessories_Adjustable: {type: Boolean},

  //wearable fields
  wearable_Type: {type: String},
  wearable_Connectivity: {type: String},
  wearable_Features: {type: String},
  wearable_Material: {type: String},
});



// Ensure virtual fields are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.pre('save', async function(next) {
  try {
    if (!this.inventory.sku) {
      this.inventory.sku = await generateSKU(this);
    }
    if (!this.seo.slug) {
      this.seo.slug = await generateSlug(this.name);
    }

    // Check for low stock
    if (this.inventory.quantity <= this.inventory.lowStockThreshold) {
      try {
        await NotificationController.createNotification(this.seller, 'low_stock', {
          productId: this._id,
          productName: this.name,
          currentStock: this.inventory.quantity,
          threshold: this.inventory.lowStockThreshold
        });
      } catch (error) {
        console.error('Error creating low stock notification:', error);
      }
    }

    // Update counts
    if (this.isModified('blips')) {
      this.blips.forEach(blip => {
        blip.likesCount = blip.likes.length;
        blip.commentsCount = blip.comments.length;
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});


// Add this method to the schema
productSchema.methods.updateStock = async function(quantity, operation) {
  if (operation === 'add') {
    this.stock += parseInt(quantity);
  } else if (operation === 'subtract') {
    if (this.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    this.stock -= parseInt(quantity);
  } else if (operation === 'set') {
    this.stock = parseInt(quantity);
  } else {
    throw new Error('Invalid operation. Use "add", "subtract", or "set"');
  }

  // Update the lastRestocked date if adding stock
  if (operation === 'add' || operation === 'set') {
    this.stats.lastRestocked = new Date();
  }

  return this.save();
};

// Add a method to check low stock
productSchema.methods.isLowStock = function() {
  return this.stock <= this.lowStockAlert;
};

module.exports = mongoose.model('Product', productSchema);
