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
    isDefault: { type: Boolean, default: false },
    resizedImages: [{
      width: { type: Number },
      url: { type: String }
    }]
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
    resizedImages: [{
      width: { type: Number },
      url: { type: String }
    }]
  }],
  subSubVariants: [subSubVariantSchema]          // Array of material options
});

// Main variant type schema (Color)
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },     // e.g., "Color"
  value: { type: String, required: true },    // e.g., "red", "blue"
  price: { type: Number, required: true },
  discount: {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: {
      type: Number,
      default: 0,
      set: function (v) {
        return typeof v === 'number' ? Math.ceil(v) : v;
      }
    },
    startDate: { type: Date },
    endDate: { type: Date },
    couponName: { type: String },
    discountedPrice: { type: Number }
  },
  totalStock: { type: Number },
  images: [{
    data: { type: String, required: true },
    contentType: { type: String },
    resizedImages: [{
      width: { type: Number },
      url: { type: String }
    }]
  }],
  subVariants: [subVariantSchema],
});

// Add virtual field for variant discounted price
variantSchema.virtual('discountedPrice').get(function () {
  if (!this.discount.isActive) return this.price;

  const now = new Date();
  if (this.discount.startDate && this.discount.startDate > now) return this.price;
  if (this.discount.endDate && this.discount.endDate < now) return this.price;

  if (this.discount.type === 'percentage') {
    return Math.ceil((this.price * (100 - this.discount.value)) / 100);
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
});

// Add blip comment schema
const blipSchema = new mongoose.Schema({
  url: { type: String },
  contentType: { type: String },
  thumbnail: { type: String },
  key: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' }],
  likesCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  viewedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'viewedBy.userType' },
    userType: { type: String, enum: ['Buyer', 'Seller'] },
    lastViewed: { type: Date, default: Date.now }
  }],
  comments: [{
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    likes: [{
      user: { type: mongoose.Schema.Types.ObjectId, refPath: 'comments.likes.userType' },
      userType: { type: String, enum: ['Buyer', 'Seller'] },
      createdAt: { type: Date, default: Date.now }
    }],
    likesCount: { type: Number, default: 0 },
    replies: [{
      user: { type: mongoose.Schema.Types.ObjectId, refPath: 'comments.replies.userType' },
      userType: { type: String, enum: ['Buyer', 'Seller'] },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
      likes: [{
        user: { type: mongoose.Schema.Types.ObjectId, refPath: 'comments.replies.likes.userType' },
        userType: { type: String, enum: ['Buyer', 'Seller'] },
        createdAt: { type: Date, default: Date.now }
      }],
      likesCount: { type: Number, default: 0 }
    }],
    repliesCount: { type: Number, default: 0 }
  }],
  commentsCount: { type: Number, default: 0 },
  processed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discount: {
    isActive: { type: Boolean, default: false },
    type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    value: {
      type: Number,
      default: 0,
      set: function (v) {
        return typeof v === 'number' ? Math.ceil(v) : v;
      }
    },
    startDate: { type: Date },
    endDate: { type: Date },
    couponName: { type: String },
    discountedPrice: { type: Number }
  },
  priceVariants: [{
    size: { type: String },
    price: { type: Number },
  }],
  category: { type: String, required: true },
  subCategory: { type: String },
  subSubCategory: { type: String },
  brand: { type: String },
  modelNumber: { type: String },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    autopopulate: {
      select: '_id firstName lastName businessName email phoneNumber storeName storeAvatar storeBanner aboutStore stats isVerified createdAt warehouseDetails shippingOptions offersStorePickup'
    }
  },
  images: [{
    url: { type: String },
    resizedImages: [{
      width: { type: Number },
      url: { type: String }
    }]
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
    lastRestocked: { type: Date },
    averageRating: { type: Number },
    totalReviews: { type: Number }
  },
  lowStockAlert: { type: Number, default: 5 },
  sku: { type: String },
  upc: { type: String },
  condition: { type: String },
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
    updatedAt: { type: Date },
    reply: {
      content: { type: String },
      createdAt: { type: Date },
      updatedAt: { type: Date }
    }
  }],
  logistics: {
    shippingOptions: [{ type: String }],
    deliveryTime: { type: String },
  },
  warehouseLocation: { type: String },
  status: {
    type: String,
    enum: ['draft', 'active', 'offline_auction'],
    default: 'draft'
  },
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
  isFreeShippingEnabled: { type: Boolean, default: false },
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
    slug: { type: String, unique: true },
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
  tablets_models: { type: String },
  tablets_storageCapacity: { type: String },
  tablets_Connectivity: { type: String },
  tablets_batteryLife: { type: String },
  tablets_Durability: { type: String },
  tablets_ParentalControls: { type: Boolean },
  tablets_PreinstalledApps: { type: Boolean },

  // Mobile Accessories fields
  mobileAccessories_Type: { type: String },
  mobileAccessories_Output: { type: String },
  mobileAccessories_Connector: { type: String },
  mobileAccessories_Features: { type: String },
  mobileAccessories_Capacity: { type: String },
  mobileAccessories_Input: { type: String },
  mobileAccessories_Material: { type: String },
  mobileAccessories_Adjustable: { type: Boolean },

  //wearable fields
  wearable_Type: { type: String },
  wearable_Connectivity: { type: String },
  wearable_Features: { type: String },
  wearable_Material: { type: String },

  //fashion fields
  fashion_material: {
    type: String,
    default: ''
  },
  fashion_sizes: {
    type: [String],
    default: []
  },
  fashion_style: {
    type: String,
    default: ''
  },
  fashion_colors: {
    type: [String],
    default: []
  },
  fashion_closure: {
    type: String,
    default: ''
  },
  fashion_accessoryType: {
    type: String,
    default: ''
  },

  // Women-specific
  fashion_sleeveType: {
    type: String,
    default: ''
  },
  fashion_length: {
    type: String,
    default: ''
  },
  fashion_heelType: {
    type: String,
    default: ''
  },
  fashion_occasion: {
    type: String,
    default: ''
  },
  fashion_stoneType: {
    type: String,
    default: ''
  },
  fashion_bagType: {
    type: String,
    default: ''
  },

  // Men-specific
  fashion_fit: {
    type: String,
    default: ''
  },
  fashion_shoeType: {
    type: String,
    default: ''
  },
  fashion_traditionalType: {
    type: String,
    default: ''
  },

  // Kids-specific
  fashion_pattern: {
    type: String,
    default: ''
  },
  fashion_kidShoeType: {
    type: String,
    default: ''
  },

  // Baby & Kids Category Backend Props

  // Apparel & Accessories
  baby_productType: {
    type: [String],
    default: []
  },
  baby_size: {
    type: String,
    default: ''
  },
  baby_material: {
    type: [String],
    default: []
  },
  baby_pattern: {
    type: [String],
    default: []
  },
  baby_fit: {
    type: String,
    default: ''
  },
  baby_features: {
    type: [String],
    default: []
  },
  baby_color: {
    type: String,
    default: ''
  },
  baby_closure: {
    type: [String],
    default: []
  },

  // Diapering
  baby_diaperType: {
    type: [String],
    default: []
  },
  baby_absorption: {
    type: String,
    default: ''
  },
  baby_bagType: {
    type: [String],
    default: []
  },
  baby_wipeType: {
    type: [String],
    default: []
  },

  // Feeding
  baby_feedingType: {
    type: [String],
    default: []
  },
  baby_feedingProductType: {
    type: [String],
    default: []
  },
  baby_capacity: {
    type: String,
    default: ''
  },

  // Bathing & Skin Care
  baby_bathingProductType: {
    type: [String],
    default: []
  },
  baby_ingredients: {
    type: [String],
    default: []
  },

  // Toys & Play
  baby_toyType: {
    type: [String],
    default: []
  },
  baby_toyFeatures: {
    type: [String],
    default: []
  },

  // Health & healthBeauty Backend Schema Props

  // Makeup
  healthBeauty_makeupType: {
    type: [String],
    default: []
  },
  healthBeauty_finish: {
    type: [String],
    default: []
  },
  healthBeauty_skinType: {
    type: [String],
    default: []
  },
  healthBeauty_coverage: {
    type: String,
    default: ''
  },
  healthBeauty_applicator: {
    type: [String],
    default: []
  },
  healthBeauty_ingredients: {
    type: [String],
    default: []
  },
  healthBeauty_crueltyFree: {
    type: Boolean,
    default: false
  },
  healthBeauty_waterproof: {
    type: Boolean,
    default: false
  },
  healthBeauty_longLasting: {
    type: Boolean,
    default: false
  },
  healthBeauty_quickDry: {
    type: Boolean,
    default: false
  },

  // Skin Care
  healthBeauty_skinCareType: {
    type: [String],
    default: []
  },
  healthBeauty_benefits: {
    type: [String],
    default: []
  },
  healthBeauty_usageTime: {
    type: [String],
    default: []
  },
  healthBeauty_spfLevel: {
    type: String,
    default: ''
  },
  healthBeauty_spfType: {
    type: String,
    default: ''
  },
  healthBeauty_spf: {
    type: Boolean,
    default: false
  },
  healthBeauty_waterResistant: {
    type: Boolean,
    default: false
  },
  healthBeauty_tinted: {
    type: Boolean,
    default: false
  },

  // Hair Care
  healthBeauty_hairProductType: {
    type: [String],
    default: []
  },
  healthBeauty_hairType: {
    type: [String],
    default: []
  },
  healthBeauty_holdLevel: {
    type: String,
    default: ''
  },
  healthBeauty_material: {
    type: [String],
    default: []
  },
  healthBeauty_heatSettings: {
    type: String,
    default: ''
  },
  healthBeauty_voltage: {
    type: String,
    default: ''
  },
  healthBeauty_scented: {
    type: Boolean,
    default: false
  },
  healthBeauty_heatProtection: {
    type: Boolean,
    default: false
  },

  // Fragrances
  healthBeauty_fragranceType: {
    type: [String],
    default: []
  },
  healthBeauty_scentFamily: {
    type: [String],
    default: []
  },
  healthBeauty_longevity: {
    type: String,
    default: ''
  },
  healthBeauty_volume: {
    type: String,
    default: ''
  },

  // Personal Care
  healthBeauty_personalCareType: {
    type: [String],
    default: []
  },
  healthBeauty_specialty: {
    type: [String],
    default: []
  },
  healthBeauty_size: {
    type: String,
    default: ''
  },
  healthBeauty_absorbencyLevel: {
    type: String,
    default: ''
  },
  healthBeauty_fluoride: {
    type: Boolean,
    default: false
  },
  healthBeauty_antiperspirant: {
    type: Boolean,
    default: false
  },
  healthBeauty_scentFree: {
    type: Boolean,
    default: false
  },

  // Vitamins & Supplements
  healthBeauty_supplementType: {
    type: [String],
    default: []
  },
  healthBeauty_supplementForm: {
    type: [String],
    default: []
  },
  healthBeauty_supplementBenefits: {
    type: [String],
    default: []
  },
  healthBeauty_supplementFlavor: {
    type: String,
    default: ''
  },
  healthBeauty_supplementIngredients: {
    type: [String],
    default: []
  },

  // Bath & Body
  healthBeauty_bathType: {
    type: [String],
    default: []
  },

  // Spa & Relaxation
  healthBeauty_spaType: {
    type: [String],
    default: []
  },
  healthBeauty_features: {
    type: [String],
    default: []
  },
  healthBeauty_usage: {
    type: String,
    default: ''
  },

  // Foot Care
  healthBeauty_footCareType: {
    type: [String],
    default: []
  },
  // Consoles
  gaming_consoleModel: {
    type: String,
    default: ''
  },
  gaming_accessories: {
    type: [String],
    default: []
  },
  gaming_storageCapacity: {
    type: String,
    default: ''
  },
  gaming_features: {
    type: [String],
    default: []
  },
  gaming_edition: {
    type: String,
    default: ''
  },
  gaming_bundled: {
    type: Boolean,
    default: false
  },

  // Games
  gaming_title: {
    type: String,
    default: ''
  },
  gaming_genre: {
    type: [String],
    default: []
  },
  gaming_rating: {
    type: String,
    default: ''
  },
  gaming_region: {
    type: String,
    default: ''
  },
  gaming_compatibility: {
    type: [String],
    default: []
  },

  // Accessories
  gaming_accessoryType: {
    type: [String],
    default: []
  },
  gaming_resolution: {
    type: String,
    default: ''
  },
  gaming_connectionType: {
    type: String,
    default: ''
  },

  // Virtual Reality
  gaming_vrModel: {
    type: String,
    default: ''
  },
  gaming_vrFeatures: {
    type: [String],
    default: []
  },
  gaming_vrGenres: {
    type: [String],
    default: []
  },
  gaming_vrCompatibility: {
    type: [String],
    default: []
  },

  // Gaming Furniture
  gaming_furnitureType: {
    type: [String],
    default: []
  },
  gaming_furnitureFeatures: {
    type: [String],
    default: []
  },
  gaming_furnitureMaterial: {
    type: [String],
    default: []
  },
  gaming_weightCapacity: {
    type: String,
    default: ''
  },
  // Add offline auction fields
  auction: {
    minBid: {
      type: Number,
      required: function () {
        return this.status === 'offline_auction';
      }
    },
    maxBid: {
      type: Number,
      required: function () {
        return this.status === 'offline_auction';
      },
      validate: {
        validator: function (value) {
          if (this.status === 'offline_auction') {
            return value > this.auction.minBid;
          }
          return true;
        },
        message: 'Max bid must be greater than min bid'
      }
    },
    endOnMaxBid: {
      type: Boolean,
      default: false,
      required: function () {
        return this.status === 'offline_auction';
      }
    },
    startDate: {
      type: Date,
      required: function () {
        return this.status === 'offline_auction';
      }
    },
    endDate: {
      type: Date,
      required: function () {
        return this.status === 'offline_auction';
      },
      validate: {
        validator: function (value) {
          if (this.status === 'offline_auction') {
            return value > this.auction.startDate;
          }
          return true;
        },
        message: 'End date must be after start date'
      }
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'ended'],
      default: 'scheduled'
    },
    daysLeft: {
      type: Number,
      default: null
    },
    bids: [{
      buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer',
        required: true
      },
      amount: {
        type: Number,
        required: true,
        validate: {
          validator: function (value) {
            const product = this.parent().parent();
            // Only validate minimum bid
            if (value < product.auction.minBid) {
              return false;
            }
            return true;
          },
          message: 'Bid amount must be at least the minimum bid value'
        }
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'outbid', 'won', 'lost'],
        default: 'active'
      }
    }],
    currentHighestBid: {
      amount: { type: Number, default: null },
      buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer',
        default: null
      }
    },
    winner: {
      buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Buyer',
        default: null
      },
      bidAmount: { type: Number, default: null },
      winningDate: { type: Date }
    }
  }
});

// Add a virtual field for the discounted price
productSchema.virtual('discountedPrice').get(function () {
  if (!this.discount.isActive) return this.price;

  const now = new Date();
  if (this.discount.startDate && this.discount.startDate > now) return this.price;
  if (this.discount.endDate && this.discount.endDate < now) return this.price;

  if (this.discount.type === 'percentage') {
    return Math.ceil((this.price * (100 - this.discount.value)) / 100);
  } else {
    return Math.max(0, this.price - this.discount.value);
  }
});

// Ensure virtual fields are included when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.pre('save', async function (next) {
  try {
    if (!this.inventory.sku) {
      this.inventory.sku = await generateSKU(this);
    }
    if (!this.seo.slug) {
      this.seo.slug = await generateSlug(this.name);
    }

    // Update counts
    if (this.isModified('blips')) {
      this.blips.forEach(blip => {
        blip.likesCount = blip.likes.length;

        // Update comment likes count and replies count
        blip.comments.forEach(comment => {
          comment.likesCount = comment.likes ? comment.likes.length : 0;
          comment.repliesCount = comment.replies ? comment.replies.length : 0;

          // Update reply likes count
          if (comment.replies) {
            comment.replies.forEach(reply => {
              reply.likesCount = reply.likes ? reply.likes.length : 0;
            });
          }
        });

        // Calculate total comments count (comments + all replies)
        const totalReplies = blip.comments.reduce((total, comment) => {
          return total + (comment.replies ? comment.replies.length : 0);
        }, 0);
        blip.commentsCount = blip.comments.length + totalReplies;
      });
    }

    // Only process if it's an offline auction and status isn't manually set to ended
    if (this.status === 'offline_auction' && this.auction.status !== 'ended') {
      const now = new Date();

      // Calculate auction status and days left
      if (this.auction.startDate > now) {
        this.auction.status = 'scheduled';
        this.auction.daysLeft = Math.ceil((this.auction.startDate - now) / (1000 * 60 * 60 * 24));
      } else if (this.auction.endDate > now) {
        this.auction.status = 'ongoing';
        this.auction.daysLeft = Math.ceil((this.auction.endDate - now) / (1000 * 60 * 60 * 24));
      } else {
        this.auction.status = 'ended';
        this.auction.daysLeft = 0;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

productSchema.methods.hasValidDiscount = function () {
  if (!this.discount.isActive) return false;

  const now = new Date();
  if (this.discount.startDate && this.discount.startDate > now) return false;
  if (this.discount.endDate && this.discount.endDate < now) return false;

  return true;
};

// Add middleware to automatically deactivate expired discounts
productSchema.pre('save', function (next) {
  const now = new Date();
  if (this.discount.isActive && this.discount.endDate && this.discount.endDate < now) {
    this.discount.isActive = false;
  }
  next();
});

// Add this method to the schema
productSchema.methods.updateStock = async function (quantity, operation) {
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
productSchema.methods.isLowStock = function () {
  return this.stock <= this.lowStockAlert;
};

// Add this after the schema definition
productSchema.plugin(require('mongoose-autopopulate'));

// Add validation for price requirement on regular products
productSchema.pre('validate', function (next) {
  if (this.status === 'active' && !this.price) {
    this.invalidate('price', 'Price is required for active products');
  }
  next();
});

// Add this before module.exports
productSchema.methods.placeBid = async function (buyerId, bidAmount) {
  if (this.status !== 'offline_auction') {
    throw new Error('This product is not an auction item');
  }

  const now = new Date();
  if (now < this.auction.startDate) {
    throw new Error('Auction has not started yet');
  }
  if (now > this.auction.endDate) {
    throw new Error('Auction has ended');
  }

  if (bidAmount < this.auction.minBid) {
    throw new Error('Bid amount is below minimum bid');
  }

  // Check if we should end the auction (max bid reached and endOnMaxBid is true)
  if (this.auction.endOnMaxBid && bidAmount >= this.auction.maxBid) {
    console.log('Max bid reached, ending auction:', {
      productId: this._id,
      maxBid: this.auction.maxBid,
      bidAmount: bidAmount
    });

    // First update the auction status directly in the database
    const result = await this.constructor.findOneAndUpdate(
      {
        _id: this._id,
        'auction.status': { $ne: 'ended' } // Only update if not already ended
      },
      {
        $set: {
          'auction.status': 'ended',
          'auction.winner': {
            buyer: buyerId,
            bidAmount: bidAmount,
            winningDate: new Date()
          },
          'auction.currentHighestBid': {
            amount: bidAmount,
            buyer: buyerId
          },
          'auction.bids': this.auction.bids
        }
      },
      { new: true }
    );

    if (!result) {
      console.error('Failed to update auction status - auction may already be ended');
      throw new Error('Failed to end auction');
    }

    // Update the current instance to match the database
    this.auction.status = 'ended';
    this.auction.winner = {
      buyer: buyerId,
      bidAmount: bidAmount,
      winningDate: new Date()
    };

    // Update bid statuses
    this.auction.bids = this.auction.bids.map(bid => ({
      ...bid,
      status: bid.buyer.toString() === buyerId.toString() ? 'won' : 'lost'
    }));

    // Save the bid status updates
    await this.save();

    // Schedule order creation
    try {
      const agenda = require('../config/agenda').agenda;
      await agenda.now('create-auction-winner-order', { productId: this._id });
      console.log('Scheduled auction winner order creation for max bid:', this._id);
    } catch (scheduleError) {
      console.error('Failed to schedule auction winner order creation:', {
        productId: this._id,
        error: scheduleError.message
      });
    }

    return { ...this.auction.currentHighestBid, auctionEnded: true };
  }

  // If not ending the auction, just save the new bid
  await this.save();
  return { ...this.auction.currentHighestBid, auctionEnded: false };
};

// Add this before module.exports
productSchema.methods.endAuction = async function (maxBidReached = false, io = null) {
  console.log(`Starting endAuction method for product: ${this._id}, maxBidReached: ${maxBidReached}`);

  if (this.status !== 'offline_auction' ||
    (this.auction.status !== 'ongoing' && !maxBidReached)) {
    console.error(`Cannot end auction - invalid status: product status=${this.status}, auction status=${this.auction.status}`);
    throw new Error('Cannot end auction - invalid status');
  }

  console.log(`Setting auction status to ended for product: ${this._id}`);
  this.auction.status = 'ended';

  // Always set the winner to the highest bidder when ending auction
  if (this.auction.currentHighestBid && this.auction.currentHighestBid.buyer) {
    console.log(`Setting winner for auction: ${this._id}`, {
      buyerId: this.auction.currentHighestBid.buyer,
      bidAmount: this.auction.currentHighestBid.amount
    });

    // Set the winner
    this.auction.winner = {
      buyer: this.auction.currentHighestBid.buyer,
      bidAmount: this.auction.currentHighestBid.amount,
      winningDate: new Date()
    };

    // Update bid statuses
    console.log(`Updating bid statuses for ${this.auction.bids.length} bids`);
    this.auction.bids.forEach(bid => {
      if (bid.buyer.toString() === this.auction.winner.buyer.toString()) {
        bid.status = 'won';
      } else {
        bid.status = 'lost';
      }
    });

    // Schedule order creation job
    try {
      console.log(`Attempting to schedule order creation for auction winner: ${this._id}`);
      const agenda = require('../config/agenda').agenda;

      // Check if agenda is properly initialized
      if (!agenda) {
        console.error('Agenda instance is not available or not properly initialized');
        throw new Error('Agenda not initialized');
      }

      // Check if an order already exists for this auction
      const Order = mongoose.model('Order');
      const existingOrder = await Order.findOne({
        channel: 'auction',
        'items.product': this._id
      });

      if (existingOrder) {
        console.log('Order already exists for auction product:', {
          productId: this._id,
          orderId: existingOrder._id,
          orderStatus: existingOrder.items[0].status
        });
        return;
      }

      await agenda.now('create-auction-winner-order', { productId: this._id });
      console.log('Successfully scheduled auction winner order creation for product:', this._id);
    } catch (error) {
      console.error('Failed to schedule auction winner order creation:', {
        productId: this._id,
        error: error.message,
        stack: error.stack
      });
    }
  } else {
    console.log(`No winner set for auction: ${this._id} - no highest bid found`);
  }

  await this.save();
  console.log(`Auction ${this._id} successfully ended and saved`);

  // Emit WebSocket event if io is provided
  if (io) {
    // Populate winner details
    const populatedProduct = await this.constructor.findById(this._id)
      .populate({
        path: 'auction.winner.buyer',
        select: 'firstName lastName profileImage'
      });

    const winnerData = populatedProduct && populatedProduct.auction.winner ? {
      productId: this._id,
      winner: {
        buyer: {
          _id: populatedProduct.auction.winner.buyer._id,
          firstName: populatedProduct.auction.winner.buyer.firstName,
          lastName: populatedProduct.auction.winner.buyer.lastName,
          profileImage: populatedProduct.auction.winner.buyer.profileImage
        },
        bidAmount: populatedProduct.auction.winner.bidAmount,
        winningDate: populatedProduct.auction.winner.winningDate
      }
    } : {
      productId: this._id,
      winner: null
    };

    // Emit to authenticated namespace
    io.to(`auction_${this._id}`).emit('auction_ended', winnerData);

    // Also emit to public namespace if available
    if (io.of && typeof io.of === 'function') {
      try {
        const publicNamespace = io.of('/public');
        if (publicNamespace) {
          publicNamespace.to(`auction_details_${this._id}`).emit('auction_ended', winnerData);
        }
      } catch (err) {
        console.error('Error emitting to public namespace:', err);
      }
    }
  }

  return this.auction.winner;
};

// Middleware to update seller stats when product reviews change
productSchema.post('save', async function () {
  try {
    // Only trigger updates if this product has reviews
    if (this.reviews && this.reviews.length > 0) {
      // Calculate product review statistics
      const ratings = this.reviews.map(review => review.rating).filter(Boolean);
      const totalRatings = ratings.length;

      if (totalRatings > 0) {
        // Calculate average product rating
        const sumRatings = ratings.reduce((sum, rating) => sum + rating, 0);
        const averageRating = parseFloat((sumRatings / totalRatings).toFixed(1));

        // Update product stats if needed
        if (this.stats.averageRating !== averageRating || this.stats.totalReviews !== totalRatings) {
          // Use updateOne to avoid triggering the post-save middleware again
          await this.constructor.updateOne(
            { _id: this._id },
            {
              $set: {
                'stats.averageRating': averageRating,
                'stats.totalReviews': totalRatings
              }
            }
          );

          console.log(`Updated product (${this._id}) stats: avgRating=${averageRating}, totalReviews=${totalRatings}`);
        }
      }

      // Get the seller and update their stats
      const Seller = mongoose.model('Seller');
      const seller = await Seller.findById(this.seller);

      if (seller) {
        // Set flag to update product rating stats
        seller._updateProductRatingStats = true;
        await seller.save();

        console.log(`Updated seller (${seller._id}) stats based on product (${this._id}) reviews`);
      }
    }
  } catch (error) {
    console.error('Error in product post-save middleware for stats:', error);
  }
});

module.exports = mongoose.model('Product', productSchema);
