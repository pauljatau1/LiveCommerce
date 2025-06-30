const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Notification = require('../models/Notification');
const Buyer = require('../models/Buyer');
const axios = require('axios'); // For Paystack API calls
const sgMail = require('@sendgrid/mail');
const terminalAPI = axios.create({
  baseURL: 'https://sandbox.terminal.africa/v1',
  headers: {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const mongoose = require('mongoose');
const WebhookService = require('../services/WebhookService');
const { 
  handleShipmentCreated, 
  handleShipmentInTransit, 
  handleShipmentDelivered 
} = require('../webhooks/terminalWebhook');
const { 
  createNotification, 
  createBuyerNotification,
  handleOrderCreationNotifications
} = require('../controllers/notificationController');
const Category = require('../models/Category');
const { v4: uuidv4 } = require('uuid');
const { agenda } = require('../config/agenda');
const crypto = require('crypto');
const notificationController = require('../controllers/notificationController');
const mixpanel = require('../config/mixpanel');
const { trackPurchase } = require('../controllers/campaignController');

// Initialize Paystack
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "sk_test_REDACTED";
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

// Initialize Fez API configuration
const FEZ_API_URL = process.env.FEZ_API_URL;
const FEZ_BEARER_TOKEN = process.env.FEZ_BEARER_TOKEN;
const FEZ_SECRET_KEY = process.env.FEZ_SECRET_KEY;

// Initialize Fez Webhook
const initializeFezWebhook = async () => {
  try {
    console.log('🔄 Initializing Fez Delivery webhook...');
    
    // Get a fresh authentication token
    const authToken = await getFezAuthToken();
    
    // Define the webhook URL based on environment
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.BASE_URL}/api/webhooks/fez`
      : `${process.env.WEBHOOK_URL || 'https://auqli.com'}/api/webhooks/fez`;
    
    console.log(`📡 Registering Fez webhook at: ${webhookUrl}`);
    
    // Register the webhook with Fez
    const response = await axios.post(`${FEZ_API_URL}/webhooks/store`, 
      { webhook: webhookUrl },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'secret-key': process.env.FEZ_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.status === 'Success') {
      console.log('✅ Fez webhook registered successfully:', {
        webhook: response.data.data.webhook,
        webhooks: response.data.data.webhooks
      });
    } else {
      console.error('❌ Failed to register Fez webhook:', response.data);
    }
  } catch (error) {
    console.error('❌ Error initializing Fez webhook:', error.message);
    
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
};

// At the top with other initializations
const initializeTerminalWebhook = async () => {
  try {
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? `${process.env.BASE_URL}/webhooks/terminal`
      : `${process.env.WEBHOOK_URL}`;

    // Define the events we want to track
    const events = [
      'shipment.created',
      'shipment.in-transit',
      'shipment.updated',
      'shipment.delivered'
    ];

    // Create a webhook for each event
    for (const event of events) {
      const webhookData = {
        name: `Shipment ${event.split('.').join(' ')}`,
        url: webhookUrl,
        description: `Webhook for tracking ${event} events`,
        events: [event],
        live: process.env.NODE_ENV === 'production',
        active: true
      };

      // console.log(`Creating webhook for event: ${event}`);

      try {
        const response = await terminalAPI.post('/webhooks', webhookData);
        
        if (response.data && response.data.status) {
          // console.log(`Successfully created webhook for ${event}:`, {
          //   webhookId: response.data.data?.id,
          //   event: event
          // });
        } else {
          console.error(`Failed to create webhook for ${event}:`, response.data);
        }
      } catch (eventError) {
        console.error(`Error creating webhook for ${event}:`, {
          error: eventError.message,
          response: eventError.response?.data
        });
        // Continue with other events even if one fails
        continue;
      }

      // Add a small delay between webhook creations to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // console.log('Completed webhook initialization process');
  } catch (error) {
    console.error('Failed to initialize Terminal webhooks:', {
      error: error.message,
      response: error.response?.data,
      config: error.config
    });
  }
};

// Call this when your app starts
initializeTerminalWebhook();
initializeFezWebhook();




// For Fez Delivery address validation
const validateFezAddress = (address) => {
  if (!address.recipientName || !address.recipientPhone || 
      !address.recipientAddress || !address.recipientState) {
    return { valid: false, message: 'Missing required address fields' };
  }
  return { valid: true };
};

// For Fez Delivery parcel validation
const validateFezParcel = (parcel) => {
  // If parcel is not provided or empty, return valid
  if (!parcel || Object.keys(parcel).length === 0) {
    return { valid: true };
  }
  
  // Check required fields
  if (!parcel.valueOfItem) {
    return { valid: false, message: 'Parcel value is required' };
  }
  
  // Check itemDescription length (Fez API limit is 200 characters)
  if (parcel.itemDescription && parcel.itemDescription.length > 200) {
    return { valid: false, message: 'Item description must not exceed 200 characters' };
  }
  
  // Weight is optional now as we can get it from items
  
  return { valid: true };
};

// For Fez Delivery items validation
const validateFezItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'Items must be a non-empty array' };
  }
  
  for (const item of items) {
    if (!item.productId || !item.quantity || !item.price) {
      return { valid: false, message: 'Each item must have productId, quantity, and price' };
    }
  }
  
  return { valid: true };
};

// Create order with Fez Delivery
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  // Create an array to store notification data outside the try block
  const orderNotifications = [];
  
  try {
    const { 
      items, 
      shippingAddress, 
      parcel = {}, // Default to empty object if not provided
      paymentMethod, 
      isItemCod = false, // Default to false if not provided
      shippingFee,
      additionalDetails, 
      pickUpDate,
      senderInfo,
      paidFromWallet = false, // Parameter for wallet payment - DO NOT MODIFY this parameter directly
      isWalletCredit = false, // Parameter for hybrid wallet + Paystack payment
      isStorePickup = false // Parameter for store pickup
    } = req.body;
    
    // Validate store pickup request
    if (isStorePickup) {
      // Check if COD is requested with store pickup
      if (isItemCod) {
        return res.status(400).json({ 
          message: 'Cash on Delivery is not available with store pickup' 
        });
      }

      // Get all unique seller IDs from items
      const sellerIds = [...new Set(items.map(item => item.seller?.sellerId || productMap[item.productId]?.seller?._id))];
      
      // Check if all sellers offer store pickup
      const sellers = await Seller.find({ _id: { $in: sellerIds } });
      const ineligibleSellers = sellers.filter(seller => !seller.offersStorePickup);
      
      if (ineligibleSellers.length > 0) {
        return res.status(400).json({
          message: 'One or more sellers do not offer store pickup',
          ineligibleSellers: ineligibleSellers.map(s => s.storeName || s.businessName)
        });
      }
    }
    
    // Validate inputs
    const itemsValidation = validateFezItems(items);
    if (!itemsValidation.valid) {
      return res.status(400).json({ message: itemsValidation.message });
    }
    
    // Only validate shipping address if not store pickup
    if (!isStorePickup) {
      const addressValidation = validateFezAddress(shippingAddress);
      if (!addressValidation.valid) {
        return res.status(400).json({ message: addressValidation.message });
      }
      
      // Check for seller information in items
      for (const item of items) {
        if (!item.seller || !item.seller.sellerId) {
          return res.status(400).json({ 
            message: 'Seller information is required for each item' 
          });
        }
        
        // Find the seller to verify address
        const SellerModelForValidation = mongoose.model('Seller');
        const seller = await SellerModelForValidation.findById(item.seller.sellerId);
        if (!seller) {
          return res.status(400).json({ message: `Seller not found for item with product ID ${item.productId}` });
        }
        
        // Log all seller address info for debugging
        console.log('DEBUG - Validating Seller Address:', {
          sellerId: seller._id.toString(),
          hasSenderInfo: !!(item.seller.senderInfo && item.seller.senderInfo.senderAddress),
          hasSellerAddress: !!(seller.sellerAddress && seller.sellerAddress.addressLine1),
          hasBusinessAddress: !!(seller.businessAddress && seller.businessAddress.addressLine1),
          hasWarehouseAddress: !!(seller.warehouseDetails && seller.warehouseDetails.address && seller.warehouseDetails.address.addressLine1),
          hasLegacyAddress: !!seller.address
        });
        
        // Check if we have a valid pickup address source
        const hasSenderInfo = item.seller.senderInfo && item.seller.senderInfo.senderAddress;
        const hasSellerAddress = seller.sellerAddress && seller.sellerAddress.addressLine1;
        const hasBusinessAddress = seller.businessAddress && seller.businessAddress.addressLine1;
        const hasWarehouseAddress = seller.warehouseDetails && seller.warehouseDetails.address && seller.warehouseDetails.address.addressLine1;
        const hasLegacyAddress = !!seller.address;
        
        // Only throw an error if we have absolutely no address information
        if (!hasSenderInfo && !hasSellerAddress && !hasBusinessAddress && !hasWarehouseAddress && !hasLegacyAddress) {
          return res.status(400).json({ 
            message: `No valid pickup address available for seller: ${seller.storeName || seller.businessName || seller._id}. Please provide sender information or update seller address.`
          });
        }
      }
    }
    
    // Only validate parcel if it's provided and not store pickup
    if (!isStorePickup && Object.keys(parcel).length > 0) {
      const parcelValidation = validateFezParcel(parcel);
      if (!parcelValidation.valid) {
        return res.status(400).json({ message: parcelValidation.message });
      }
    }
    
    // Get buyer from token
    const buyerId = req.user.id;
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(buyerId);
    
    console.log('DEBUG - Order Creation - Buyer Info:', {
      buyerId: buyerId,
      buyerFound: !!buyer,
      buyerName: buyer ? `${buyer.firstName} ${buyer.lastName}` : 'N/A'
    });
    
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }

    // Get buyer's wallet balance
    const walletBalance = buyer.wallet ? buyer.wallet.balance || 0 : 0;
    
    // Fetch products and calculate total
    const Product = mongoose.model('Product');
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('seller');
    
    console.log('DEBUG - Order Creation - Products Found:', {
      requestedProducts: productIds.length,
      foundProducts: products.length
    });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products not found' });
    }
    
    // Create a map for quick product lookup
    const productMap = {};
    products.forEach(product => {
      productMap[product._id.toString()] = product;
    });
    
    // Validate that all products have sufficient stock
    for (const item of items) {
      const product = productMap[item.productId];
      if (!product) continue;
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock ${product.name} (${product.stock})`
        });
      }
    }
    
    // Group items by seller
    const sellerItems = {};
    let totalAmount = 0;
    
    // Keep track of unique sellers for adding the buyer to followers
    const uniqueSellers = new Set();
    
    items.forEach(item => {
      const product = productMap[item.productId];
      if (!product) {
        return;
      }
      
      const sellerId = product.seller._id.toString();
      uniqueSellers.add(sellerId);
      
      if (!sellerItems[sellerId]) {
        sellerItems[sellerId] = {
          items: [],
          seller: product.seller,
          totalAmount: 0,
          // Store seller-specific sender information if provided
          senderInfo: item.seller?.senderInfo || null,
          // Generate a unique batch ID for each seller
          batchId: `AUQLI-${sellerId.substring(0, 4)}-${uuidv4().substring(0, 8)}`,
          // Initialize shipping fee and weight for each seller
          shippingFee: item?.seller?.shippingFee,
          totalWeight: 0,
          // Initialize seller-specific parcel information
          parcelInfo: {
            valueOfItem: 0,
            weight: 0,
            itemDescription: item.seller?.parcelInfo?.itemDescription || ''
          }
        };
      }
      
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      sellerItems[sellerId].totalAmount += itemTotal;
      
      // Add item weight to seller's total weight (default to product weight or a minimum value)
      // Use the weight provided in the item, or fall back to product weight or default
      const itemWeight = (item.weight || product.weight || 0.1) * item.quantity;
      sellerItems[sellerId].totalWeight += itemWeight;
      sellerItems[sellerId].parcelInfo.weight += itemWeight;
      
      // Add item value to seller's parcel value
      sellerItems[sellerId].parcelInfo.valueOfItem += itemTotal;
      
      // Collect item descriptions for the parcel
      if (product.description && !sellerItems[sellerId].parcelInfo.itemDescription.includes(product.name)) {
        // Check if adding the product name would exceed the 200 character limit
        const currentDesc = sellerItems[sellerId].parcelInfo.itemDescription;
        const separator = currentDesc ? ', ' : '';
        const newDesc = currentDesc + separator + product.name;
        
        if (newDesc.length <= 200) {
          // If within limit, add the full product name
          sellerItems[sellerId].parcelInfo.itemDescription = newDesc;
        } else if (currentDesc.length < 197) {
          // If adding would exceed limit but we have space for ellipsis, truncate
          sellerItems[sellerId].parcelInfo.itemDescription = currentDesc + separator + product.name.substring(0, 197 - currentDesc.length - separator.length) + '...';
        }
        // If already at or near limit, don't add more to the description
      }
      
      sellerItems[sellerId].items.push({
        product: product._id,
        productImages: product.images,
        productName: product.name,
        seller: product.seller._id,
        quantity: item.quantity,
        price: item.price,
        weight: itemWeight,
        specifications: item.specifications || {}
      });
    });
    
    // Calculate how much to charge from wallet vs Paystack
    let walletAmountToUse = 0;
    let paystackAmount = 0;
    let useWalletPayment = false;
    // Create a mutable variable to track if the order will be fully paid from wallet
    let isFullyPaidFromWallet = paidFromWallet;
    
    // Determine payment method and amounts
    if (isWalletCredit && walletBalance > 0) {
      // Use wallet credit (hybrid payment)
      useWalletPayment = true;
      
      if (walletBalance >= totalAmount) {
        // Wallet covers entire amount
        walletAmountToUse = totalAmount;
        paystackAmount = 0;
        isFullyPaidFromWallet = true; // Set fully paid from wallet
      } else {
        // Partial wallet payment
        walletAmountToUse = walletBalance;
        paystackAmount = totalAmount - walletBalance;
      }
    } else if (paidFromWallet && walletBalance >= totalAmount) {
      // Full wallet payment (original flow)
      walletAmountToUse = totalAmount;
      paystackAmount = 0;
      useWalletPayment = true;
    } else {
      // Full Paystack payment
      walletAmountToUse = 0;
      paystackAmount = totalAmount;
      
      // If user tried to use wallet but has insufficient funds
      if ((paidFromWallet || isWalletCredit) && walletBalance < totalAmount) {
        console.log('DEBUG - Order Creation - Insufficient wallet balance:', {
          walletBalance,
          totalAmount,
          difference: totalAmount - walletBalance
        });
        
        if (paidFromWallet) {
          return res.status(400).json({ 
            message: 'Insufficient wallet balance for full payment',
            walletBalance,
            totalAmount
          });
        }
      }
    }
    
    console.log('DEBUG - Order Creation - Payment Breakdown:', {
      totalAmount,
      walletBalance,
      walletAmountToUse,
      paystackAmount,
      isWalletCredit,
      paidFromWallet: isFullyPaidFromWallet,
      useWalletPayment
    });
    
    // Process each seller to check if buyer is already a follower
    // and add if not
    for (const sellerId of uniqueSellers) {
      const Seller = mongoose.model('Seller');
      const seller = await Seller.findById(sellerId);
      
      if (!seller) {
        console.log(`DEBUG - Order Creation - Seller not found: ${sellerId}`);
        continue;
      }
      
      // Check if buyer is already a follower
      const isFollower = seller.followers && 
                        seller.followers.some(follower => 
                          follower.buyerId && follower.buyerId.toString() === buyerId);
      
      console.log('DEBUG - Order Creation - Follower Check:', {
        sellerId: sellerId,
        sellerName: seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`,
        followerCount: seller.followers ? seller.followers.length : 0,
        isFollower: isFollower
      });
      
      // Add the buyer to the seller's followers if not already following
      if (!isFollower) {
        console.log(`DEBUG - Order Creation - Adding buyer as follower for seller: ${sellerId}`);
        
        // Initialize followers array if it doesn't exist
        if (!seller.followers) {
          seller.followers = [];
        }
        
        // Get buyer's main address
        const mainAddress = buyer.shippingAddresses && buyer.shippingAddresses.length > 0
          ? {
              country: buyer.shippingAddresses[0].country,
              city: buyer.shippingAddresses[0].city,
              address1: buyer.shippingAddresses[0].addressLine1,
              address2: buyer.shippingAddresses[0].addressLine2,
              zipCode: buyer.shippingAddresses[0].zipCode
            }
          : null;
        
        // Add buyer as follower
        seller.followers.push({
          buyerId: buyerId,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          username: buyer.username,
          profileImage: buyer.profileImage,
          email: buyer.email,
          followDate: new Date(),
          lastInteraction: new Date(),
          address: mainAddress
        });
        
        // Save the seller with the new follower
        await seller.save({ session });
        
        // Add to buyer's activity feed if it exists
        if (buyer.activityFeed) {
          buyer.activityFeed.push({
            type: 'follow',
            content: `Started following ${seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`}`,
            reference: seller._id,
            referenceModel: 'Seller',
            createdAt: new Date()
          });
          
          // Save buyer with updated activity feed
          await buyer.save({ session });
        }
      } else {
        // Update the existing follower's information
        const followerIndex = seller.followers.findIndex(
          follower => follower.buyerId && follower.buyerId.toString() === buyerId
        );
        
        if (followerIndex !== -1) {
          // Increment order count and update last interaction
          seller.followers[followerIndex].totalOrders = 
            (seller.followers[followerIndex].totalOrders || 0) + 1;
          seller.followers[followerIndex].lastInteraction = new Date();
          
          // Update main address if it has changed
          if (buyer.shippingAddresses && buyer.shippingAddresses.length > 0) {
            seller.followers[followerIndex].address = {
              country: buyer.shippingAddresses[0].country,
              city: buyer.shippingAddresses[0].city,
              address1: buyer.shippingAddresses[0].addressLine1,
              address2: buyer.shippingAddresses[0].addressLine2,
              zipCode: buyer.shippingAddresses[0].zipCode
            };
          }
          
          // Save the seller with updated follower information
          await seller.save({ session });
          
          console.log(`DEBUG - Order Creation - Updated follower information:`, {
            totalOrders: seller.followers[followerIndex].totalOrders,
            lastInteraction: seller.followers[followerIndex].lastInteraction
          });
        }
      }
    }
    
    // Calculate shipping fee for each seller based on their items' total weight
    // This is a simplified calculation - you may want to use a more sophisticated algorithm
    // or call a shipping rate API for each seller
    let totalShippingFee = 0;
    for (const sellerId in sellerItems) {
      const sellerData = sellerItems[sellerId];
      
      // Calculate shipping fee based on weight
      // This is a simple example - replace with your actual calculation logic
      const baseShippingFee = 0; // Base fee in Naira
      const weightFactor = 0; // Additional fee per kg
      
      // If a specific shipping fee was provided for this seller in the request, use that
      // Check if any of the items from this seller has shipping fee info
      let sellerShippingFeeProvided = false;
      
      // Check all items for this seller to find shipping fee
      for (const itemData of sellerData.items) {
        const productId = itemData.product.toString();
        // Find the original item in the request that has seller info
        const originalItem = items.find(item => item.productId === productId);
        if (originalItem?.seller?.shippingFee) {
          sellerData.shippingFee = originalItem.seller.shippingFee;
          sellerShippingFeeProvided = true;
          break;
        }
      }
      
      // If no shipping fee was provided, calculate based on weight
      if (!sellerShippingFeeProvided) {
        sellerData.shippingFee = Math.round(baseShippingFee + (sellerData.totalWeight * weightFactor));
      }
      
      // Add to total shipping fee
      totalShippingFee += sellerData.shippingFee;
    }
    
    // If a global shipping fee was provided, distribute it proportionally among sellers
    // if (shippingFee) {
    //   const totalWeight = Object.values(sellerItems).reduce((sum, seller) => sum + seller.totalWeight, 0);
      
    //   for (const sellerId in sellerItems) {
    //     const sellerData = sellerItems[sellerId];
    //     // Distribute the shipping fee proportionally based on weight
    //     const weightRatio = sellerData.totalWeight / totalWeight;
    //     sellerData.shippingFee = Math.round(shippingFee * weightRatio);
    //   }
      
    //   // Ensure the sum of distributed fees equals the original total
    //   // (might be off by a few naira due to rounding)
    //   const distributedTotal = Object.values(sellerItems).reduce((sum, seller) => sum + seller.shippingFee, 0);
      
    //   // Adjust the first seller's fee to make up any difference
    //   if (distributedTotal !== shippingFee && Object.keys(sellerItems).length > 0) {
    //     const firstSellerId = Object.keys(sellerItems)[0];
    //     sellerItems[firstSellerId].shippingFee += (shippingFee - distributedTotal);
    //   }
    // }
    
    // Calculate grand total (items + shipping)
    // let grandTotal = totalAmount + totalShippingFee;

    //new grandTotal Calculation
    let grandTotal = totalAmount + shippingFee;
    // Update totalShippingFee to match the provided shippingFee
    totalShippingFee = shippingFee;

    
    // Check wallet balance if using wallet payment
    if (isFullyPaidFromWallet) {
      if (buyer.wallet.balance < grandTotal) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Required: ${grandTotal}, Available: ${buyer.wallet.balance}` 
        });
      }
      
      // Deduct from buyer's wallet
      const transaction = {
        type: 'debit',
        amount: grandTotal,
        paymentReference: `ORDER-BATCH-${Date.now()}`,
        description: `Payment for multiple orders (Items: ₦${totalAmount}, Shipping: ₦${totalShippingFee})`,
        status: 'completed',
        createdAt: new Date()
      };
      
      await Buyer.findByIdAndUpdate(
        buyerId,
        {
          $inc: { 'wallet.balance': -grandTotal },
          $push: { 'wallet.transactions': transaction }
        },
        { session }
      );
    }
    
    // Create a batch ID for Fez Delivery
    const batchId = `AUQLI-${uuidv4().substring(0, 8)}`;
    
    // Create orders for each seller
    const orders = [];
    const fezRequests = [];
    
    for (const sellerId in sellerItems) {
      const sellerData = sellerItems[sellerId];
      const sellerItemsList = sellerData.items;
      const seller = sellerData.seller;
      // Use seller-specific sender info if available, otherwise fall back to the global one
      const sellerSenderInfo = sellerData.senderInfo || senderInfo || {};
      // Use the seller-specific batch ID
      const sellerBatchId = sellerData.batchId;
      // Use seller-specific shipping fee
      const sellerShippingFee = sellerData.shippingFee;
      // Use seller-specific weight
      const sellerWeight = sellerData.totalWeight;
      // Use seller-specific parcel info
      const sellerParcelInfo = sellerData.parcelInfo;
      
      const sellerTotal = sellerItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Generate a unique order ID
      const uniqueOrderId = `AUQLI-${uuidv4().substring(0, 8)}`;
      
      // Get fresh seller data with all fields populated to ensure we have the latest address info
      // Use mongoose model to avoid reference issues
      const SellerModel = mongoose.model('Seller');
      const fullSellerData = await SellerModel.findById(sellerId);
      
      // Check if seller is international
      const isInternationalSeller = fullSellerData?.isInternational === true;
      
      // Log all available address data for debugging
      console.log('DEBUG - Seller Address Data:', {
        sellerId: sellerId,
        isInternational: isInternationalSeller,
        hasSellerAddress: fullSellerData?.sellerAddress?.addressLine1 ? true : false,
        sellerAddress: fullSellerData?.sellerAddress,
        hasBusinessAddress: fullSellerData?.businessAddress?.addressLine1 ? true : false,
        businessAddress: fullSellerData?.businessAddress,
        hasWarehouseAddress: fullSellerData?.warehouseDetails?.address?.addressLine1 ? true : false,
        warehouseAddress: fullSellerData?.warehouseDetails?.address
      });
      
      // Create order in database
      const order = new Order({
        order_id: uniqueOrderId,
        buyer: buyerId,
        buyerDetails: {
          _id: buyerId,
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          username: buyer.username,
          profileImage: buyer.profileImage
        },
        seller: sellerId,
        channel: req.body.channel || 'marketplace',
        items: sellerItemsList,
        totalAmount: sellerTotal,
        isStorePickup: isStorePickup, // Add store pickup flag
        delivery_address: isStorePickup ? null : {
          first_name: shippingAddress.recipientName.split(' ')[0],
          last_name: shippingAddress.recipientName.split(' ').slice(1).join(' ') || '',
          email: shippingAddress.recipientEmail,
          phone: shippingAddress.recipientPhone,
          line1: shippingAddress.recipientAddress,
          city: '',
          state: shippingAddress.recipientState,
          country: 'NG',
          zip: ''
        },
        pickup_address: isStorePickup ? {
          first_name: fullSellerData.firstName,
          last_name: fullSellerData.lastName,
          email: fullSellerData.email,
          phone: fullSellerData.phoneNumber,
          line1: fullSellerData.sellerAddress?.addressLine1 || '',
          line2: fullSellerData.sellerAddress?.addressLine2 || '',
          city: fullSellerData.sellerAddress?.city || '',
          state: fullSellerData.sellerAddress?.state || '',
          country: fullSellerData.sellerAddress?.country || 'NG',
          zip: fullSellerData.sellerAddress?.zipCode || ''
        } : (() => {
          // Determine which address to use for pickup based on availability
          let address = null;
          
          // Start with sellerSenderInfo from request
          if (sellerSenderInfo && sellerSenderInfo.senderAddress) {
            // Use the address provided in the request
            address = {
              first_name: sellerSenderInfo.senderName ? sellerSenderInfo.senderName.split(' ')[0] : fullSellerData.firstName,
              last_name: sellerSenderInfo.senderName ? sellerSenderInfo.senderName.split(' ').slice(1).join(' ') : fullSellerData.lastName,
              email: sellerSenderInfo.senderEmail || fullSellerData.email,
              phone: sellerSenderInfo.senderPhone || fullSellerData.phoneNumber,
              line1: sellerSenderInfo.senderAddress,
              state: sellerSenderInfo.pickUpState || "Lagos",
              country: 'NG'
            };
            console.log('Order using pickup address from request');
          } 
          // Then try sellerAddress
          else if (fullSellerData.sellerAddress && fullSellerData.sellerAddress.addressLine1) {
            address = {
              first_name: fullSellerData.firstName,
              last_name: fullSellerData.lastName,
              email: fullSellerData.email,
              phone: fullSellerData.phoneNumber,
              line1: fullSellerData.sellerAddress.addressLine1,
              line2: fullSellerData.sellerAddress.addressLine2 || '',
              city: fullSellerData.sellerAddress.city || '',
              state: fullSellerData.sellerAddress.state || '',
              country: fullSellerData.sellerAddress.country || 'NG',
              zip: fullSellerData.sellerAddress.zipCode || ''
            };
            console.log('Order using seller address from database');
          } 
          // Try businessAddress
          else if (fullSellerData.businessAddress && fullSellerData.businessAddress.addressLine1) {
            address = {
              first_name: fullSellerData.firstName,
              last_name: fullSellerData.lastName,
              email: fullSellerData.email,
              phone: fullSellerData.phoneNumber,
              line1: fullSellerData.businessAddress.addressLine1,
              line2: fullSellerData.businessAddress.addressLine2 || '',
              city: fullSellerData.businessAddress.city || '',
              state: fullSellerData.businessAddress.state || '',
              country: fullSellerData.businessAddress.country || 'NG',
              zip: fullSellerData.businessAddress.zipCode || ''
            };
            console.log('Order using business address from database');
          }
          // Try warehouse address
          else if (fullSellerData.warehouseDetails && fullSellerData.warehouseDetails.address && fullSellerData.warehouseDetails.address.addressLine1) {
            address = {
              first_name: fullSellerData.firstName,
              last_name: fullSellerData.lastName,
              email: fullSellerData.email,
              phone: fullSellerData.phoneNumber || fullSellerData.warehouseDetails.contactNumber,
              line1: fullSellerData.warehouseDetails.address.addressLine1,
              line2: fullSellerData.warehouseDetails.address.addressLine2 || '',
              city: fullSellerData.warehouseDetails.address.city || '',
              state: fullSellerData.warehouseDetails.address.state || '',
              country: fullSellerData.warehouseDetails.address.country || 'NG',
              zip: fullSellerData.warehouseDetails.address.zipCode || ''
            };
            console.log('Order using warehouse address from database');
          }
          // Try legacy address field
          else if (fullSellerData.address) {
            address = {
              first_name: fullSellerData.firstName,
              last_name: fullSellerData.lastName,
              email: fullSellerData.email,
              phone: fullSellerData.phoneNumber,
              line1: fullSellerData.address,
              state: fullSellerData.state || 'Lagos',
              country: 'NG'
            };
            console.log('Order using legacy address field from database');
          } else {
            console.log('No suitable pickup address found for seller', sellerId);
            // Create minimal address with just the name
            address = {
              first_name: fullSellerData.firstName,
              last_name: fullSellerData.lastName,
              email: fullSellerData.email,
              phone: fullSellerData.phoneNumber,
              line1: 'Address not provided',
              state: 'Lagos',
              country: 'NG'
            };
          }
          
          return address;
        })(),
        shipping: {
          carrier: isStorePickup ? null : {
            name: 'Fez Delivery',
            reference: sellerBatchId
          },
          fee: {
            amount: isStorePickup ? 0 : sellerShippingFee, // No shipping fee for store pickup
            currency: 'NGN'
          },
          tracking: {
            number: uniqueOrderId,
            status: 'pending'
          },
          shipment_id: uniqueOrderId
        },
        paid: (paymentMethod !== 'paystack' || isItemCod || isFullyPaidFromWallet) ? (!isItemCod || isFullyPaidFromWallet) : false,
        paymentInfo: {
          method: isFullyPaidFromWallet ? 'wallet' : paymentMethod,
          status: isItemCod && !isFullyPaidFromWallet ? 'awaiting_cod' : 
                 (paymentMethod === 'paystack' && !isItemCod && !isFullyPaidFromWallet) ? 'pending' : 'paid',
          isCashOnDelivery: isItemCod && !isFullyPaidFromWallet,
          isWalletCredit: isWalletCredit && walletAmountToUse > 0,
          // Calculate proportional wallet amount for this order based on its total
          walletAmountUsed: isWalletCredit && walletAmountToUse > 0 ? 
                            Math.round((sellerTotal / totalAmount) * walletAmountToUse) : 0,
          // Store the batch total and wallet amount to verify refunds
          batchTotalAmount: totalAmount,
          batchWalletAmount: walletAmountToUse,
          batchId: batchId, // Store the batch ID to identify related orders
          ...(isItemCod && !isFullyPaidFromWallet ? {} : 
             (paymentMethod === 'paystack' && !isItemCod && !isFullyPaidFromWallet) ? {} : { paidAt: new Date() })
        },
        // Initialize notification flag
        // We'll set this to false for all orders and handle notifications in batch
        notificationsSent: false
      });
      
    
      await order.save({ session });
      console.log('Order saved successfully:', {
        orderId: order._id.toString(),
        order_id: order.order_id
      });
      
      // Track campaign attribution if campaign ID is provided
      if (req.body.campaignId) {
        try {
          console.log(`Attributing order ${order.order_id} to campaign ${req.body.campaignId}`);
          // Track purchase attribution without awaiting to avoid blocking the order process
          // Note: This operation is independent of the transaction
          trackPurchase(req.body.campaignId, buyerId, sellerTotal)
            .then(success => {
              if (success) {
                console.log(`✅ Successfully attributed order ${order.order_id} to campaign ${req.body.campaignId}`);
              } else {
                console.log(`⚠️ Could not attribute order ${order.order_id} to campaign ${req.body.campaignId}`);
              }
            })
            .catch(err => {
              console.error(`Error attributing order to campaign: ${err.message}`);
            });
        } catch (campaignError) {
          // Log error but don't interrupt order flow
          console.error(`Failed to track campaign purchase: ${campaignError.message}`);
        }
      }
      
      // Schedule job to mark order as stale if still unpaid after 30 minutes (for Paystack orders only)
      if (paymentMethod === 'paystack' && !isItemCod && !isFullyPaidFromWallet) {
        // Schedule warning notification 20 minutes after order creation (10 minutes before being marked stale)
        agenda.schedule('in 20 minutes', 'send_unpaid_order_warning', { orderId: order._id });
        console.log(`Scheduled warning notification for unpaid Paystack order ${order.order_id} in 20 minutes`);
        
        // Schedule job to mark as stale after 30 minutes
        agenda.schedule('in 30 minutes', 'mark_unpaid_orders_stale', { orderId: order._id });
        console.log(`Scheduled automatic stale marking for unpaid Paystack order ${order.order_id} in 30 minutes`);
      }
      
      // Add buyer to seller's customers list if not already a customer
      // Use a different variable name to avoid redeclaration
      const SellerModelForCustomer = mongoose.model('Seller');
      const sellerDoc = await SellerModelForCustomer.findById(sellerId);
      
      if (sellerDoc) {
        // Check if buyer is already a customer
        const existingCustomer = sellerDoc.customers.find(
          customer => customer.buyerId && customer.buyerId.toString() === buyerId.toString()
        );
        
        if (!existingCustomer) {
          // Add buyer as a new customer
          await SellerModelForCustomer.findByIdAndUpdate(
            sellerId,
            {
              $push: {
                customers: {
                  buyerId: buyerId,
                  firstName: buyer.firstName,
                  lastName: buyer.lastName,
                  firstPurchaseDate: new Date(),
                  totalOrders: 1,
                  totalSpent: sellerTotal
                }
              }
            },
            { session }
          );
          console.log(`Added buyer ${buyerId} as a new customer for seller ${sellerId}`);
        } else {
          // Update existing customer with new order data
          await SellerModelForCustomer.findOneAndUpdate(
            { 
              _id: sellerId,
              'customers.buyerId': buyerId 
            },
            { 
              $inc: {
                'customers.$.totalOrders': 1,
                'customers.$.totalSpent': sellerTotal
              }
            },
            { session }
          );
          console.log(`Updated existing customer record for buyer ${buyerId} and seller ${sellerId}`);
        }
      }
      
      // Stock will be updated when the order is paid
      console.log('Stock update deferred until payment is confirmed');
      
      orders.push(order);
      
      // Add to our local array for processing after transaction
      orderNotifications.push({
        orderId: order._id,
        buyerId: buyerId,
        sellerId: sellerId
      });
      
      // Don't schedule the notification job here - we'll do it once after transaction is committed
      console.log('Adding order to notification queue:', {
        orderId: order._id.toString(),
        buyerId,
        sellerId
      });
      
      // Log all available address data for debugging but don't redeclare fullSellerData
      console.log('DEBUG - Seller Address Data:', {
        sellerId: sellerId,
        hasSellerAddress: fullSellerData?.sellerAddress?.addressLine1 ? true : false,
        sellerAddress: fullSellerData?.sellerAddress,
        hasBusinessAddress: fullSellerData?.businessAddress?.addressLine1 ? true : false,
        businessAddress: fullSellerData?.businessAddress,
        hasWarehouseAddress: fullSellerData?.warehouseDetails?.address?.addressLine1 ? true : false,
        warehouseAddress: fullSellerData?.warehouseDetails?.address
      });
      
      // Prepare seller-specific parcel details for Fez
      const sellerParcel = {
        valueOfItem: sellerParcelInfo.valueOfItem.toString(),
        weight: sellerWeight,
        itemDescription: sellerParcelInfo.itemDescription || 
                        (parcel.itemDescription ? parcel.itemDescription : `Order from ${seller.businessName || 'Seller'}`)
      };
      
      // Ensure itemDescription doesn't exceed 200 characters (Fez API limit)
      if (sellerParcel.itemDescription && sellerParcel.itemDescription.length > 200) {
        sellerParcel.itemDescription = sellerParcel.itemDescription.substring(0, 197) + '...';
        // console.log(`⚠️ Truncated item description for order ${order.order_id} to fit Fez API limit`);
      }
      
      // Skip Fez Delivery request creation for international sellers
      let fezRequest = null;
      
      // Only create Fez request if seller is not international
      if (!isInternationalSeller && !isStorePickup) {
        // Create Fez Delivery request with sender information and seller-specific parcel details
        fezRequest = {
          recipientAddress: shippingAddress.recipientAddress,
          recipientState: shippingAddress.recipientState,
          recipientName: shippingAddress.recipientName,
          recipientPhone: shippingAddress.recipientPhone,
          recipientEmail: shippingAddress.recipientEmail || '',
          uniqueID: order.order_id, // Unique ID for each order
          BatchID: sellerBatchId, // Seller-specific batch ID
          valueOfItem: sellerParcel.valueOfItem,
          weight: Math.max(1, Math.round(sellerParcel.weight)),
          itemDescription: sellerParcel.itemDescription,
          additionalDetails: additionalDetails || '',
          isItemCod: isItemCod && !isFullyPaidFromWallet,
          thirdparty: "true",
        };
        
        console.log(`Creating Fez request for non-international seller: ${sellerId}`);
      } else if (isInternationalSeller) {
        console.log(`Skipping Fez request for international seller: ${sellerId}`);
      }

      // Only process Fez request if it was created (for non-international sellers)
      if (fezRequest) {
        // Get sender info (name, address, phone, email) from seller data if not provided
        // First check if sender info is provided in the request
        if (sellerSenderInfo.senderName) {
          fezRequest.senderName = sellerSenderInfo.senderName;
        } else {
          fezRequest.senderName = `${fullSellerData.firstName} ${fullSellerData.lastName}`;
        }
  
        // Check for sender address in priority order:
        // 1. Request sender info
        // 2. Seller address
        // 3. Business address
        // 4. Warehouse address
        // 5. Fallback to seller's default address if available
        // 6. Default to "Not provided"
        if (sellerSenderInfo.senderAddress) {
          fezRequest.senderAddress = sellerSenderInfo.senderAddress;
          console.log('Using sender address from request');
        } else if (fullSellerData.sellerAddress && fullSellerData.sellerAddress.addressLine1) {
          const sellerAddr = fullSellerData.sellerAddress;
          fezRequest.senderAddress = formatAddressForFez(sellerAddr);
          console.log('Using seller address from database');
        } else if (fullSellerData.businessAddress && fullSellerData.businessAddress.addressLine1) {
          const businessAddr = fullSellerData.businessAddress;
          fezRequest.senderAddress = formatAddressForFez(businessAddr);
          console.log('Using business address from database');
        } else if (fullSellerData.warehouseDetails && fullSellerData.warehouseDetails.address && fullSellerData.warehouseDetails.address.addressLine1) {
          const warehouseAddr = fullSellerData.warehouseDetails.address;
          fezRequest.senderAddress = formatAddressForFez(warehouseAddr);
          console.log('Using warehouse address from database');
        } else if (fullSellerData.address) {
          // Use the legacy address field if available
          fezRequest.senderAddress = fullSellerData.address;
          console.log('Using legacy address field from database');
        } else {
          fezRequest.senderAddress = 'Not provided';
          console.log('No address found for seller', sellerId);
        }
  
        // Handle phone number
        fezRequest.senderPhone = sellerSenderInfo.senderPhone || fullSellerData.phoneNumber || 'Not provided';
        
        // Handle email
        fezRequest.senderEmail = sellerSenderInfo.senderEmail || fullSellerData.email || '';
        
        // Add cashOnDeliveryAmount for COD orders
        if (isItemCod && !isFullyPaidFromWallet) {
          const orderTotal = order.totalAmount + sellerShippingFee;
          fezRequest.cashOnDeliveryAmount = orderTotal.toString();
        }
        
        // Add optional fields if provided
        if (pickUpDate) {
          fezRequest.pickUpDate = pickUpDate;
        } else {
          // Set a default pickup date (tomorrow)
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          fezRequest.pickUpDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }
        
        // Handle pickup state in same priority order as address
        if (sellerSenderInfo.pickUpState) {
          fezRequest.pickUpState = sellerSenderInfo.pickUpState;
          console.log('Using pickup state from request:', fezRequest.pickUpState);
        } else if (fullSellerData.sellerAddress && fullSellerData.sellerAddress.state) {
          fezRequest.pickUpState = fullSellerData.sellerAddress.state;
          console.log('Using seller address state from database:', fezRequest.pickUpState);
        } else if (fullSellerData.businessAddress && fullSellerData.businessAddress.state) {
          fezRequest.pickUpState = fullSellerData.businessAddress.state;
          console.log('Using business address state from database:', fezRequest.pickUpState);
        } else if (fullSellerData.state) {
          fezRequest.pickUpState = fullSellerData.state;
          console.log('Using seller state field from database:', fezRequest.pickUpState);
        } else {
          // Default to Lagos if no pickup state is provided
          fezRequest.pickUpState = "Lagos";
          console.log('Using default state (Lagos) for seller', sellerId);
        }
        
        // Add to fezRequests array only if it's not an international seller
        fezRequests.push(fezRequest);
      }
      
     
      const notificationData = {
        orderId: order._id,
        buyerId: buyerId,
        sellerId: sellerId // Ensure this is the correct seller ID
      };
      
      // Add to our local array
      orderNotifications.push(notificationData);
      
     
    }
    
    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    console.log('Using fresh token for order creation:', authToken.substring(0, 10) + '...');
    
    // Skip Fez API call for store pickup orders
    let fezResponse = { data: { status: 'Success', orderNos: {} } };
    if (!isStorePickup) {
      // Log the complete request being sent to Fez API
      console.log('FEZ API REQUEST DETAILS:');
      console.log('URL:', `${FEZ_API_URL}/order`);
      console.log('Headers:', {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': process.env.FEZ_SECRET_KEY,
        'Content-Type': 'application/json'
      });
      console.log('Request Body:', JSON.stringify(fezRequests, null, 2));

      // Make API call to Fez Delivery with fresh token
      fezResponse = await axios.post(`${FEZ_API_URL}/order`, fezRequests, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'secret-key': process.env.FEZ_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Update orders with Fez tracking information (only for non-store pickup and non-international seller orders)
    if (!isStorePickup && fezResponse.data && fezResponse.data.status === 'Success') {
      const orderNos = fezResponse.data.orderNos;
      
      for (const order of orders) {
        // Get the seller to check if they're international
        const SellerModel = mongoose.model('Seller');
        const orderSeller = await SellerModel.findById(order.seller);
        const isInternationalSeller = orderSeller?.isInternational === true;
        
        // Skip updating tracking for international sellers
        if (isInternationalSeller) {
          console.log(`Skipping Fez tracking update for international seller order: ${order.order_id}`);
          continue;
        }
        
        const fezOrderNo = orderNos[order.order_id];
        if (fezOrderNo) {
          await Order.findByIdAndUpdate(
            order._id,
            { 
              $set: { 
                'shipping.tracking.number': fezOrderNo,
                'shipping.fez_order_number': fezOrderNo,
                'shipping.tracking.carrier': 'Fez Delivery'
              } 
            },
            { session }
          );
        }
      }
    }
    
    // When creating the Order object, add the wallet payment information
    // This would be done in the loop where orders are created for each seller
    
    // Create the orders
    const orderSummaries = [];
    
    for (const order of orders) {
      const sellerInfo = sellerItems[order.seller.toString()];
      
      // Get the seller to check if they're international
      const SellerModel = mongoose.model('Seller');
      const orderSeller = await SellerModel.findById(order.seller);
      const isInternationalSeller = orderSeller?.isInternational === true;
      
      orderSummaries.push({
        orderId: order._id,
        order_id: order.order_id,
        seller: order.seller,
        items: order.items.length,
        itemsTotal: order.totalAmount, // This is just the items total
        shippingFee: sellerInfo.shippingFee,
        orderTotal: order.totalAmount + sellerInfo.shippingFee, // Total including shipping
        fezOrderNo: isInternationalSeller ? null : (fezResponse.data?.orderNos?.[order.order_id] || null),
        isInternationalSeller: isInternationalSeller // Add flag to indicate international seller
      });
    }
    
    // Deduct from wallet if needed
    if (useWalletPayment && walletAmountToUse > 0) {
      // Create wallet transaction record
      const walletTransaction = {
        type: 'debit',
        amount: walletAmountToUse,
        description: `Payment for order(s): ${orders.map(o => o.order_id).join(', ')}`,
        status: 'completed'
      };
      
      // Add transaction to wallet
      buyer.wallet.balance -= walletAmountToUse;
      buyer.wallet.transactions.push(walletTransaction);
      
      // Save buyer with updated wallet
      await buyer.save({ session });
      
      console.log('DEBUG - Order Creation - Wallet Payment:', {
        walletAmountUsed: walletAmountToUse,
        newWalletBalance: buyer.wallet.balance,
        transactionId: buyer.wallet.transactions[buyer.wallet.transactions.length - 1]._id
      });
    }
    
    // After all orders are processed and Fez API call is complete
    await session.commitTransaction();
    session.endSession();

    console.log('Transaction committed successfully');

    const trackingOrderData = {};

    // Track order sales on Mixpanel - one event per order with all items as numbered properties
    try {
      console.log('Starting Mixpanel tracking for sale_made events...');
      
      for (const order of orders) {
        // Get seller details for this order
        const SellerModel = mongoose.model('Seller');
        const orderSeller = await SellerModel.findById(order.seller);
        
        if (!orderSeller) {
          console.warn(`Seller not found for order ${order.order_id}, skipping Mixpanel tracking`);
          continue;
        }

        // Get buyer's main address for tracking
        const buyerMainAddress = buyer.shippingAddresses && buyer.shippingAddresses.length > 0 
          ? buyer.shippingAddresses[0] 
          : null;

        // Create base tracking data for the order
        const trackingData = {
          // Order details
          order_id: order.order_id,
          order_items_total: order.totalAmount,
          shipping_fee: sellerItems[order.seller.toString()]?.shippingFee || 0,
          order_grand_total: order.totalAmount + (sellerItems[order.seller.toString()]?.shippingFee || 0),
          payment_method: order.paymentInfo.method,
          payment_status: order.paymentInfo.status,
          is_cash_on_delivery: order.paymentInfo.isCashOnDelivery || false,
          is_wallet_credit: order.paymentInfo.isWalletCredit || false,
          wallet_amount_used: order.paymentInfo.walletAmountUsed || 0,
          is_store_pickup: order.isStorePickup || false,
          order_channel: req.body.channel || 'marketplace',
          total_items_in_order: order.items.length,
          total_orders_in_batch: orders.length,
          
          // Seller details
          seller_id: orderSeller._id.toString(),
          seller_first_name: orderSeller.firstName,
          seller_last_name: orderSeller.lastName,
          seller_store_name: orderSeller.storeName || orderSeller.businessName,
          seller_email: orderSeller.email,
          seller_phone: orderSeller.phoneNumber,
          seller_is_international: orderSeller.isInternational || false,
          seller_address_line1: orderSeller.sellerAddress?.addressLine1 || 
                               orderSeller.businessAddress?.addressLine1 || 
                               orderSeller.warehouseDetails?.address?.addressLine1 || 
                               orderSeller.address || 'Not provided',
          seller_city: orderSeller.sellerAddress?.city || 
                      orderSeller.businessAddress?.city || 
                      orderSeller.warehouseDetails?.address?.city || '',
          seller_state: orderSeller.sellerAddress?.state || 
                       orderSeller.businessAddress?.state || 
                       orderSeller.warehouseDetails?.address?.state || 
                       orderSeller.state || '',
          seller_country: orderSeller.sellerAddress?.country || 
                         orderSeller.businessAddress?.country || 
                         orderSeller.warehouseDetails?.address?.country || 'Nigeria',
          
          // Buyer details
          buyer_id: buyer._id.toString(),
          buyer_first_name: buyer.firstName,
          buyer_last_name: buyer.lastName,
          buyer_username: buyer.username,
          buyer_email: buyer.email,
          buyer_phone: buyer.phoneNumber,
          buyer_address_line1: buyerMainAddress?.addressLine1 || '',
          buyer_city: buyerMainAddress?.city || '',
          buyer_state: buyerMainAddress?.state || '',
          buyer_country: buyerMainAddress?.country || 'Nigeria',
          buyer_zip_code: buyerMainAddress?.zipCode || '',
          
          // Delivery details (if not store pickup)
          delivery_address_line1: order.delivery_address?.line1 || '',
          delivery_city: order.delivery_address?.city || '',
          delivery_state: order.delivery_address?.state || '',
          delivery_country: order.delivery_address?.country || '',
          delivery_recipient_name: order.delivery_address?.first_name && order.delivery_address?.last_name 
            ? `${order.delivery_address.first_name} ${order.delivery_address.last_name}` 
            : '',
          delivery_recipient_phone: order.delivery_address?.phone || '',
          delivery_recipient_email: order.delivery_address?.email || '',
          
          // Shipping details
          fez_order_number: order.shipping?.fez_order_number || null,
          carrier_name: order.shipping?.carrier?.name || null,
          tracking_number: order.shipping?.tracking?.number || null,
          
          // Timestamps
          order_created_at: order.createdAt || new Date(),
          
          // Campaign attribution (if applicable)
          campaign_id: req.body.campaignId || null,
          
          // Live show details (if applicable)
          stream_id: req.body.streamId || null
        };

        // Calculate payment breakdown (same logic as getOrderDetails)
        const categoryNames = [...new Set(order.items.map(item => 
          item.productName ? productMap[item.product.toString()]?.category || null : null
        ).filter(Boolean))];
        
        const Category = mongoose.model('Category');
        const categories = await Category.find({ name: { $in: categoryNames } });
        const categoryFeeMap = new Map(categories.map(cat => [
          cat.name,
          cat.platformFee
        ]));

        // Calculate fees for each item and total platform fee
        let totalPlatformFee = 0;
        const itemizedFees = order.items.map(item => {
          const itemTotal = item.price * item.quantity;
          const product = productMap[item.product.toString()];
          const categoryFee = categoryFeeMap.get(product?.category) || 0;
          const itemPlatformFee = itemTotal * (categoryFee / 100);
          totalPlatformFee += itemPlatformFee;

          return {
            productName: item.productName,
            amount: itemTotal,
            platformFeePercentage: categoryFee,
            platformFeeAmount: itemPlatformFee
          };
        });

        // Calculate processing fee (1.5%)
        const processingFee = order.totalAmount * 0.015;
        const processingFeePercentage = 1.5;
        const totalDeductions = totalPlatformFee + processingFee;
        const sellerPayout = order.totalAmount - totalDeductions;

        // Add payment breakdown to tracking data
        trackingData.totalPlatformFee = totalPlatformFee;
        trackingData.processingFee = processingFee;
        trackingData.processingFeePercentage = processingFeePercentage;
        trackingData.totalDeductions = totalDeductions;
        trackingData.sellerPayout = sellerPayout;

        // Add all order items as numbered properties with profit calculations
        let auqliTotalProfit = 0;
        order.items.forEach((item, index) => {
          const itemNumber = index + 1; // Start from 1 instead of 0
          const itemTotal = item.price * item.quantity;
          const itemPlatformFee = itemizedFees[index].platformFeeAmount;
          const auqliItemProfit = itemPlatformFee; // Auqli's profit is the platform fee for that item
          
          auqliTotalProfit += auqliItemProfit;
          
          trackingData[`orderProductId${itemNumber}`] = item.product.toString();
          trackingData[`orderProductName${itemNumber}`] = item.productName;
          trackingData[`orderProductPrice${itemNumber}`] = item.price;
          trackingData[`orderProductQuantity${itemNumber}`] = item.quantity;
          trackingData[`orderProductWeight${itemNumber}`] = item.weight || 0;
          trackingData[`orderProductTotal${itemNumber}`] = itemTotal;
          trackingData[`orderProductSpecifications${itemNumber}`] = JSON.stringify(item.specifications || {});
          trackingData[`auqliItem${itemNumber}Profit`] = auqliItemProfit;
        });

        // Add total Auqli profit
        trackingData.auqliTotalProfit = auqliTotalProfit;

        // Store tracking data in the response object (same structure as trackingData)
        Object.assign(trackingOrderData, trackingData);

        // Track single sale_made event for the entire order
        mixpanel.track('sale_made', trackingData);
        
        
        console.log(`Mixpanel sale_made event tracked for order ${order.order_id} with ${order.items.length} items`);
      }
      
      console.log(`Successfully tracked ${orders.length} order events on Mixpanel`);
      
    } catch (mixpanelError) {
      console.error('Error tracking sale_made events on Mixpanel:', mixpanelError);
      // Continue processing even if Mixpanel tracking fails
    }

    // Now schedule a single batch notification job instead of individual notifications
    if (orderNotifications.length > 0) {
      // Get the buyer ID from the first notification
      const buyerId = orderNotifications[0].buyerId;
      
      console.log('Scheduling batch notification processing for buyer:', buyerId);
      
      // Schedule a batch notification job for this buyer
      await agenda.schedule('in 2 seconds', 'send-order-notifications', {
        buyerId: buyerId,
        batchProcess: true
      });
      
      console.log('Batch notification job scheduled for buyer:', buyerId);
    } else {
      console.log('No orders to send notifications for');
    }

    // Only send Slack notification for paid orders
    try {
      // Check if any orders are paid
      const paidOrders = orders.filter(order => order.paid === true);
      
      if (paidOrders.length > 0) {
        // Get seller names for each paid order
        const orderSellerInfo = await Promise.all(
          paidOrders.map(async (order) => {
            const seller = await Seller.findById(order.seller);
            return {
              orderId: order.order_id,
              sellerName: seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller'
            };
          })
        );
        
        // Send a simple notification to Slack email only for paid orders
        const slackEmailMsg = {
          to: 'orders-aaaaqm2ugmdudvf4jsgf3koetm@auqli.slack.com',
          from: {
            email: 'support@auqli.com',
            name: 'Auqli Orders'
          },
          subject: 'New Paid Order on Auqli',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>New Paid Order on Auqli</h2>
              <p>A new paid order has been created on Auqli.</p>
              <p>Paid order count: ${paidOrders.length}</p>
              <p>Buyer: ${buyer.firstName} ${buyer.lastName}</p>
              ${orderSellerInfo.map(info => 
                `<p>Order ID: ${info.orderId}, Store: ${info.sellerName}</p>`
              ).join('')}
              <p>Time: ${new Date().toISOString()}</p>
            </div>
          `
        };

        await sgMail.send(slackEmailMsg);
        console.log('Slack notification email sent for new paid order');
      } else {
        console.log('No paid orders to send Slack notification for');
      }
    } catch (slackEmailError) {
      console.error('Error sending Slack notification email:', slackEmailError);
      // Continue processing even if email fails
    }

    console.log('Order creation completed');
    
    // Prepare response with detailed order information
    const orderDetails = orderSummaries;

    const liveShowOrders = [];

    for (const order of orders) {
      const firstItem = order.items[0];

      liveShowOrders.push({
        orderId: order.order_id,
        buyer: order.buyerDetails,
        orderDetails: {
          _id: order._id,
          order_id: order.order_id,
          itemsCount: order.items.length,
          totalAmount: order.totalAmount,
          shippingFee: sellerItems[order.seller.toString()].shippingFee,
          orderTotal: order.totalAmount + sellerItems[order.seller.toString()].shippingFee,
          seller: order.seller,
          fezOrderNo: fezResponse.data?.orderNos?.[order.order_id] || null,
          items: order.items
        },
        product: firstItem.product,
        amount: order.totalAmount,
        createdAt: new Date()
      });
    }
    
    
    // Check if the order is from a liveshow and update the stream with order information
    if (req.body.channel === "liveshow" && req.body.streamId) {
      try {
        const Stream = mongoose.model('Stream');
        const stream = await Stream.findById(req.body.streamId);
        
        if (stream) {
          console.log('Processing liveshow order for stream:', {
            streamId: stream._id,
            title: stream.title
          });
          
          // For each order, create an entry in the stream's orders array
          for (const order of orders) {
            // Get the first product from the order for simplicity
            const firstItem = order.items[0];
            
            // Add to the stream's orders array
            stream.orders.push({
              orderId: order.order_id,
              buyer: order.buyerDetails,
              orderDetails: {
                _id: order._id,
                order_id: order.order_id,
                itemsCount: order.items.length,
                totalAmount: order.totalAmount,
                shippingFee: sellerItems[order.seller.toString()].shippingFee,
                orderTotal: order.totalAmount + sellerItems[order.seller.toString()].shippingFee,
                seller: order.seller,
                fezOrderNo: fezResponse.data?.orderNos?.[order.order_id] || null,
                items: order.items
              },
              product: firstItem.product,
              amount: order.totalAmount,
              createdAt: new Date()
            });
          }
          
          // Save the stream with updated orders
          await stream.save();
          
          
          // Send a socket notification about the order for the stream
          if (req.app && req.app.get('io')) {
            const io = req.app.get('io');

            // Helper function to format product name to only 3 words
            function formatProductName(name) {
              if (!name) return 'an item';
              const words = name.split(' ');
              return words.slice(0, 3).join(' ') + (words.length > 3 ? '...' : '');
            }
            
            // Create notification object for WebSocket
            const notificationObj = {
              id: Date.now().toString(),
              type: 'liveshow_order',
              user: buyer.username || 'Anonymous User',
              avatar: buyer.profileImage?.url || '',
              content: `purchased ${formatProductName(orders[0]?.items[0]?.productName || 'an item')} 🎉🎉`,
              data: {
                message: `New order placed during the liveshow`,
                streamId: stream._id.toString(),
                sellerId: stream.seller._id.toString(),
                storeName: stream.seller.storeName || 'Unknown Store',
                orders: orders,
                streamOrders: stream.orders
              },
              timestamp: new Date()
            };
              
            
            
            // Send WebSocket notification
            console.log('Broadcasting liveshow order notification to subscribers');
            const streamRoom = `stream_notifications_${stream._id.toString()}`;
            io.to(streamRoom).emit('stream_notification', notificationObj);
            
            // Add the notification to stream chat interactions
            stream.chatInteractions.push(notificationObj);
            await stream.save();
          } else {
            console.warn('Could not send socket notification - io not available');
          }

          // track live show order event on mixpanel
          mixpanel.track('live_show_order', {
            streamId: stream._id,
            buyerId: buyer.id,
            productId: orders[0].items[0].product,
            productName: orders[0].items[0].productName,
            buyerName: buyer.firstName + " " + buyer.lastName,
            buyerUsername: buyer.username,
            orderId: orders[0].order_id,
            orderTotal: orders[0].totalAmount,
            orderDate: orders[0].createdAt,
          });

        } else {
          console.warn('Stream not found for liveshow order:', req.body.streamId);
        }
      } catch (streamError) {
        console.error('Error updating stream with order information:', streamError);
        // Continue with the response even if stream update fails
      }
    }
    
    // Calculate and include totals in response
    const responseTotals = {
      itemsTotal: totalAmount,
      shippingTotal: totalShippingFee,
      grandTotal: grandTotal,
      orderCount: orders.length,
      sellerEarnings: totalAmount * 0.85, // Simplified calculation
      shippingCost: totalShippingFee, // This goes to Fez Delivery
      walletAmountUsed: walletAmountToUse || 0,
      paystackAmount: paystackAmount || 0,
      isWalletCredit: isWalletCredit && walletAmountToUse > 0
    };

    console.log('normal orders', orderDetails);
    
    return res.status(201).json({
      message: 'Orders created successfully',
      orders: orderDetails,
      liveShowOrders,
      complexOrderDetails: trackingOrderData,
      totals: responseTotals,
      fezResponse: fezResponse.data
    });
    
  } catch (error) {
    // Only abort if the session is still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};



// Get shipping rates for an order
exports.getShippingRates = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const ratesResponse = await terminalAPI.get('/rates/shipment', {
      params: {
        currency: 'NGN',
        shipment_id: shipmentId
      }
    });

    // Store shipping rates in cache or session for validation during payment
    // You might want to use Redis or another caching solution here
    req.session.availableShippingRates = ratesResponse.data.data.map(rate => ({
      carrier_reference: rate.carrier_reference,
      amount: rate.amount,
      carrier_name: rate.carrier_name,
      carrier_logo: rate.carrier_logo
    }));

    res.json(ratesResponse.data);

  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    res.status(500).json({
      message: 'Failed to fetch shipping rates',
      error: error.response?.data || error.message
    });
  }
};



// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('buyer', 'firstName lastName').populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
  }
};

// Get all orders for a buyer
exports.getOrdersForBuyer = async (req, res) => {
  const { buyerId } = req.params;
  const { 
    trackingStatus, 
    hasReturn, 
    search,
    page = 1,
    limit = 10,
    sort = '-createdAt' 
  } = req.query;

  try {
    // Build the base query
    const query = { 
      buyer: buyerId,
      isStale: { $ne: true } // Exclude stale orders
    };

    // Add tracking status filter if provided
    if (trackingStatus) {
      // Map the case-insensitive tracking statuses to their internal values
      const statusMap = {
        'picked-up': 'picked_up',
        'pickedup': 'picked_up',
        'picked_up': 'picked_up',
        'dispatched': 'in_transit',
        'delivered': 'delivered',
        'cancelled': 'cancelled',
        'pending': 'pending',
        'refunded': 'refunded'
      };
      
      // Normalize the provided status (remove hyphens, convert to lowercase)
      const normalizedStatus = trackingStatus.toLowerCase().replace(/[-_\s]/g, '');
      
      // Find the matching internal status by doing a loose case-insensitive match
      let internalStatus = null;
      
      for (const [key, value] of Object.entries(statusMap)) {
        // Normalize the key for comparison (remove hyphens, convert to lowercase)
        const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, '');
        
        if (normalizedKey === normalizedStatus) {
          internalStatus = value;
          break;
        }
      }
      
      // Use the mapped internal status if found
      if (internalStatus) {
        query['shipping.tracking.status'] = internalStatus;
      }
    }

    // Add search query for order_id or product name
    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination before applying limit & skip
    const total = await Order.countDocuments(query);

    // Parse pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch orders with pagination
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'name');

    // Get associated return requests for these orders
    const Return = mongoose.model('Return');
    const returnRequests = await Return.find({
      order: { $in: orders.map(order => order._id) }
    }, '_id order status');

    // Create a map of order IDs to return request details
    const returnMap = new Map(returnRequests.map(r => [r.order.toString(), { returnId: r._id, status: r.status }]));

    // Add return request info to orders
    const ordersWithReturns = orders.map(order => {
      const orderObj = order.toObject();
      const returnInfo = returnMap.get(order._id.toString());
      if (returnInfo) {
        orderObj.returnRequestId = returnInfo.returnId;
        orderObj.returnStatus = returnInfo.status;
        
        // Check for refunded status in a case-insensitive way
        if (trackingStatus && trackingStatus.toLowerCase().replace(/[-_\s]/g, '') === 'refunded' && 
            returnInfo.status.toLowerCase() !== 'refunded') {
          return null;
        }
      } else if (trackingStatus && trackingStatus.toLowerCase().replace(/[-_\s]/g, '') === 'refunded') {
        // If we're filtering for refunded but this order has no return request
        return null;
      }
      return orderObj;
    }).filter(Boolean); // Remove null entries

    // Filter by hasReturn if specified
    let filteredOrders = ordersWithReturns;
    if (hasReturn === 'true') {
      filteredOrders = ordersWithReturns.filter(order => order.returnRequestId);
    } else if (hasReturn === 'false') {
      filteredOrders = ordersWithReturns.filter(order => !order.returnRequestId);
    }

    // Calculate pagination data
    const filteredTotal = filteredOrders.length;
    const totalFiltered = hasReturn || trackingStatus ? filteredTotal : total;
    
    res.json({
      orders: filteredOrders,
      pagination: {
        total: totalFiltered,
        pages: Math.ceil(totalFiltered / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for buyer', error: error.message });
  }
};

// Get all orders for a seller
exports.getOrdersForSeller = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { 
      page = 1, 
      limit = 10,
      status,
      startDate,
      endDate,
      isOpen,
      channel,
      sort = '-createdAt'  // Default sort by newest first
    } = req.query;

    // Build query
    const query = { 
      seller: sellerId,
      
    };

    // Add filters if provided
    if (status) {
      query['items.status'] = status;
    }
    if (typeof isOpen === 'boolean' || ['true', 'false'].includes(isOpen)) {
      query.isOpen = isOpen === 'true' || isOpen === true;
    }
    if (channel) {
      query.channel = channel;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('items.product', 'name images price')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error in getOrdersForSeller:', error);
    res.status(500).json({
      message: 'Failed to get orders',
      error: error.message
    });
  }
};


// Update an order
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, deliveredAt } = req.body;

  try {
    const order = await Order.findById(id).populate('seller');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transitions
    const validStatusTransitions = {
      'Pending': ['Paid'],
      'Paid': ['Confirmed', 'On its way'],
      'Confirmed': ['On its way'],
      'On its way': ['Delivered'],
    };

    if (!validStatusTransitions[order.status] || !validStatusTransitions[order.status].includes(status)) {
      return res.status(400).json({ message: 'Invalid status transition' });
    }

    order.status = status || order.status;
    order.deliveredAt = deliveredAt || order.deliveredAt;

    // Update seller's wallet balance if the order is marked as paid
    if (status === 'Paid') {
      const seller = order.seller;
      seller.walletBalance += order.totalPrice;
      await seller.save();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);

    // After status update, notify both parties
    await Promise.all([
      // Existing seller notification
      createNotification(
        order.seller,
        'order_status_update',
        {
          orderId: order._id, // Add MongoDB ObjectId
          order_id: order.order_id,
          status: status
        }
      ),
      // New buyer notification
      createBuyerNotification(
        order.buyer,
        'order_status_update',
        {
          orderId: order._id, // Add MongoDB ObjectId
          order_id: order.order_id,
          status: status,
          message: statusMessage,
          sellerName: order.seller.businessName || 'Seller'
        }
      )
    ]);

    // Send order confirmation email
    try {
      const buyer = await Buyer.findById(order.buyer);
      if (buyer) {
        await sendOrderConfirmationEmail(order, buyer);
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email:', emailError);
      // Continue processing even if email fails
    }

  } catch (error) {
    res.status(500).json({ message: 'Failed to update order', error: error.message });
  }
};

// Delete an order
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
};

// Order Status Management
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log('Starting updateOrderStatus process:', {
      orderId,
      newStatus: status
    });

    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Found order:', {
      orderId: order._id,
      currentStatus: order.status,
      items: order.items
    });

    // Update soldCount and decrease stock for each product
    for (const item of order.items) {
      console.log('Processing item:', {
        productId: item.product,
        quantity: item.quantity
      });

      const productBefore = await Product.findById(item.product);
      console.log('Product before update:', {
        productId: productBefore._id,
        currentStock: productBefore.stock,
        currentInventoryQuantity: productBefore.inventory.quantity,
        currentSoldCount: productBefore.stats.soldCount
      });

      const updateResult = await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            'stats.soldCount': item.quantity,
            'stock': -item.quantity,
            'inventory.quantity': -item.quantity 
          }
        },
        { new: true } // Return the updated document
      );

      console.log('Product after update:', {
        productId: updateResult._id,
        newStock: updateResult.stock,
        newInventoryQuantity: updateResult.inventory.quantity,
        newSoldCount: updateResult.stats.soldCount,
        updateSuccessful: !!updateResult
      });
    }

    order.status = status;
    await order.save();

    console.log('Order status updated successfully');

    res.json({ 
      message: 'Order status updated successfully', 
      order 
    });

    // After status update, notify both parties
    await Promise.all([
      // Existing seller notification
      createNotification(
        order.seller,
        'order_status_update',
        {
          orderId: order._id, // Add MongoDB ObjectId
          order_id: order.order_id,
          status: status
        }
      ),
      // New buyer notification
      createBuyerNotification(
        order.buyer,
        'order_status_update',
        {
          orderId: order._id, // Add MongoDB ObjectId
          order_id: order.order_id,
          status: status,
          message: statusMessage,
          sellerName: order.seller.businessName || 'Seller'
        }
      )
    ]);

  } catch (error) {
    console.error('Error in updateOrderStatus:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to update order status', 
      error: error.message 
    });
  }
};



// Order Analytics
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sellerId = req.user.id;

    const dateFilter = {
      seller: sellerId,
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    const [orders, analytics] = await Promise.all([
      Order.find(dateFilter),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            totalShipping: { $sum: '$shipping.fee' },
            totalTax: { $sum: '$tax' }
          }
        }
      ])
    ]);

    // Calculate status breakdown
    const statusBreakdown = orders.reduce((acc, order) => {
      acc[order.tracking.status] = (acc[order.tracking.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      ...analytics[0],
      statusBreakdown,
      timeframe: {
        start: dateFilter.createdAt.$gte,
        end: dateFilter.createdAt.$lte
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get order analytics', error: error.message });
  }
};

// // Bulk Order Operations
// exports.bulkUpdateOrders = async (req, res) => {
//   try {
//     const { orderIds, update } = req.body;
//     const sellerId = req.user.id;

//     // Verify ownership of all orders
//     const orders = await Order.find({
//       _id: { $in: orderIds },
//       seller: sellerId
//     });

//     if (orders.length !== orderIds.length) {
//       return res.status(403).json({ message: 'Not authorized to update some orders' });
//     }

//     const result = await Order.updateMany(
//       { _id: { $in: orderIds } },
//       $set: update },
//       { new: true }
//     );

//     res.json({
//       message: 'Orders updated successfully',
//       modifiedCount: result.nModified
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to bulk update orders', error: error.message });
//   }
// };

// Tracking Management
exports.updateTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller ownership
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.tracking = {
      ...order.tracking,
      trackingNumber,
      carrier,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
    };

    // Add to status history
    order.tracking.statusHistory.push({
      status: 'tracking_updated',
      note: `Tracking updated - ${carrier}: ${trackingNumber}`,
      updatedBy: req.user.id,
      timestamp: Date.now()
    });

    await order.save();

    // Notify buyer
    await createNotification({
      recipient: order.buyer,
      type: 'TRACKING_UPDATED',
      order_id: order.order_id,
      title: 'Order Tracking Updated',
      message: `Tracking information updated for order #${order._id}`,
      reference: order._id
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update tracking', error: error.message });
  }
};

// Order Notes
exports.addOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, isPrivate } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify seller ownership
    if (order.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    if (isPrivate) {
      order.notes.privateNote = note;
    } else {
      order.notes.customerNote = note;
      // Notify buyer of new note
      await createNotification({
        recipient: order.buyer,
        type: 'ORDER_NOTE',
        order_id: order.order_id,
        title: 'New Order Note',
        message: `New note added to order #${order._id}`,
        reference: order._id
      });
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add note', error: error.message });
  }
};

// Export Orders
exports.exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const sellerId = req.user.id;

    const query = {
      seller: sellerId,
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    if (status) {
      query['tracking.status'] = status;
    }

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email')
      .populate('cart.product', 'name sku');

    // Format orders for export
    const exportData = orders.map(order => ({
      orderId: order._id,
      customerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
      customerEmail: order.buyer.email,
      status: order.tracking.status,
      total: order.totalAmount,
      items: order.cart.map(item => `${item.product.name} (${item.quantity})`).join(', '),
      createdAt: order.createdAt
    }));

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export orders', error: error.message });
  }
};

// Revenue Analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const sellerId = req.user.id;

    const matchStage = {
      seller: mongoose.Types.ObjectId(sellerId),
      'tracking.status': { $in: ['delivered', 'completed'] },
      createdAt: {
        $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        $lte: endDate ? new Date(endDate) : new Date()
      }
    };

    const groupStages = {
      day: {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      },
      week: {
        $dateToString: { format: '%Y-W%V', date: '$createdAt' }
      },
      month: {
        $dateToString: { format: '%Y-%m', date: '$createdAt' }
      }
    };

    const analytics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupStages[groupBy],
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get revenue analytics', error: error.message });
  }
};

// Dispute Management
exports.createDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if dispute already exists
    if (order.dispute.status !== 'none') {
      return res.status(400).json({ message: 'Dispute already exists for this order' });
    }

    order.dispute = {
      status: 'opened',
      reason,
      description,
      openedAt: new Date()
    };

    // Add note to order
    order.notes.push({
      type: 'buyer',
      content: `Dispute opened: ${reason} - ${description}`
    });

    await order.save();

    // Notify seller and admin
    await Promise.all([
      createNotification(
        order.items[0].seller, // Assuming single seller order
        'dispute_opened',
        'New Dispute Opened',
        `A dispute has been opened for order #${order._id}`,
        { orderId: order._id, order_id: order.order_id, order_id: order.order_id }
      ),
      createNotification(
        'admin', // Special handling in notification controller for admin
        'dispute_opened',
        'New Dispute Opened',
        `A dispute has been opened for order #${order._id}`,
        { orderId: order._id, order_id: order.order_id, order_id: order.order_id }
      )
    ]);

    res.json({ message: 'Dispute created successfully', order });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to create dispute',
      error: error.message
    });
  }
};

exports.updateDispute = async (req, res) => {
  try {
    const { id, disputeId } = req.params;
    const { status, resolution, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.dispute || order.dispute._id.toString() !== disputeId) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Update dispute
    order.dispute.status = status || order.dispute.status;
    if (resolution) order.dispute.resolution = resolution;
    if (note) {
      order.dispute.notes = order.dispute.notes || [];
      order.dispute.notes.push({
        content: note,
        addedBy: req.user.id,
        addedAt: Date.now()
      });
    }

    await order.save();

    // Notify parties of update
    await createNotification({
      recipient: order.buyer,
      type: 'DISPUTE_UPDATED',
      title: 'Dispute Updated',
      message: `The dispute for order #${order._id} has been updated`,
      reference: order._id,
      order_id: order.order_id
    });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update dispute', error: error.message });
  }
};




// Get detailed information about a specific order
exports.getOrderDetails = async (req, res) => {
  try {
  
    
    const order = await Order.findById(req.params.orderId)
      .populate('buyer', 'firstName lastName email phoneNumber')
      .populate('seller', 'firstName lastName email phoneNumber businessName businessAddress sellerAddress storeName')
      .populate({
        path: 'items.product',
        select: `
          name category images discount description price brand 
          subCategory condition status sku upc shippingInfo returnPolicy 
          inventory pricing phones_operatingsystem phones_screensize 
          phones_storagecapacity phones_camera phones_connectivity 
          phones_simtype stats variants blips stock lowStockAlert seller
        `
      })
      .populate('items.seller', 'businessName email phoneNumber storeName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // If pickup_address is null, populate it with seller's address
    if (!order.pickup_address || Object.keys(order.pickup_address).every(key => 
      key === '_id' || !order.pickup_address[key])) {
      
      // Get the seller's details
      const seller = order.seller;
      
      // Check if we have business address or personal address to use
      if (seller) {
        // Create a new pickup address using seller data
        let pickupAddress = {};
        
        if (seller.businessAddress && seller.accountType === 'business' && 
            seller.businessAddress.addressLine1) {
          // Use business address for business accounts
          pickupAddress = {
            first_name: seller.firstName,
            last_name: seller.lastName,
            email: seller.businessEmail || seller.email,
            phone: seller.businessNumber || seller.phoneNumber,
            line1: seller.businessAddress.addressLine1,
            line2: seller.businessAddress.addressLine2 || '',
            city: seller.businessAddress.city,
            state: seller.businessAddress.state,
            country: seller.businessAddress.country,
            zip: seller.businessAddress.zipCode
          };
        } else if (seller.sellerAddress && seller.sellerAddress.addressLine1) {
          // Use seller's personal address
          pickupAddress = {
            first_name: seller.firstName,
            last_name: seller.lastName,
            email: seller.email,
            phone: seller.phoneNumber,
            line1: seller.sellerAddress.addressLine1,
            line2: seller.sellerAddress.addressLine2 || '',
            city: seller.sellerAddress.city,
            state: seller.sellerAddress.state,
            country: seller.sellerAddress.country,
            zip: seller.sellerAddress.zipCode
          };
        }
        
        // Only update if we have a valid address to use
        if (pickupAddress.line1) {
          order.pickup_address = pickupAddress;
        }
      }
    }
    
    // Calculate payment breakdown
    let paymentBreakdown = null;
    if (order.paid || !order.isOpen || order.paymentInfo.status === 'awaiting_cod') {  // Calculate if paid or closed
      // Get unique category names
      const categoryNames = [...new Set(order.items.map(item => 
        item.product?.category || null
      ).filter(Boolean))];
      
      const Category = mongoose.model('Category');
      // Find categories by name instead of _id
      const categories = await Category.find({ name: { $in: categoryNames } });
      const categoryFeeMap = new Map(categories.map(cat => [
        cat.name, // Use name as the key instead of _id
        cat.platformFee
      ]));
      // Calculate fees for each item
      let totalPlatformFee = 0;
      const itemizedFees = order.items.map(item => {
        const itemTotal = item.price * item.quantity;
        const categoryFee = categoryFeeMap.get(item.product?.category) || 0;
        const itemPlatformFee = itemTotal * (categoryFee / 100);
        totalPlatformFee += itemPlatformFee;

        return {
          productName: item.productName,
          amount: itemTotal,
          platformFeePercentage: categoryFee,
          platformFeeAmount: itemPlatformFee
        };
      });

      // Calculate processing fee (1.5%)
      const processingFee = order.totalAmount * 0.015;
      const totalDeductions = totalPlatformFee + processingFee;
      const sellerAmount = order.totalAmount - totalDeductions;

      paymentBreakdown = {
        orderTotal: order.totalAmount,
        items: itemizedFees,
        fees: {
          totalPlatformFee,
          processingFee,
          processingFeePercentage: 1.5,
          totalDeductions
        },
        sellerPayout: sellerAmount
      };
    }

    const timeline = [
      {
        event: 'Order Created',
        timestamp: order.createdAt,
        details: `Order #${order.order_id} created`
      },
      // ... existing timeline events ...
    ];
       // Get associated return request if it exists
       const Return = mongoose.model('Return');
       const returnRequest = await Return.findOne({ order: order._id })
         .populate('items.product', 'name')
         .select('_id order status description preferredResolution requestDate items timeline evidence sellerResponse refundDetails');

       const response = {
         order: {
           _id: order._id,
           order_id: order.order_id,
           channel: order.channel,
           createdAt: order.createdAt,
           totalAmount: order.totalAmount,
           paid: order.paid,
           isStale: order.isStale,
           isStorePickup: order.isStorePickup,
           storePickupStatus: order.isStorePickup ? {
             state: order.storePickupStatus?.state || 'pending',
             confirmedAt: order.storePickupStatus?.confirmedAt,
             approvedAt: order.storePickupStatus?.approvedAt
           } : null,
           paymentInfo: {
             method: order.paymentInfo.method,
             status: order.paymentInfo.status,
             transactionId: order.paymentInfo.transactionId,
             paidAt: order.paymentInfo.paidAt
           },
           orderStatus: {
             isOpen: order.isOpen,
             closedAt: order.closedAt,
             closedBy: order.closedBy,
             closedReason: order.closedReason,
             hasReturn: !!returnRequest,
             hasDispute: returnRequest?.status === 'DISPUTED' || false,
             hasRefund: returnRequest?.status === 'REFUNDED' || false,
             returnRequestId: returnRequest?._id || null
           },
           returnDetails: returnRequest ? {
             _id: returnRequest._id,
             status: returnRequest.status,
             description: returnRequest.description,
             preferredResolution: returnRequest.preferredResolution,
             requestDate: returnRequest.requestDate,
             items: returnRequest.items,
             timeline: returnRequest.timeline,
             evidence: returnRequest.evidence,
             sellerResponse: returnRequest.sellerResponse,
             refundDetails: returnRequest.refundDetails
           } : null,
           paymentBreakdown
         },
         buyer: order.buyer,
         seller: order.seller,
         items: order.items.map(item => ({
           product: item.product ? {
             _id: item.product._id,
             name: item.product.name,
             category: item.product.category,
             description: item.product.description,
             images: item.product.images,
             discount: item.product.discount,
             seller: item.product.seller,
             brand: item.product.brand,
             variants: item.product.variants,
             shippingInfo: item.product.shippingInfo,
             returnPolicy: item.product.returnPolicy,
             stock: item.product.stock,
             sku: item.product.sku,
             status: item.product.status,
             condition: item.product.condition
           } : {
             _id: null,
             name: item.productName || 'Product no longer available',
             images: [],
             status: 'unavailable'
           },
           productName: item.productName,
           seller: item.seller,
           quantity: item.quantity,
           price: item.price,
           status: item.status,
           statusHistory: item.statusHistory,
           specifications: item.specifications || {}
         })),
         addresses: {
           delivery: order.delivery_address,
           pickup: order.pickup_address
         },
         shipping: order.shipping ? {
           method: order.shipping.method,
           carrier: order.shipping.carrier,
           fee: order.shipping.fee,
           rate_id: order.shipping.rate_id,
           estimatedDeliveryDate: order.shipping.estimatedDeliveryDate,
           estimatedPickupDate: order.shipping.estimatedPickupDate,
           tracking: order.shipping.tracking ? {
             number: order.shipping.tracking.number,
             carrier: order.shipping.tracking.carrier,
             status: order.shipping.tracking.status,
             lastUpdate: order.shipping.tracking.lastUpdate,
             history: order.shipping.tracking.history || []
           } : {
             number: null,
             carrier: null,
             status: 'unknown',
             lastUpdate: null,
             history: []
           },
           shipment_id: order.shipping.shipment_id,
           shipment_purpose: order.shipping.shipment_purpose,
           documents: order.shipping.documents ? {
             shippingLabel: order.shipping.documents.shippingLabel,
             commercialInvoice: order.shipping.documents.commercialInvoice
           } : {}
         } : {
           method: null,
           carrier: null,
           fee: null,
           tracking: {
             status: 'unknown',
             history: []
           }
         },
         discount: order.discount || {},
         notes: order.notes || [],
         timeline: order.timeline || []
       };

       res.json(response);

  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    res.status(500).json({ 
      message: 'Failed to get order details', 
      error: error.message 
    });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note, isPrivate } = req.body;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' });
    }

    // Find the order and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('buyer', 'firstName lastName')
      .populate('items.seller', 'storeName businessName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Add the note to the order
    order.notes = order.notes || []; // Initialize notes array if it doesn't exist
    order.notes.push({
      content: note,
      isPrivate: isPrivate || false,
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await order.save();

    res.status(200).json({
      message: 'Note added successfully',
      note: order.notes[order.notes.length - 1]
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ 
      message: 'Failed to add note', 
      error: error.message 
    });
    
  }
};

// Arrange pickup for an order
exports.arrangePickup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { purchase_insurance = false } = req.body;

    console.log('Arrange Pickup Request:', {
      orderId,
      purchase_insurance
    });

    const order = await Order.findById(orderId);
    if (!order) {
      console.log('Order not found:', orderId);
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Original order shipping:', JSON.stringify(order.shipping, null, 2));

    // Use existing rate_id and shipping info from the order
    const rate_id = order.shipping.rate_id;
    const shipment_id = order.shipping.shipment_id;

    if (!rate_id) {
      console.log('No rate_id found');
      return res.status(400).json({ 
        message: 'No rate_id found for this order' 
      });
    }

    try {
      console.log('Making Terminal Africa API request for pickup arrangement...');
      const response = await terminalAPI.post('/shipments/pickup', {
        rate_id,
        shipment_id,
        purchase_insurance
      });

      console.log('Terminal Africa API Response:', {
        status: response.status,
        shipmentId: response.data.data.shipment_id,
        trackingNumber: response.data.data.extras.tracking_number
      });

      // Create tracking entry for webhook history
      const newTrackingEntry = {
        status: 'created',
        timestamp: new Date(),
        location: response.data.data.pickup_address?.city || 'Unknown',
        description: `Shipment created and pickup arranged by ${order.seller.firstName} ${order.seller.lastName}`
      };

      // Prepare webhook data
      const webhookData = {
        shipment_id: response.data.data.shipment_id,
        status: 'created',
        tracking_number: response.data.data.extras.tracking_number,
        carrier_name: order.shipping.carrier.name,
        carrier_tracking_url: response.data.data.extras.tracking_url,
        shipping_label_url: response.data.data.extras.shipping_label_url,
        commercial_invoice_url: response.data.data.extras.commercial_invoice_url,
        events: [{
          location: response.data.data.pickup_address?.city || 'Unknown',
          description: `Shipment created and pickup arranged`,
          created_at: new Date()
        }]
      };

      // Trigger webhook handler
      console.log('Triggering shipment.created webhook handler...');
      await handleShipmentCreated(webhookData);

      // Update order shipping information while preserving existing data
      const shippingUpdate = {
        $set: {
          'shipping.tracking.number': response.data.data.extras.tracking_number,
          'shipping.tracking.url': response.data.data.extras.tracking_url,
          'shipping.tracking.status': 'pickup_arranged',
          'shipping.tracking.lastUpdate': new Date(),
          'shipping.documents.shippingLabel': response.data.data.extras.shipping_label_url,
          'shipping.documents.commercialInvoice': response.data.data.extras.commercial_invoice_url
        },
        $push: {
          'shipping.tracking.history': newTrackingEntry
        }
      };

      // Use findByIdAndUpdate to avoid validation issues
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        shippingUpdate,
        { new: true, runValidators: false }
      );

      if (!updatedOrder) {
        throw new Error('Failed to update order');
      }

      try {
        const populatedOrder = await Order.findById(orderId)
          .populate('buyer', 'email firstName lastName')
          .populate('seller', 'email firstName lastName businessName')
          .populate('items.product', 'name');

        // Buyer pickup arrangement email
        const buyerEmail = {
          to: populatedOrder.buyer.email,
          from: 'Auqli Shipping <support@auqli.com>',
          subject: 'Order Pickup Arranged - Auqli',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Pickup Arranged</h2>
              <p>Dear ${populatedOrder.buyer.firstName},</p>
              <p>Your order #${populatedOrder._id} is being prepared for shipping!</p>
              <p><strong>Tracking Details:</strong></p>
              <ul>
                <li>Tracking Number: ${populatedOrder.shipping.tracking.number}</li>
                <li>Carrier: ${populatedOrder.shipping.carrier.name}</li>
              </ul>
              <p>You can track your shipment here: <a href="${populatedOrder.shipping.tracking.url}">Track Shipment</a></p>
              <p><strong>Order Details:</strong></p>
              <ul>
                ${populatedOrder.items.map(item => `
                  <li>${item.product.name} x ${item.quantity}</li>
                `).join('')}
              </ul>
              <p>We'll keep you updated on your shipment's progress.</p>
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        };

        // Seller pickup confirmation email
        const sellerEmail = {
          to: populatedOrder.seller.email,
          from: 'Auqli Shipping <support@auqli.com>',
          subject: 'Pickup Arrangement Confirmed - Auqli',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Pickup Arrangement Confirmed</h2>
              <p>Dear ${populatedOrder.seller.firstName},</p>
              <p>The pickup arrangement for order #${populatedOrder._id} has been confirmed.</p>
              <p><strong>Shipping Details:</strong></p>
              <ul>
                <li>Tracking Number: ${populatedOrder.shipping.tracking.number}</li>
                <li>Carrier: ${populatedOrder.shipping.carrier.name}</li>
                <li>Shipment ID: ${populatedOrder.shipping.shipment_id}</li>
              </ul>
              <p><strong>Important Documents:</strong></p>
              <ul>
                <li><a href="${populatedOrder.shipping.documents.shippingLabel}">Download Shipping Label</a></li>
                <li><a href="${populatedOrder.shipping.documents.commercialInvoice}">Download Commercial Invoice</a></li>
              </ul>
              <p>Please ensure the package is ready for pickup.</p>
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        };

        await Promise.all([
          sgMail.send(buyerEmail),
          sgMail.send(sellerEmail)
        ]);
        console.log('Notification emails sent successfully');
      } catch (emailError) {
        console.error('Email notification error:', emailError);
        // Continue execution even if email fails
      }

      // Create notification for seller
      await createNotification(order.seller, 'pickup_arranged', {
        orderId: order._id,
        pickupDate: new Date(),
        carrier: order.shipping.carrier.name,
        order_id: order.order_id
      });

      res.json({
        message: 'Pickup arranged successfully',
        tracking: {
          number: response.data.data.extras.tracking_number,
          url: response.data.data.extras.tracking_url,
          carrier: order.shipping.carrier.name
        },
        shipping: {
          carrier: order.shipping.carrier,
          fee: order.shipping.fee,
          documents: {
            shippingLabel: response.data.data.extras.shipping_label_url,
            commercialInvoice: response.data.data.extras.commercial_invoice_url
          }
        }
      });

    } catch (apiError) {
      console.error('Terminal Africa API Error:', apiError.response?.data || apiError);
      throw new Error('Failed to communicate with shipping provider');
    }

  } catch (error) {
    console.error('Arrange pickup error:', error);
    res.status(500).json({
      message: 'Failed to arrange pickup',
      error: error.message
    });
  }
};


// Update the test webhook function
exports.testShipmentWebhook = async (req, res) => {
  try {
    console.log('Starting webhook test...');
    
    // Simulate a webhook event
    const mockShipmentData = {
      shipment_id: "SH-KT355QFI31PZY4GX",
      status: "confirmed",
      tracking_number: "7247322121",
      carrier_name: "DHL Express",
      carrier_logo: "https://ucarecdn.com/dcdd8109-af8c-4057-8104-192be821dd6e/download4.png",
      carrier_slug: "dhl-ng",
      carrier_tracking_url: "https://www.dhl.com/global-en/home/tracking.html?tracking-id=7247322121",
      shipping_label_url: "https://sandbox.terminal.africa/v1/shipments/label/SH-KT355QFI31PZY4GX.pdf",
      commercial_invoice_url: "https://sandbox.terminal.africa/v1/shipments/commercial-invoice/SH-KT355QFI31PZY4GX.pdf",
      delivery_date: "2025-01-20T12:46:17.010Z",
      events: [{
        location: "Ajah, NG",
        description: "Shipment arranged by Paul Jatau",
        created_at: new Date()
      }]
    };

    console.log('Testing shipment.created event...');
    await handleShipmentCreated(mockShipmentData);
    
    // Simulate in-transit after 5 seconds
    setTimeout(async () => {
      console.log('Testing shipment.in-transit event...');
      mockShipmentData.status = "in-transit";
      mockShipmentData.events[0].description = "Package picked up";
      await handleShipmentInTransit(mockShipmentData);
    }, 5000);

    // Simulate delivery after 10 seconds
    setTimeout(async () => {
      console.log('Testing shipment.delivered event...');
      mockShipmentData.status = "delivered";
      mockShipmentData.events[0].description = "Package delivered";
      await handleShipmentDelivered(mockShipmentData);
    }, 10000);

    res.json({ 
      message: 'Test webhook events triggered',
      note: 'Check your console for event logs and database for updates'
    });
  } catch (error) {
    console.error('Error in testShipmentWebhook:', error);
    res.status(500).json({ error: error.message });
  }
};

// Close order (for buyer)
exports.closeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify this is the buyer's order
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to close this order' });
    }

    // Verify order is delivered
    if (!order.items.every(item => item.status === 'delivered')) {
      return res.status(400).json({ message: 'Order must be delivered before it can be closed' });
    }

    // Set order closure details
    order.isOpen = false;
    order.closedAt = new Date();
    order.closedBy = 'buyer';
    order.closedReason = reason || 'Order confirmed and received by buyer';

    // Save order - this will trigger the pre-save middleware that handles the payment calculations and email
    await order.save();

    res.json({ message: 'Order closed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Error closing order', error: error.message });
  }
};

// Admin functions to close/reopen orders
exports.updateOrderOpenStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { isOpen, reason } = req.body;

    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ 
        message: 'isOpen must be a boolean value'
      });
    }

    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update order fields
    order.isOpen = isOpen;
    
    if (!isOpen) {
      order.closedAt = new Date();
      order.closedBy = 'admin';
      order.closedReason = reason || 'Closed by admin';

      // Save order - this will trigger the pre-save middleware that handles the payment calculations and email
      await order.save();

      // Send basic email to buyer
      const buyerEmail = {
        to: order.buyer.email,
        from: 'Auqli Orders <support@auqli.com>',
        subject: 'Order Status Update - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Status Update</h2>
            <p>Dear ${order.buyer.firstName},</p>
            <p>Your order #${order.order_id} has been closed.</p>
            <p><strong>Reason:</strong> ${order.closedReason}</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      // Send buyer email
      await sgMail.send(buyerEmail);

      // Create notifications for both parties
      await Promise.all([
        createNotification(order.seller._id, 'order_status_update', {
          orderId: order._id, // Add MongoDB ObjectId
          order_id: order.order_id,
          status: 'closed',
          reason: order.closedReason
        }),
        createBuyerNotification(order.buyer._id, 'order_status_update', {
          orderId: order._id, // Add MongoDB ObjectId
          order_id: order.order_id,
          status: 'closed',
          reason: order.closedReason
        })
      ]);
    } else {
      // Reset closing fields when reopening
      order.closedAt = null;
      order.closedBy = null;
      order.closedReason = null;
      await order.save();

      // Handle reopening notifications and emails
      // ... existing reopening code ...
    }

    res.json({ 
      message: `Order ${isOpen ? 'reopened' : 'closed'} successfully`, 
      order: {
        _id: order._id,
        order_id: order.order_id,
        isOpen: order.isOpen,
        closedAt: order.closedAt,
        closedBy: order.closedBy,
        closedReason: order.closedReason
      }
    });

  } catch (error) {
    console.error('Error updating order open status:', error);
    res.status(500).json({ 
      message: 'Error updating order status', 
      error: error.message 
    });
  }
};

// Cancel shipment for an order
exports.cancelShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body || {};
    
    // Find order and check permissions
    const order = await Order.findById(orderId)
      .populate('seller', 'email firstName lastName storeName')
      .populate('buyer', 'email firstName lastName');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order is from an auction
    if (order.channel && (order.channel.toLowerCase() === 'auction')) {
      return res.status(400).json({ 
        message: 'Orders created from auctions cannot be cancelled' 
      });
    }

    // Check if shipment can be cancelled (only before pickup)
    const allowedStatuses = ['pending', 'confirmed', 'pickup_arranged'];
    if (!allowedStatuses.includes(order.shipping.tracking.status)) {
      return res.status(400).json({ 
        message: 'Shipment cannot be cancelled at this stage' 
      });
    }

    // Only attempt to cancel with Fez if order is paid and has tracking number
    if (order.shipping.tracking.number) {
      try {
        // Get a fresh authentication token for Fez Delivery
        const authToken = await getFezAuthToken();
        console.log('Using fresh token for order cancellation:', authToken.substring(0, 10) + '...');
        
        // Cancel shipment with Fez Delivery
        const cancelResponse = await axios.delete(`${FEZ_API_URL}/order`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'secret-key': process.env.FEZ_SECRET_KEY,
            'Content-Type': 'application/json'
          },
          data: {
            orderNo: order.shipping.tracking.number
          }
        });

        if (cancelResponse.data && cancelResponse.data.status === 'Success') {
          console.log('Fez API cancellation successful:', cancelResponse.data.description);
        } else {
          console.log('Fez API cancellation failed:', cancelResponse.data);
          // Continue with local cancellation despite Fez API error
        }
      } catch (fezError) {
        console.log('Fez API error:', fezError.message);
        if (fezError.response) {
          console.log('Fez API error details:', fezError.response.data);
        }
        // Continue with local cancellation despite Fez API error
      }
    }

    // Create new tracking entry
    const newTrackingEntry = {
      status: 'cancelled',
      description: `Shipment cancelled by ${req.user.role === 'admin' ? 'admin' : req.user.role}`,
      timestamp: new Date()
    };

    // Update order shipping information
    const shippingUpdate = {
      $set: {
        'shipping.tracking.status': 'cancelled',
        'shipping.tracking.lastUpdate': new Date()
      },
      $push: {
        'shipping.tracking.history': newTrackingEntry
      }
    };

    // Check if this is a hybrid payment (wallet + Paystack)
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    let walletRefunded = false;
    let walletRefundAmount = 0;
    
    // Process wallet refund for hybrid payments if applicable
    if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
      try {
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(order.buyer);
        
        if (buyer) {
          // Refund the wallet amount that was used
          walletRefundAmount = order.paymentInfo.walletAmountUsed;
          const walletTransaction = {
            type: 'credit',
            amount: walletRefundAmount,
            description: `Refund for cancelled order ${order.order_id}`,
            status: 'completed',
            createdAt: new Date()
          };
          
          // Add transaction to wallet
          buyer.wallet.balance += walletRefundAmount;
          buyer.wallet.transactions.push(walletTransaction);
          
          // Save buyer with updated wallet
          await buyer.save();
          
          walletRefunded = true;
          console.log(`Refunded wallet amount for cancelled hybrid payment: ${walletRefundAmount}`, {
            orderId: order._id,
            buyer: buyer._id,
            newWalletBalance: buyer.wallet.balance
          });
        }
      } catch (refundError) {
        console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
        // Continue with order cancellation even if refund fails
      }
    }

    // Check if the order was paid and create a refund request if necessary
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      console.log('Creating refund request for paid order:', order.order_id);
      
      shippingUpdate.$set['refundRequest.requested'] = true;
      shippingUpdate.$set['refundRequest.requestedAt'] = new Date();
      shippingUpdate.$set['refundRequest.requestedBy'] = req.user.role || 'buyer';
      shippingUpdate.$set['refundRequest.reason'] = reason || 'Shipment cancelled';
      shippingUpdate.$set['refundRequest.status'] = 'pending';
      
      // Also update the order status to indicate it has a refund
      shippingUpdate.$set['orderStatus.hasRefund'] = true;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      shippingUpdate,
      { new: true }
    ).populate('seller', 'email firstName lastName storeName')
     .populate('buyer', 'email firstName lastName');

    // Send cancellation emails
    let buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Shipment Cancellation Notice</h2>
        <p>Dear ${updatedOrder.buyer.firstName},</p>
        <p>The shipment for your order #${updatedOrder.order_id} has been cancelled.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: ${updatedOrder.order_id}</li>
          <li>Seller: ${updatedOrder.seller.storeName}</li>
          <li>Cancellation Date: ${new Date().toLocaleDateString()}</li>
        </ul>
    `;
    
    // Add refund information if applicable
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      buyerEmailHtml += `
        <p><strong>Refund Information:</strong></p>
        <p>Since you've already paid for this order, a refund request has been automatically created. Our admin team will process your refund shortly.</p>
        <p>Refund status: Pending</p>
      `;
    }
    
    // Add wallet refund info if applicable
    if (walletRefunded) {
      buyerEmailHtml += `
        <p><strong>Wallet Refund:</strong> Your wallet credit of ₦${walletRefundAmount.toLocaleString()} used for this order has been refunded to your wallet.</p>
      `;
    }
    
    buyerEmailHtml += `
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `;

    const buyerEmail = {
      to: updatedOrder.buyer.email,
      from: 'Auqli Shipping <support@auqli.com>',
      subject: 'Shipment Cancellation Notice - Auqli',
      html: buyerEmailHtml
    };

    const sellerEmail = {
      to: updatedOrder.seller.email,
      from: 'Auqli Shipping <support@auqli.com>',
      subject: 'Shipment Cancellation Confirmation - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Shipment Cancellation Confirmation</h2>
          <p>Dear ${updatedOrder.seller.firstName},</p>
          <p>The shipment for order #${updatedOrder.order_id} has been successfully cancelled.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${updatedOrder.order_id}</li>
            <li>Buyer: ${updatedOrder.buyer.firstName} ${updatedOrder.buyer.lastName}</li>
            <li>Cancellation Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          ${order.paid ? `<p>Since this was a paid order, a refund request has been automatically created for the buyer.</p>` : ''}
          ${walletRefunded ? `<p>The wallet amount used for this order (₦${walletRefundAmount.toLocaleString()}) has been refunded to the buyer's wallet.</p>` : ''}
          <p>If you need to arrange a new shipment, please do so through your seller dashboard.</p>
        </div>
      `
    };

    // Send admin notification if refund is needed
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      const Admin = mongoose.model('Admin');
      const admins = await Admin.find({});
      
      if (admins && admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email).filter(Boolean);
        
        if (adminEmails.length > 0) {
          const adminEmail = {
            to: adminEmails,
            from: 'Auqli Refunds <support@auqli.com>',
            subject: `New Refund Request - Order #${updatedOrder.order_id}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Refund Request</h2>
                <p>A new refund request has been created for a cancelled order.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                  <li>Order ID: ${updatedOrder.order_id}</li>
                  <li>Buyer: ${updatedOrder.buyer.firstName} ${updatedOrder.buyer.lastName}</li>
                  <li>Seller: ${updatedOrder.seller.storeName}</li>
                  <li>Amount: ${updatedOrder.totalAmount}</li>
                  <li>Payment Method: ${updatedOrder.paymentInfo?.method || 'Unknown'}</li>
                  <li>Reason: Shipment cancellation</li>
                  ${walletRefunded ? `<li>Note: Wallet payment of ₦${walletRefundAmount.toLocaleString()} was automatically refunded</li>` : ''}
                </ul>
                <p>Please process this refund request at your earliest convenience.</p>
              </div>
            `
          };
          
          try {
            await sgMail.send(adminEmail);
          } catch (emailError) {
            console.error('Error sending admin notification:', emailError);
          }
        }
      }
    }

    await Promise.all([
      sgMail.send(buyerEmail),
      sgMail.send(sellerEmail)
    ]);

    // Create notifications
    await Promise.all([
      createNotification(order.buyer._id, 'shipment_cancelled', {
        orderId: order._id,
        order_id: order.order_id,
        sellerName: order.seller.storeName,
        walletRefunded: walletRefunded,
        walletRefundAmount: walletRefundAmount
      }),
      createNotification(order.seller._id, 'shipment_cancelled', {
        orderId: order._id,
        order_id: order.order_id,
        buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`,
        walletRefunded: walletRefunded
      })
    ]);

    // If order is paid, create a refund request
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      // Create refund request
      const refundAmount = order.totalAmount; // Full refund for cancellation
      
      await Order.findByIdAndUpdate(order._id, {
        'refundRequest.requested': true,
        'refundRequest.requestedAt': new Date(),
        'refundRequest.requestedBy': req.user.role === 'seller' ? 'seller' : 'buyer',
        'refundRequest.reason': 'Order cancelled',
        'refundRequest.status': 'pending',
        'refundRequest.refundAmount': refundAmount
      });

      // The order will be closed automatically after refund is processed
    } else {
      // For unpaid orders, close the order immediately
      await Order.findByIdAndUpdate(order._id, {
        isOpen: false,
        closedAt: new Date(),
        closedBy: req.user.role === 'seller' ? 'seller' : 'buyer',
        closedReason: 'Order cancelled'
      });
    }

    res.json({ 
      message: 'Shipment cancelled successfully',
      order: updatedOrder,
      walletRefunded: walletRefunded,
      walletRefundAmount: walletRefundAmount
    });

  } catch (error) {
    console.error('Error updating order open status:', error);
    res.status(500).json({ 
      message: 'Error updating order status', 
      error: error.message 
    });
  }
};

/**
 * Authenticates with Fez Delivery API and returns a valid auth token
 * @returns {Promise<string>} The authentication token
 */
const getFezAuthToken = async () => {
  try {
    console.log('🔑 Attempting to authenticate with Fez Delivery API...');
    
    const authUrl = `${process.env.FEZ_API_URL}/user/authenticate`;
    const authData = {
      user_id: process.env.FEZ_USER_ID,
      password: process.env.FEZ_PASSWORD
    };
    
    console.log(`📤 Auth request to: ${authUrl}`);
    console.log(`📤 Auth payload: ${JSON.stringify(authData, null, 2)}`);
    
    const response = await axios.post(authUrl, authData);
    
    console.log(`📥 Auth response status: ${response.status}`);
    console.log(`📥 Auth response headers: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`📥 Auth response data: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data && response.data.status === 'Success' && response.data.authDetails) {
      console.log(`✅ Authentication successful! Token: ${response.data.authDetails.authToken.substring(0, 10)}... (expires: ${response.data.authDetails.expireToken})`);
      return response.data.authDetails.authToken;
    } else {
      console.error('❌ Authentication failed: Invalid response format');
      console.error(`Response data: ${JSON.stringify(response.data, null, 2)}`);
      throw new Error('Failed to authenticate with Fez Delivery: Invalid response format');
    }
  } catch (error) {
    console.error('❌ Fez authentication error:', error.message);
    
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('No response received from server');
      console.error(`Request details: ${JSON.stringify(error.request, null, 2)}`);
    } else {
      console.error(`Error details: ${error.stack}`);
    }
    
    throw new Error(`Failed to authenticate with Fez Delivery: ${error.message}`);
  }
};


// Get delivery cost from Fez Delivery
exports.getDeliveryCost = async (req, res) => {
  try {
    console.log('🚚 Starting delivery cost calculation request...');
    const { state, pickupLocations, freeShipping, fromCompatibleVersion } = req.body;

    // Validate input
    if (!Array.isArray(pickupLocations)) {
      return res.status(400).json({
        status: 'Error',
        description: 'pickupLocations must be an array',
        error: 'Invalid input'
      });
    }

    // Get all seller IDs to fetch seller details in bulk
    const sellerIds = pickupLocations.map(location => location.sellerId);
    const uniqueSellerIds = [...new Set(sellerIds)];

    console.log(`🔍 Fetching data for ${uniqueSellerIds.length} unique sellers`);
    
    // Fetch all sellers in one query for efficiency
    const SellerModel = mongoose.model('Seller');
    const sellers = await SellerModel.find({ _id: { $in: uniqueSellerIds } });
    
    // Create a lookup map for quick access
    const sellerMap = {};
    sellers.forEach(seller => {
      sellerMap[seller._id.toString()] = seller;
    });

    console.log(`✅ Found ${sellers.length} sellers in database`);

    // Step 1: Group by sellerId and pickupState, fill in missing pickup states
    const sellerGroups = {};
    for (const location of pickupLocations) {
      const sellerId = location.sellerId;
      const seller = sellerMap[sellerId];
      
      if (!seller) {
        console.log(`⚠️ Warning: Seller ${sellerId} not found in database`);
        continue;
      }
      
      // Determine pickup state in priority order
      let pickUpState = location.pickUpState;
      
      if (!pickUpState) {
        // Try to get state from seller data in priority order
        if (seller.sellerAddress && seller.sellerAddress.state) {
          pickUpState = seller.sellerAddress.state;
          console.log(`Using seller address state for ${sellerId}: ${pickUpState}`);
        } else if (seller.businessAddress && seller.businessAddress.state) {
          pickUpState = seller.businessAddress.state;
          console.log(`Using business address state for ${sellerId}: ${pickUpState}`);
        } else if (seller.warehouseDetails && seller.warehouseDetails.address && seller.warehouseDetails.address.state) {
          pickUpState = seller.warehouseDetails.address.state;
          console.log(`Using warehouse address state for ${sellerId}: ${pickUpState}`);
        } else if (seller.state) {
          pickUpState = seller.state;
          console.log(`Using seller state field for ${sellerId}: ${pickUpState}`);
        } else {
          pickUpState = "Lagos"; // Default to Lagos if no state information is available
          console.log(`Using default state (Lagos) for ${sellerId}`);
        }
      }
      
      const key = `${sellerId}_${pickUpState}`;
      
      if (!sellerGroups[key]) {
        sellerGroups[key] = {
          sellerId,
          pickUpState,
          totalWeight: 0,
        };
      }
      sellerGroups[key].totalWeight += location.weight;
    }

    const mergedPickupLocations = Object.values(sellerGroups);

    console.log('🧹 Merged pickup locations:', mergedPickupLocations);

    // Check if free shipping or fromCompatibleVersion is enabled
    // Skip the Fez API call entirely in both cases
    if (freeShipping === true || fromCompatibleVersion === true) {
      console.log('🎁 Free shipping or compatible version enabled - skipping Fez API call');
      
      const description = fromCompatibleVersion 
        ? 'Costs Fetched Successfully (Zero Cost Applied)' 
        : 'Free Shipping Applied';
      
      return res.status(200).json({
        status: 'Success',
        description,
        costs: mergedPickupLocations.map(location => ({
          sellerId: location.sellerId,
          pickUpState: location.pickUpState,
          weight: location.totalWeight,
          cost: 0,
          status: 'Success',
          error: null
        })),
        totalCost: 0,
        freeShipping: true,
        ...(fromCompatibleVersion && { fromCompatibleVersion: true })
      });
    }

    // Get fresh authentication token
    console.log('🔄 Getting fresh authentication token...');
    const authToken = await getFezAuthToken();
    console.log(`🔑 Using token: ${authToken.substring(0, 10)}...`);

    const url = `${process.env.FEZ_API_URL}/order/cost`;
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'secret-key': process.env.FEZ_SECRET_KEY,
      'Content-Type': 'application/json'
    };

    // Step 2: Now send request only once per merged seller group
    const costPromises = mergedPickupLocations.map(async (group) => {
      const { sellerId, pickUpState, totalWeight } = group;
      
      console.log(`📤 Cost request for seller ${sellerId}: ${JSON.stringify({ state, pickUpState, totalWeight }, null, 2)}`);
      
      try {
        const response = await axios.post(url, {
          state,
          pickUpState,
          weight: totalWeight
        }, { 
          headers,
          timeout: 30000
        });

        return {
          sellerId,
          pickUpState,
          weight: totalWeight,
          ...response.data
        };
      } catch (error) {
        console.error(`Error fetching cost for seller ${sellerId}:`, error.message);
        return {
          sellerId,
          pickUpState,
          weight: totalWeight,
          error: error.message,
          status: 'Error'
        };
      }
    });

    const results = await Promise.all(costPromises);

    // Step 3: Sum only successful ones
    const successfulResults = results.filter(r => r.status === 'Success');
    
    // Note: We no longer need to handle fromCompatibleVersion here
    // as we've already handled it before making the API call
    
    // Normal flow - calculate actual costs
    const totalCost = successfulResults.reduce((sum, r) => sum + Number(r.Cost?.cost || 0), 0);

    console.log('✅ Successfully retrieved delivery costs');
    return res.status(200).json({
      status: 'Success',
      description: 'Costs Fetched Successfully',
      costs: results.map(result => ({
        sellerId: result.sellerId,
        pickUpState: result.pickUpState,
        weight: result.weight,
        cost: result.Cost?.cost || null,
        status: result.status,
        error: result.error || null
      })),
      totalCost,
      freeShipping: false
    });

  } catch (error) {
    console.error('❌ Error fetching delivery costs:', error);
    return res.status(500).json({
      status: 'Error',
      description: 'Failed to fetch delivery costs',
      error: error.message,
      details: error.response?.data || error.stack?.split('\n').slice(0, 3).join('\n')
    });
  }
};


exports.calculateDeliveryCostInternal = async (shippingDetails) => {
  try {
    console.log('🚚 Starting internal delivery cost calculation...');
    const { state, pickupLocations } = shippingDetails;

    // Validate input
    if (!Array.isArray(pickupLocations)) {
      throw new Error('pickupLocations must be an array');
    }

    // Group items by sellerId and pickUpState
    const groupedPickups = {};
    pickupLocations.forEach((location) => {
      const { pickUpState, weight, sellerId } = location;
      const key = `${sellerId}_${pickUpState}`;

      if (!groupedPickups[key]) {
        groupedPickups[key] = {
          sellerId,
          pickUpState,
          totalWeight: 0
        };
      }
      groupedPickups[key].totalWeight += weight;
    });

    const groupedPickupArray = Object.values(groupedPickups);

    // Get a fresh authentication token
    console.log('🔄 Getting fresh authentication token...');
    const authToken = await getFezAuthToken();
    console.log(`🔑 Using token: ${authToken.substring(0, 10)}...`);

    // Prepare the request URL and headers
    const url = `${process.env.FEZ_API_URL}/order/cost`;
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'secret-key': process.env.FEZ_SECRET_KEY,
      'Content-Type': 'application/json'
    };

    // Make parallel requests for each grouped pickup
    const costPromises = groupedPickupArray.map(async (group) => {
      const { sellerId, pickUpState, totalWeight } = group;

      console.log(`📤 Internal cost request for seller ${sellerId}: ${JSON.stringify({ state, pickUpState, totalWeight }, null, 2)}`);

      try {
        const response = await axios.post(url, {
          state,
          pickUpState,
          weight: totalWeight
        }, {
          headers,
          timeout: 30000 // 30 seconds timeout
        });

        return {
          sellerId,
          pickUpState,
          weight: totalWeight,
          ...response.data
        };
      } catch (error) {
        console.error(`Error fetching cost for seller ${sellerId}:`, error.message);
        return {
          sellerId,
          pickUpState,
          weight: totalWeight,
          error: error.message,
          status: 'Error'
        };
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(costPromises);

    // Calculate total shipping cost
    const successfulResults = results.filter(r => r.status === 'Success');
    const totalCost = successfulResults.reduce((sum, r) => sum + Number(r.Cost?.cost || 0), 0);

    console.log('✅ Successfully retrieved internal delivery costs');
    return {
      status: 'Success',
      description: 'Costs Fetched Successfully',
      costs: results.map(result => ({
        sellerId: result.sellerId,
        pickUpState: result.pickUpState,
        weight: result.weight,
        cost: result.Cost?.cost || null,
        status: result.status,
        error: result.error || null
      })),
      totalCost
    };

  } catch (error) {
    console.error('❌ Error in internal delivery cost calculation:', error);
    throw new Error(`Failed to calculate delivery costs: ${error.message}`);
  }
};

/**
 * Track an order using Fez Delivery API
 * This endpoint doesn't require authentication
 */
exports.trackOrderFez = async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    if (!orderNo) {
      return res.status(400).json({ 
        message: 'Order number is required' 
      });
    }
    
    console.log(`🔍 Tracking order with Fez: ${orderNo}`);
    
    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    console.log('Using fresh token for order tracking:', authToken.substring(0, 10) + '...');
    
    // Track order with Fez Delivery
    const trackingResponse = await axios.get(`${FEZ_API_URL}/order/track/${orderNo}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': process.env.FEZ_SECRET_KEY 
      }
    });
    
    if (trackingResponse.data && trackingResponse.data.status === 'Success') {
      console.log('Fez tracking successful:', trackingResponse.data.description);
      
      // Return the tracking information
      return res.json({
        status: 'success',
        tracking: {
          orderNo: trackingResponse.data.order.orderNo,
          orderStatus: trackingResponse.data.order.orderStatus,
          recipientName: trackingResponse.data.order.recipientName,
          recipientAddress: trackingResponse.data.order.recipientAddress,
          recipientState: trackingResponse.data.order.recipientState,
          senderName: trackingResponse.data.order.senderName,
          senderAddress: trackingResponse.data.order.senderAddress,
          createdAt: trackingResponse.data.order.createdAt,
          history: trackingResponse.data.history
        }
      });
    } else {
      console.log('Fez tracking failed:', trackingResponse.data);
      return res.status(400).json({ 
        message: 'Failed to track order',
        details: trackingResponse.data
      });
    }
  } catch (error) {
    console.error('Error tracking order with Fez:', error.message);
    
    if (error.response) {
      console.error('Fez API error response:', error.response.data);
      return res.status(error.response.status).json({
        message: 'Error tracking order',
        details: error.response.data
      });
    }
    
    return res.status(500).json({ 
      message: 'Error tracking order',
      error: error.message
    });
  }
};

/**
 * Get estimated delivery time from Fez Delivery API
 * This endpoint doesn't require authentication
 */
exports.getDeliveryTimeEstimate = async (req, res) => {
  try {
    const { delivery_type, pick_up_state, drop_off_state } = req.body;
    
    // Validate required fields
    if (!delivery_type || !pick_up_state || !drop_off_state) {
      return res.status(400).json({ 
        message: 'delivery_type, pick_up_state, and drop_off_state are required' 
      });
    }
    
    // Validate delivery_type
    const validDeliveryTypes = ['import', 'export', 'local'];
    if (!validDeliveryTypes.includes(delivery_type)) {
      return res.status(400).json({ 
        message: 'delivery_type must be one of: import, export, local' 
      });
    }
    
    console.log(`⏱️ Getting delivery time estimate: ${delivery_type} from ${pick_up_state} to ${drop_off_state}`);
    
    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    console.log('Using fresh token for delivery time estimate:', authToken.substring(0, 10) + '...');
    
    // Get delivery time estimate from Fez Delivery
    const estimateResponse = await axios.post(`${FEZ_API_URL}/delivery-time-estimate`, {
      delivery_type,
      pick_up_state,
      drop_off_state
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': process.env.FEZ_SECRET_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (estimateResponse.data && estimateResponse.data.status === 'Success') {
      console.log('Fez delivery time estimate successful:', estimateResponse.data.description);
      
      // Return the delivery time estimate
      return res.json({
        status: 'success',
        estimate: estimateResponse.data.data.eta
      });
    } else {
      console.log('Fez delivery time estimate failed:', estimateResponse.data);
      return res.status(400).json({ 
        message: 'Failed to get delivery time estimate',
        details: estimateResponse.data
      });
    }
  } catch (error) {
    console.error('Error getting delivery time estimate from Fez:', error.message);
    
    if (error.response) {
      console.error('Fez API error response:', error.response.data);
      return res.status(error.response.status).json({
        message: 'Error getting delivery time estimate',
        details: error.response.data
      });
    }
    
    return res.status(500).json({ 
      message: 'Error getting delivery time estimate',
      error: error.message
    });
  }
};

// Handle Fez webhook
exports.handleFezWebhook = async (req, res) => {
  try {
    console.log('📦 Received Fez webhook:', req.body);
    
    // Validate the webhook payload
    const { orderNumber, status } = req.body;
    
    if (!orderNumber || !status) {
      console.error('❌ Invalid webhook payload: Missing required fields');
      return res.status(400).json({ 
        message: 'Invalid webhook payload: Missing required fields' 
      });
    }
    
    // Extract timestamp information if available in the payload
    // Fez might send different timestamp formats, so we need to handle them
    let timestamp = null;
    
    if (req.body.timestamp) {
      // Direct timestamp field
      timestamp = req.body.timestamp;
    } else if (req.body.statusDate || req.body.statusCreationDate) {
      // Alternative timestamp fields that Fez might use
      timestamp = req.body.statusDate || req.body.statusCreationDate;
    } else if (req.body.event && req.body.event.timestamp) {
      // Nested event object
      timestamp = req.body.event.timestamp;
    } else {
      // If no timestamp is provided, use current time
      timestamp = new Date().toISOString();
      console.log('No timestamp provided in webhook, using current time:', timestamp);
    }
    
    // Prepare enhanced webhook data
    const webhookData = {
      ...req.body,
      timestamp: timestamp
    };
    
    // Import the handler dynamically to avoid circular dependencies
    const { handleOrderStatusUpdate } = require('../webhooks/fezWebhook');
    
    // Process the webhook with enhanced data
    await handleOrderStatusUpdate(webhookData);
    
    // Respond to Fez
    return res.status(200).json({ 
      message: 'Webhook received and processed successfully' 
    });
  } catch (error) {
    console.error('❌ Error handling Fez webhook:', error);
    return res.status(500).json({ 
      message: 'Error processing webhook',
      error: error.message 
    });
  }
};

// Verify Paystack transaction status
const verifyPaystackTransaction = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return {
      // Fix: Paystack returns status as boolean (true) not string ("success")
      success: response.data.status === true && response.data.data.status === 'success',
      data: response.data.data
    };
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

// Helper function to update product stock when an order is paid
const updateProductStockForPaidOrder = async (order) => {
  console.log(`Updating product stock for paid order ${order.order_id}`);
  
  try {
    // Update product stock for each item in the order
    for (const item of order.items) {
      // Find the product before update to log its current stock
      const productBefore = await Product.findById(item.product);
      
      if (!productBefore) {
        console.error(`Product not found for item in order ${order.order_id}:`, item.product);
        continue;
      }
      
      console.log('Product before stock update:', {
        productId: productBefore._id,
        currentStock: productBefore.stock,
        currentInventoryQuantity: productBefore.inventory.quantity,
        currentSoldCount: productBefore.stats.soldCount,
        itemQuantity: item.quantity
      });

      const updateResult = await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            'stats.soldCount': item.quantity,
            'stock': -item.quantity,
            'inventory.quantity': -item.quantity 
          }
        },
        { new: true } // Return the updated document
      );

      console.log('Product after stock update:', {
        productId: updateResult._id,
        newStock: updateResult.stock,
        newInventoryQuantity: updateResult.inventory.quantity,
        newSoldCount: updateResult.stats.soldCount,
        updateSuccessful: !!updateResult
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating product stock for order ${order.order_id}:`, error);
    return false;
  }
};

// Helper function to send Slack notification for paid orders
const sendSlackNotificationForPaidOrder = async (order, buyer) => {
  console.log(`Sending Slack notification for paid order ${order.order_id}`);
  
  try {
    // Get seller info
    const seller = await Seller.findById(order.seller);
    const sellerName = seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller';
    
    // Send a simple notification to Slack email
    const slackEmailMsg = {
      to: 'orders-aaaaqm2ugmdudvf4jsgf3koetm@auqli.slack.com',
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders'
      },
      subject: 'New Paid Order on Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>New Paid Order on Auqli</h2>
          <p>A new order has been paid on Auqli.</p>
          <p>Order ID: ${order.order_id}</p>
          <p>Buyer: ${buyer.firstName} ${buyer.lastName}</p>
          <p>Store: ${sellerName}</p>
          <p>Payment Method: ${order.paymentInfo.method}</p>
          <p>Amount: ₦${order.totalAmount}</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    };

    await sgMail.send(slackEmailMsg);
    console.log('Slack notification email sent for paid order');
    return true;
  } catch (slackEmailError) {
    console.error('Error sending Slack notification email:', slackEmailError);
    return false;
  }
};

// Mark order as paid (for Paystack payments)
exports.markOrderAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentReference, manualNote } = req.body;
    
    if (!transactionId && !paymentReference) {
      return res.status(400).json({ message: 'Either transactionId or paymentReference is required' });
    }
    
    const Order = mongoose.model('Order');
    const order = await Order.findById(id)
      .populate('seller', 'email firstName lastName businessName walletBalance');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify Paystack transaction if reference is provided
    let verificationResult = null;
    if (paymentReference) {
      verificationResult = await verifyPaystackTransaction(paymentReference);
      if (!verificationResult.success) {
        return res.status(400).json({ 
          message: 'Payment verification failed', 
          details: verificationResult.message 
        });
      }
    }

    // Check if order is already paid
    if (order.paid) {
      // If this order is already paid, check if there are other unpaid orders from the same purchase
      const buyer = order.buyer;
      const createdAt = order.createdAt;
      
      if (buyer && createdAt) {
        const twoMinutesBefore = new Date(createdAt.getTime() - 2 * 60 * 1000);
        const twoMinutesAfter = new Date(createdAt.getTime() + 2 * 60 * 1000);
        
        // Find other unpaid orders from the same buyer created around the same time
        const otherUnpaidOrders = await Order.find({
          _id: { $ne: order._id }, // Exclude the current order
          buyer: buyer, 
          paid: false,
          createdAt: { $gte: twoMinutesBefore, $lte: twoMinutesAfter }
        }).populate('seller');
        
        if (otherUnpaidOrders.length > 0) {
          console.log(`Found ${otherUnpaidOrders.length} other unpaid orders from the same buyer`);
          
          // Update each order's payment status and save
          const updatePromises = otherUnpaidOrders.map(async (otherOrder) => {
            // Update the payment info
            otherOrder.paid = true;
            otherOrder.paymentInfo.status = 'paid';
            otherOrder.paymentInfo.transactionId = transactionId || verificationResult?.data?.id;
            otherOrder.paymentInfo.paymentReference = paymentReference || null;
            otherOrder.paymentInfo.paidAt = new Date();
            otherOrder.notificationsSent = true;
            
            // Update product stock for this order too
            await updateProductStockForPaidOrder(otherOrder);
            
            // Check if this is a hybrid payment (wallet + Paystack)
            const isHybridPayment = otherOrder.paymentInfo.isWalletCredit && otherOrder.paymentInfo.walletAmountUsed > 0;
            
            if (isHybridPayment) {
              console.log(`Confirming hybrid payment for order ${otherOrder.order_id}`, {
                totalAmount: otherOrder.totalAmount,
                walletAmountUsed: otherOrder.paymentInfo.walletAmountUsed,
                paystackAmount: otherOrder.totalAmount - otherOrder.paymentInfo.walletAmountUsed
              });
            }
            
            const updatedOtherOrder = await otherOrder.save();
            
            // Cancel any scheduled job to mark this order as stale
            try {
              const agenda = require('../config/agenda');
              await agenda.cancel({ 
                name: 'mark_unpaid_orders_stale',
                'data.orderId': otherOrder._id.toString()
              });
              
              console.log(`Cancelled stale marking job for now-paid order ${otherOrder.order_id}`);
            } catch (jobError) {
              console.error(`Error cancelling stale job for order ${otherOrder.order_id}:`, jobError);
            }
            
            // Get the buyer for notifications
            const Buyer = mongoose.model('Buyer');
            const buyer = await Buyer.findById(otherOrder.buyer);
            
            // Send order confirmation email
            if (buyer && buyer.email) {
              try {
                await sendOrderConfirmationEmail(buyer, otherOrder);
              } catch (emailError) {
                console.error(`Error sending order confirmation email for order ${otherOrder.order_id}:`, emailError);
                // Continue without failing the request
              }
            }
            
            // Send Slack notification for the paid order
            await sendSlackNotificationForPaidOrder(otherOrder, buyer);
            
            return updatedOtherOrder;
          });
          
          // Wait for all updates to complete
          const updatedOtherOrders = await Promise.all(updatePromises);
          
          return res.status(200).json({ 
            message: `Original order already paid. ${updatedOtherOrders.length} related orders marked as paid.`, 
            orders: updatedOtherOrders.map(o => ({
              orderId: o._id,
              order_id: o.order_id,
              paid: o.paid
            }))
          });
        }
      }
      
      return res.status(400).json({ message: 'Order is already marked as paid' });
    }
    
    // Check if this is a Paystack order
    if (order.paymentInfo.method !== 'paystack') {
      return res.status(400).json({ 
        message: 'Invalid order status. Only unpaid Paystack orders can be marked as paid.' 
      });
    }
    
    // Add a flag to track if notifications have been sent
    const notificationsAlreadySent = order.notificationsSent || false;
    
    // Mark notifications as sent
    order.notificationsSent = true;
    
    // Mark order as paid
    order.paid = true;
    order.paymentInfo.status = 'paid';
    order.paymentInfo.transactionId = transactionId || verificationResult?.data?.id;
    order.paymentInfo.paymentReference = paymentReference || order.paymentInfo.paymentReference;
    order.paymentInfo.paidAt = new Date();

    // Check if this is a hybrid payment (wallet + Paystack)
    const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    
    if (isHybridPayment) {
      console.log(`Confirming hybrid payment for order ${order.order_id}`, {
        totalAmount: order.totalAmount,
        walletAmountUsed: order.paymentInfo.walletAmountUsed,
        paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
      });
      
      // The wallet amount should have been deducted during order creation
      // Just confirming the payment here
    }
    
    // Update product stock now that the order is paid
    await updateProductStockForPaidOrder(order);
    
    // Cancel the stale job for this order
    try {
      const agenda = require('../config/agenda');
      await agenda.cancel({ 
        name: 'mark_unpaid_orders_stale',
        'data.orderId': order._id.toString()
      });
      console.log(`Cancelled stale job for order ${order.order_id}`);
    } catch (jobErr) {
      console.error('Error cancelling stale job:', jobErr);
      // Continue processing even if job cancellation fails
    }

    await order.save();
    
    // Get the buyer for notification
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(order.buyer);
    
    // Only schedule notifications if they haven't been sent yet
    if (!notificationsAlreadySent) {
      console.log(`Scheduling order notifications for order ${order.order_id} after manual payment marking`);
      
      // Create notifications
      const notificationData = {
        orderId: order._id,
        buyerId: order.buyer,
        sellerId: order.seller._id
      };
      
      const agenda = require('../config/agenda').agenda;
      agenda.schedule('in 5 seconds', 'send-order-notifications', notificationData);
    } else {
      console.log(`Skipping notifications for order ${order.order_id} as they have already been sent`);
    }
    
    // Send order confirmation email
    if (buyer && buyer.email) {
      try {
        await sendOrderConfirmationEmail(buyer, order);
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
        // Continue without failing the request
      }
    }
    
    // Send Slack notification for the paid order
    await sendSlackNotificationForPaidOrder(order, buyer);

    // Check for other orders from the same buyer in the same time window
    let otherOrdersUpdated = [];
    
    if (buyer) {
      const createdAt = order.createdAt;
      const twoMinutesBefore = new Date(createdAt.getTime() - 2 * 60 * 1000);
      const twoMinutesAfter = new Date(createdAt.getTime() + 2 * 60 * 1000);
      
      // Find other unpaid orders from the same buyer created around the same time
      const otherOrders = await Order.find({
        _id: { $ne: order._id }, // Exclude the current order
        buyer: order.buyer, 
        paid: false,
        createdAt: { $gte: twoMinutesBefore, $lte: twoMinutesAfter }
      }).populate('seller');
      
      if (otherOrders.length > 0) {
        console.log(`Found ${otherOrders.length} other unpaid orders from the same buyer`);
        
        // Update each order's payment status and save
        const updatePromises = otherOrders.map(async (otherOrder) => {
          // Update the payment info
          otherOrder.paid = true;
          otherOrder.paymentInfo.status = 'paid';
          otherOrder.paymentInfo.transactionId = transactionId || verificationResult?.data?.id;
          otherOrder.paymentInfo.paymentReference = paymentReference || null;
          otherOrder.paymentInfo.paidAt = new Date();
          otherOrder.notificationsSent = true;
          
          // Update product stock for this order too
          await updateProductStockForPaidOrder(otherOrder);
          
          // Check if this is a hybrid payment (wallet + Paystack)
          const isHybridPayment = otherOrder.paymentInfo.isWalletCredit && otherOrder.paymentInfo.walletAmountUsed > 0;
          
          if (isHybridPayment) {
            console.log(`Confirming hybrid payment for order ${otherOrder.order_id}`, {
              totalAmount: otherOrder.totalAmount,
              walletAmountUsed: otherOrder.paymentInfo.walletAmountUsed,
              paystackAmount: otherOrder.totalAmount - otherOrder.paymentInfo.walletAmountUsed
            });
          }
          
          const updatedOtherOrder = await otherOrder.save();
          
          // Cancel any scheduled job to mark this order as stale
          try {
            const agenda = require('../config/agenda');
            await agenda.cancel({ 
              name: 'mark_unpaid_orders_stale',
              'data.orderId': otherOrder._id.toString()
            });
            
            console.log(`Cancelled stale marking job for now-paid order ${otherOrder.order_id}`);
          } catch (jobError) {
            console.error(`Error cancelling stale job for order ${otherOrder.order_id}:`, jobError);
          }
          
          // Get the buyer for notifications if needed
          const otherBuyer = await Buyer.findById(otherOrder.buyer);
          
          // Send order confirmation email for this order too
          if (otherBuyer && otherBuyer.email) {
            try {
              await sendOrderConfirmationEmail(otherBuyer, updatedOtherOrder);
            } catch (emailError) {
              console.error(`Error sending order confirmation email for order ${otherOrder.order_id}:`, emailError);
            }
          }
          
          // Send Slack notification for the paid order
          await sendSlackNotificationForPaidOrder(updatedOtherOrder, otherBuyer);
          
          return updatedOtherOrder;
        });
        
        // Wait for all updates to complete
        otherOrdersUpdated = await Promise.all(updatePromises);
      }
    }

    return res.status(200).json({
      message: 'Order marked as paid successfully', 
      order,
      otherOrdersUpdated: otherOrdersUpdated.length > 0 ? 
        otherOrdersUpdated.map(o => ({
          orderId: o._id,
          order_id: o.order_id,
          paid: o.paid
        })) : [],
      verificationDetails: verificationResult?.data
    });
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return res.status(500).json({ message: 'Error marking order as paid', error: error.message });
  }
};

// Verify payment by reference
exports.verifyPaymentByReference = async (req, res) => {
  try {
  const { reference, orderId } = req.body;

  if (!reference) {
    return res.status(400).json({ message: 'Payment reference is required' });
  }

    // Verify with Paystack
    const verificationResult = await verifyPaystackTransaction(reference);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        message: 'Payment verification failed', 
        details: verificationResult.message
      });
    }

    // If orderId is provided, mark the order as paid
    if (orderId) {
      const Order = mongoose.model('Order');
      const order = await Order.findById(orderId)
        .populate('seller', 'email firstName lastName businessName walletBalance');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (order && order.paymentInfo.method === 'paystack' && !order.paid) {
        // Mark order as paid
      order.paid = true;
      order.paymentInfo.status = 'paid';
        order.paymentInfo.transactionId = verificationResult.data.id;
      order.paymentInfo.paymentReference = reference;
      order.paymentInfo.paidAt = new Date();

              // Update product stock now that the order is paid
      await updateProductStockForPaidOrder(order);
      
      // Check if this is a hybrid payment (wallet + Paystack)
        const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
        
        if (isHybridPayment) {
          console.log(`Confirming hybrid payment for order ${order.order_id}`, {
            totalAmount: order.totalAmount,
            walletAmountUsed: order.paymentInfo.walletAmountUsed,
            paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
          });
          
          // The wallet amount should have been deducted during order creation
          // Just confirming the payment here
        }
        
        await order.save();
        
        // Get the buyer for notification and send Slack email
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(order.buyer);
        
        // Send Slack notification for the paid order
        if (buyer) {
          await sendSlackNotificationForPaidOrder(order, buyer);
        }
        
        // Add a flag to track if notifications have been sent
        const notificationsAlreadySent = order.notificationsSent || false;
        
        // Mark notifications as sent
        order.notificationsSent = true;
        await order.save();
        
        // Only schedule notifications if they haven't been sent yet
        if (!notificationsAlreadySent) {
          console.log(`Scheduling order notifications for order ${order.order_id} after payment verification`);
          
          // Create notifications
          const notificationData = {
            orderId: order._id,
            buyerId: order.buyer,
            sellerId: order.seller._id
          };
          
          const agenda = require('../config/agenda').agenda;
          agenda.schedule('in 5 seconds', 'send-order-notifications', notificationData);
        } else {
          console.log(`Skipping notifications for order ${order.order_id} as they have already been sent`);
        }
        
        // Send order confirmation email
        if (buyer && buyer.email) {
          try {
            await sendOrderConfirmationEmail(buyer, order);
          } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
            // Continue without failing the request
        }
      }

      return res.status(200).json({
          message: 'Payment verified and order marked as paid',
          order,
          verificationDetails: verificationResult.data
        });
      } else {
        return res.status(200).json({
          message: 'Payment verified but order is already paid or not a Paystack order',
        verificationDetails: verificationResult.data
      });
      }
    }

    // If no orderId or order already paid, just return verification result
    return res.status(200).json({
      message: 'Payment verification successful',
      verificationDetails: verificationResult.data
    });
  } catch (error) {
    console.error('Error verifying payment by reference:', error);
    return res.status(500).json({ 
      message: 'Error verifying payment', 
      error: error.message 
    });
  }
};

// Handle Paystack webhook
exports.handlePaystackWebhook = async (req, res) => {
  // Verify the event is from Paystack
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || paystackSecretKey)
                    .update(JSON.stringify(req.body))
                    .digest('hex');
                    
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;

  // Check if it's a charge.success event
  if (event.event === 'charge.success') {
    console.log(`Received successful payment event from Paystack:`, {
      reference: event.data.reference,
      amount: event.data.amount / 100,
      status: event.data.status,
      metadata: event.data.metadata || {}
    });
    
    const metadata = event.data.metadata || {};
    
    // If there's no metadata or orderId, just acknowledge the webhook
    if (!metadata || !metadata.orderId) {
      return res.status(200).json({ message: 'Webhook received, but no order metadata' });
    }

    try {
      // Find the order
      const Order = mongoose.model('Order');
      const order = await Order.findById(metadata.orderId);
      
      if (!order) {
        console.log(`Order not found for Paystack payment: ${metadata.orderId}`);
        return res.status(200).json({ message: 'Order not found, but acknowledging webhook' });
      }
      
      // Check if this is a Paystack order that's not already paid
      if (order.paymentInfo.method !== 'paystack' || order.paid) {
        console.log(`Order ${order.order_id} is either not a Paystack order or already paid`);
        return res.status(200).json({ message: 'Order already processed or not Paystack order' });
      }
      
      // Mark the order as paid
      order.paid = true;
      order.paymentInfo.status = 'paid';
      order.paymentInfo.transactionId = event.data.id;
      order.paymentInfo.paymentReference = event.data.reference;
      order.paymentInfo.paidAt = new Date();
      
      // Update product stock now that the order is paid
      await updateProductStockForPaidOrder(order);
      
      // Get the buyer for notification and send Slack email
      const webhookBuyer = await Buyer.findById(order.buyer);
      if (webhookBuyer) {
        await sendSlackNotificationForPaidOrder(order, webhookBuyer);
      }
      
      // Cancel the stale job for this order
      try {
        const agenda = require('../config/agenda');
        await agenda.cancel({ name: 'mark-order-stale', 'data.orderId': order._id.toString() });
        console.log(`Cancelled stale job for order ${order.order_id}`);
      } catch (jobErr) {
        console.error('Error cancelling stale job:', jobErr);
        // Continue processing even if job cancellation fails
      }

      // Check if this is a hybrid payment (wallet + Paystack)
      const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
      
      if (isHybridPayment) {
        console.log(`Processing hybrid payment for order ${order.order_id}`, {
          totalAmount: order.totalAmount,
          walletAmountUsed: order.paymentInfo.walletAmountUsed,
          paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
        });
        
        // Confirm that the wallet amount was properly deducted
        // In a more robust implementation, you might want to create a pending wallet transaction
        // and only confirm it here, but for now we assume it was already deducted during order creation
      }
      
      await order.save();
      
      // Get the buyer for email notification
      const Buyer = mongoose.model('Buyer');
      const buyer = await Buyer.findById(order.buyer);
      
      // Always send order confirmation email for paid Paystack order, regardless of notification status
      if (buyer && buyer.email) {
        try {
          console.log(`Sending order confirmation email to ${buyer.email} for paid Paystack order ${order.order_id}`);
          await sendOrderConfirmationEmail(buyer, order);
        } catch (emailError) {
          console.error('Error sending order confirmation email for paid Paystack order:', emailError);
          // Continue processing even if email fails
        }
      }
        
        // After order payment is processed, check if there are other recent orders from the same buyer
        // that need notifications, and process them in a batch
        try {
        const agenda = require('../config/agenda');
        console.log(`Scheduling batch notification processing for buyer: ${order.buyer}`);
          
        agenda.now('process-buyer-order-notifications', {
              buyerId: order.buyer.toString(),
          excludeOrderId: order._id.toString(),
              batchProcess: true
            });
      } catch (notifyErr) {
        console.error('Error scheduling notification processing:', notifyErr);
      }
      
      return res.status(200).json({ message: 'Payment processed successfully' });
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      // Still return 200 to acknowledge the webhook
      return res.status(200).json({ message: 'Error processing webhook, but acknowledging receipt' });
    }
  }
  
  // Handle payment failed event
  if (event.event === 'charge.failed') {
    console.log(`Received payment failure event from Paystack:`, {
      reference: event.data.reference,
      amount: event.data.amount / 100,
      status: event.data.status,
      metadata: event.data.metadata || {}
    });
    
    const metadata = event.data.metadata || {};
    
    // If there's no metadata or orderId, just acknowledge the webhook
    if (!metadata || !metadata.orderId) {
      return res.status(200).json({ message: 'Webhook received, but no order metadata for failed payment' });
    }
    
    try {
      // Process the failed payment
      const result = await handleFailedPayment(event.data, res);
      return result;
    } catch (error) {
      console.error('Error processing failed payment webhook:', error);
      // Still return 200 to acknowledge the webhook
      return res.status(200).json({ message: 'Error processing failed payment webhook, but acknowledging receipt' });
    }
  }

  // For other events, just acknowledge receipt
  return res.status(200).json({ message: 'Webhook received' });
};

// Helper function to handle wallet top-ups
async function handleWalletTopUp(paymentData, res) {
  const { reference, metadata } = paymentData;
  const buyerId = metadata.buyerId;
  
  const Buyer = mongoose.model('Buyer');
  const buyer = await Buyer.findById(buyerId);
  
  if (!buyer) {
    return res.status(200).json({ message: 'Buyer not found, but acknowledging webhook' });
  }

  // Check if transaction is already completed
  const existingTransaction = buyer.wallet.transactions.find(
    t => t.paymentReference === reference
  );

  if (existingTransaction && existingTransaction.status === 'completed') {
    return res.status(200).json({ message: 'Payment already processed' });
  }

  // If transaction exists but is pending, update it
  if (existingTransaction && existingTransaction.status === 'pending') {
    existingTransaction.status = 'completed';
    buyer.wallet.balance += existingTransaction.amount;
    await buyer.save();
    
    // Send confirmation email
    try {
      // Import the sendWalletTopUpEmail function from buyerController
      const buyerController = require('./buyerController');
      if (typeof buyerController.sendWalletTopUpEmail === 'function') {
        await buyerController.sendWalletTopUpEmail(buyer, existingTransaction);
      } else {
        // Fallback to sending a simple email if the function is not available
        await sendSimpleTopUpEmail(buyer, existingTransaction);
      }
    } catch (emailError) {
      console.error('Error sending wallet top-up email:', emailError);
      // Continue processing even if email fails
    }
    
    return res.status(200).json({ message: 'Wallet topped up successfully via webhook' });
  }

  // If no transaction found, create a new one
  const amount = paymentData.amount / 100; // Convert from kobo to naira
  
  const newTransaction = {
    type: 'credit',
    amount,
    paymentReference: reference,
    description: metadata.description || 'Wallet top up via Paystack',
    status: 'completed',
    createdAt: new Date()
  };

  buyer.wallet.transactions.push(newTransaction);
  buyer.wallet.balance += amount;
  
  await buyer.save();
  
  // Send confirmation email
  try {
    // Import the sendWalletTopUpEmail function from buyerController
    const buyerController = require('./buyerController');
    if (typeof buyerController.sendWalletTopUpEmail === 'function') {
      await buyerController.sendWalletTopUpEmail(buyer, newTransaction);
    } else {
      // Fallback to sending a simple email if the function is not available
      await sendSimpleTopUpEmail(buyer, newTransaction);
    }
  } catch (emailError) {
    console.error('Error sending wallet top-up email:', emailError);
    // Continue processing even if email fails
  }
  
  return res.status(200).json({ message: 'Wallet topped up successfully via webhook' });
}

// Simple email function as fallback
async function sendSimpleTopUpEmail(buyer, transaction) {
  const formattedAmount = transaction.amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN'
  });
  
  const msg = {
    to: buyer.email,
    from: {
      email: 'support@auqli.com',
      name: 'Auqli Support'
    },
    subject: 'Wallet Top-Up Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Wallet Top-Up Confirmation</h2>
        <p>Hello ${buyer.firstName},</p>
        <p>Your wallet has been successfully topped up with ${formattedAmount}.</p>
        <p>Transaction ID: ${transaction.paymentReference}</p>
        <p>Current Balance: ${buyer.wallet.balance.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</p>
        <p>Thank you for using Auqli!</p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Simple wallet top-up confirmation email sent to:', buyer.email);
    return true;
  } catch (error) {
    console.error('Error sending simple wallet top-up email:', error);
    return false;
  }
}

// Send order confirmation email
exports.sendOrderConfirmationEmail = async (order, buyer) => {
  // Format currency values
  const formattedTotal = order.totalAmount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  });
  
  const formattedShipping = order.shipping.fee.amount.toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  });
  
  // Create items HTML
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price.toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');
  
  const msg = {
    to: buyer.email,
    from: {
      email: 'support@auqli.com',
      name: 'Auqli Shipping'
    },
    subject: `Order Confirmation - #${order.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dljgzevaj/image/upload/v1733928675/Group_178_iqez5h.png" alt="Auqli Logo" style="max-width: 150px;">
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <h2 style="color: #333; margin-bottom: 20px; text-align: center;">Order Confirmation</h2>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Hello ${buyer.firstName},</p>
          
          <p style="font-size: 16px; color: #555; margin-bottom: 15px;">Thank you for your order! We've received your payment and your order is now being processed.</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Order Summary</h3>
            
            <p style="margin-bottom: 10px;"><strong>Order ID:</strong> ${order.order_id}</p>
            <p style="margin-bottom: 10px;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p style="margin-bottom: 10px;"><strong>Payment Method:</strong> ${order.paymentInfo.method}</p>
            <p style="margin-bottom: 20px;"><strong>Payment Status:</strong> <span style="color: #4CAF50;">Paid</span></p>
            
            <h4 style="margin-bottom: 10px;">Items</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                  <td style="padding: 10px; text-align: right;">₦${order.totalAmount.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                  <td style="padding: 10px; text-align: right;">₦${order.shipping.fee.amount.toLocaleString()}</td>
                </tr>
                <tr style="font-weight: bold;">
                  <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Total:</strong></td>
                  <td style="padding: 10px; text-align: right; border-top: 2px solid #eee;">₦${(order.totalAmount + order.shipping.fee.amount).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Shipping Information</h3>
            
            <p style="margin-bottom: 5px;"><strong>Name:</strong> ${order.delivery_address.first_name} ${order.delivery_address.last_name}</p>
            <p style="margin-bottom: 5px;"><strong>Address:</strong> ${order.delivery_address.line1}</p>
            <p style="margin-bottom: 5px;"><strong>City/State:</strong> ${order.delivery_address.city || ''}, ${order.delivery_address.state}</p>
            <p style="margin-bottom: 5px;"><strong>Country:</strong> ${order.delivery_address.country}</p>
            <p style="margin-bottom: 5px;"><strong>Phone:</strong> ${order.delivery_address.phone}</p>
          </div>
          
         
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">If you have any questions about your order, please contact our customer support team.</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #777; font-size: 14px;">
          <p>© ${new Date().getFullYear()} Auqli. All rights reserved.</p>
          <p>
            <a href="https://auqli.com/terms" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
            <a href="https://auqli.com/privacy" style="color: #4CAF50; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
          </p>
        </div>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log('Order confirmation email sent to:', buyer.email);
    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

// Simple mark order as paid (fallback method)
exports.simpleMarkPaid = async (req, res) => {
  const { id } = req.params;
  const { reference } = req.body;

  try {
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Simple update without verification
    order.paid = true;
    order.paymentInfo.status = 'paid';
    order.paymentInfo.paymentReference = reference || 'manual-update';
    order.paymentInfo.paidAt = new Date();

    const updatedOrder = await order.save();

    // Return success response
    res.status(200).json({
      message: 'Order marked as paid successfully (simple method)',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error in simple mark paid:', error);
    res.status(500).json({
      message: 'Failed to mark order as paid (simple method)',
      error: error.message
    });
  }
};

// Cancel order by seller
exports.cancelOrderBySeller = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user.id;

    // Find the order and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify this is the seller's order
    if (order.seller._id.toString() !== sellerId) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order is already cancelled
    if (order.items.some(item => item.status === 'cancelled')) {
      return res.status(400).json({ 
        message: 'This order has already been cancelled' 
      });
    }

    // Check if order is in pending status
    if (!order.items.every(item => item.status === 'pending')) {
      return res.status(400).json({ 
        message: 'Only pending orders can be cancelled' 
      });
    }

    // Check for hybrid payment (wallet + Paystack) and process refund if needed
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    let walletRefunded = false;
    let walletRefundAmount = 0;
    
    if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
      try {
        console.log(`Processing wallet refund for hybrid payment in order ${order.order_id}`);
        
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(order.buyer);
        
        if (buyer) {
          // Refund the wallet amount that was used
          walletRefundAmount = order.paymentInfo.walletAmountUsed;
          const walletTransaction = {
            type: 'credit',
            amount: walletRefundAmount,
            description: `Refund for cancelled order ${order.order_id}`,
            status: 'completed',
            createdAt: new Date()
          };
          
          // Add transaction to wallet
          buyer.wallet.balance += walletRefundAmount;
          buyer.wallet.transactions.push(walletTransaction);
          
          // Save buyer with updated wallet
          await buyer.save();
          
          walletRefunded = true;
          console.log(`Successfully refunded wallet amount for cancelled hybrid payment: ${walletRefundAmount}`, {
            orderId: order._id,
            buyer: buyer._id,
            newWalletBalance: buyer.wallet.balance
          });
        } else {
          console.error(`Could not find buyer ${order.buyer} to refund wallet amount for cancelled order ${order.order_id}`);
        }
      } catch (refundError) {
        console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
        // Continue with order cancellation even if refund fails
      }
    }

    // Update all items status to cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason || 'Cancelled by seller'
      });
    });

    // Update shipping status to cancelled
    if (order.shipping && order.shipping.tracking) {
      order.shipping.tracking.status = 'cancelled';
      if (!order.shipping.tracking.history) {
        order.shipping.tracking.history = [];
      }
      order.shipping.tracking.history.push({
        status: 'cancelled',
        timestamp: new Date(),
        description: reason || 'Order cancelled by seller'
      });
    }

    // Check if the order was paid and create a refund request if necessary
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      console.log('Creating refund request for paid order:', order.order_id);
      
      order.refundRequest = {
        requested: true,
        requestedAt: new Date(),
        requestedBy: 'seller',
        reason: reason || 'Order cancelled by seller',
        status: 'pending',
        refundAmount: order.totalAmount
      };
      
      // The order will be closed automatically after refund is processed
    } else {
      // For unpaid orders, close the order immediately
      order.isOpen = false;
      order.closedAt = new Date();
      order.closedBy = 'seller';
      order.closedReason = reason || 'Order cancelled by seller';
    }

    // Only attempt to cancel with Fez if order has tracking number
if (order.shipping && order.shipping.tracking && order.shipping.tracking.number) {
  try {
    // Get a fresh authentication token for Fez
    const authToken = await getFezAuthToken();

    // Cancel the shipment with Fez using DELETE method
    const response = await axios.delete(
      `${FEZ_API_URL}/order`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'secret-key': process.env.FEZ_SECRET_KEY
        },
        data: {
          orderNo: order.shipping.tracking.number
        }
      }
    );

    console.log('Fez cancellation response:', response.data);
  } catch (fezError) {
    console.error(`Error cancelling Fez shipment for order ${order.order_id}:`, fezError);
    // Continue with order cancellation even if Fez cancellation fails
  }
}


    // Fix for buyerDetails validation error
    if (!order.buyerDetails || !order.buyerDetails._id) {
      if (!order.buyerDetails) {
        order.buyerDetails = {};
      }
      order.buyerDetails._id = order.buyer._id;
      
      // Optionally populate other buyerDetails fields if they're empty
      if (!order.buyerDetails.firstName) {
        order.buyerDetails.firstName = order.buyer.firstName;
      }
      if (!order.buyerDetails.lastName) {
        order.buyerDetails.lastName = order.buyer.lastName;
      }
    }

    // Save the order
    await order.save();

    // Send email notifications
    let buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancellation Notice</h2>
        <p>Dear ${order.buyer.firstName},</p>
        <p>Your order #${order.order_id} has been cancelled by the seller.</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p><strong>Seller:</strong> ${order.seller.businessName}</p>
    `;
    
    // Add refund information if applicable
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      buyerEmailHtml += `
        <p><strong>Refund Information:</strong></p>
        <p>Since you've already paid for this order, a refund request has been automatically created. Our admin team will process your refund shortly.</p>
        <p>Refund status: Pending</p>
      `;
    }
    
    // Add wallet refund info if applicable
    if (walletRefunded) {
      buyerEmailHtml += `
        <p><strong>Wallet Refund:</strong> Your wallet credit of ₦${walletRefundAmount.toLocaleString()} used for this order has been refunded to your wallet.</p>
      `;
    }
    
    buyerEmailHtml += `
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;

    const buyerEmail = {
      to: order.buyer.email,
      from: 'Auqli Orders <support@auqli.com>',
      subject: 'Order Cancelled - Auqli',
      html: buyerEmailHtml
    };

    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Orders <support@auqli.com>',
      subject: 'Order Cancellation Confirmation - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Cancellation Confirmation</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>You have successfully cancelled order #${order.order_id}.</p>
          <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          <p><strong>Buyer:</strong> ${order.buyer.firstName} ${order.buyer.lastName}</p>
          ${order.paid ? `<p>Since this was a paid order, a refund request has been automatically created for the buyer.</p>` : ''}
          ${walletRefunded ? `<p>The wallet amount used for this order (₦${walletRefundAmount.toLocaleString()}) has been refunded to the buyer's wallet.</p>` : ''}
          <p>The buyer has been notified of this cancellation.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    // Send admin notification if refund is needed
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      const Admin = mongoose.model('Admin');
      const admins = await Admin.find({});
      
      if (admins && admins.length > 0) {
        const adminEmail = {
          to: admins.map(admin => admin.email),
          from: 'Auqli Orders <support@auqli.com>',
          subject: 'New Refund Request - Order Cancelled by Seller',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Refund Request</h2>
              <p>A new refund request has been created due to order cancellation by seller.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Order ID: ${order.order_id}</li>
                <li>Seller: ${order.seller.businessName}</li>
                <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
                <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
                <li>Reason: ${reason || 'Order cancelled by seller'}</li>
                ${walletRefunded ? `<li>Note: Wallet payment of ₦${walletRefundAmount.toLocaleString()} was automatically refunded</li>` : ''}
              </ul>
              <p>Please process this refund request promptly.</p>
            </div>
          `
        };
        
        await sgMail.send(adminEmail);
      }
    }

    try {
      await sgMail.send([buyerEmail, sellerEmail]);
    } catch (emailError) {
      console.error('Error sending cancellation emails:', emailError);
      // Continue processing even if email sending fails
    }

    res.json({ 
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        order_id: order.order_id,
        isOpen: order.isOpen,
        items: order.items.map(item => ({
          status: item.status,
          statusHistory: item.statusHistory
        })),
        shipping: {
          tracking: order.shipping?.tracking
        },
        refundRequest: order.refundRequest,
        closedAt: order.closedAt,
        closedBy: order.closedBy,
        closedReason: order.closedReason
      },
      walletRefunded: walletRefunded,
      walletRefundAmount: walletRefundAmount
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
};

// Get all refund requests for admin
exports.getRefundRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;
    
    // Build query filters
    const query = {
      'refundRequest.requested': true
    };
    
    // Filter by status if provided
    if (status) {
      query['refundRequest.status'] = status;
    }
    
    // Search by order ID or buyer/seller name
    if (search) {
      query.$or = [
        { order_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total matching documents
    const totalRefundRequests = await Order.countDocuments(query);
    
    // Calculate pagination
    const totalPages = Math.ceil(totalRefundRequests / limit);
    const skip = (page - 1) * limit;
    
    // Get orders with refund requests
    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email')
      .populate('seller', 'firstName lastName email businessName storeName')
      .sort({ 'refundRequest.requestedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Format the response
    const refundRequests = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.order_id,
      refundRequest: order.refundRequest,
      buyer: {
        id: order.buyer._id,
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email
      },
      seller: {
        id: order.seller._id,
        name: order.seller.businessName || order.seller.storeName,
        email: order.seller.email
      },
      amount: order.totalAmount,
      paymentMethod: order.paymentInfo?.method,
      paidAt: order.paymentInfo?.paidAt,
      isCashOnDelivery: order.paymentInfo?.isCashOnDelivery || false,
      createdAt: order.createdAt
    }));
    
    res.json({
      refundRequests,
      pagination: {
        total: totalRefundRequests,
        pages: totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({ 
      message: 'Error fetching refund requests', 
      error: error.message 
    });
  }
};

// Process a refund request (approve/reject)
exports.processRefundRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status must be either "approved" or "rejected"' 
      });
    }
    
    // Find the order with all necessary data
    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName expoPushToken')
      .populate('seller', 'email firstName lastName businessName walletBalance');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order has a refund request
    if (!order.refundRequest || !order.refundRequest.requested) {
      return res.status(400).json({ message: 'No refund request found for this order' });
    }
    
    // Check if refund request is already processed
    if (order.refundRequest.status !== 'pending') {
      return res.status(400).json({ 
        message: `Refund request has already been ${order.refundRequest.status}` 
      });
    }
    
    // Update the refund request
    order.refundRequest.status = status;
    order.refundRequest.processedAt = new Date();
    order.refundRequest.processedBy = 'admin';
    order.refundRequest.notes = notes;
    
    // Add a note to the order
    order.notes.push({
      type: 'admin',
      content: `Refund request ${status}. ${notes ? `Notes: ${notes}` : ''}`,
      createdAt: new Date()
    });
    
    let refundAmount = 0;
    let refundDetails = {};
    
    // Process the refund if approved
    if (status === 'approved') {
      try {
        // Get the buyer to update their wallet
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(order.buyer._id);
        
        if (!buyer) {
          throw new Error(`Buyer not found with ID: ${order.buyer._id}`);
        }
        
        // Check if this is a hybrid payment
        const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
        
        // For hybrid payments, only refund the wallet amount that was used
        // For non-hybrid payments, refund the full order amount
        if (isHybridPayment) {
          // Check if this order is part of a batch
          const isBatchOrder = order.paymentInfo.batchId && order.paymentInfo.batchTotalAmount;
          
          // Check if this order has already had its wallet portion refunded
          if (order.paymentInfo.refundedWalletAmount && order.paymentInfo.refundedWalletAmount > 0) {
            console.log(`Order ${order.order_id} has already had its wallet portion refunded (₦${order.paymentInfo.refundedWalletAmount})`);
            // Set refund amount to 0 since it's already been refunded
            refundAmount = 0;
          } else {
            // Use the proportional wallet amount for this order
            refundAmount = order.paymentInfo.walletAmountUsed;
            
            if (isBatchOrder) {
              console.log(`Processing refund for batch order ${order.order_id} (batch ${order.paymentInfo.batchId}):`, {
                batchTotalAmount: order.paymentInfo.batchTotalAmount,
                batchWalletAmount: order.paymentInfo.batchWalletAmount,
                thisOrderAmount: order.totalAmount,
                thisOrderWalletAmount: refundAmount
              });
              
              // Check if other orders in this batch have already been refunded
              const Order = mongoose.model('Order');
              const otherOrdersInBatch = await Order.find({
                'paymentInfo.batchId': order.paymentInfo.batchId,
                _id: { $ne: order._id }, // Exclude current order
                'paymentInfo.refundedWalletAmount': { $exists: true, $gt: 0 }
              });
              
              if (otherOrdersInBatch && otherOrdersInBatch.length > 0) {
                // Some orders in this batch have already been refunded
                console.log(`Found ${otherOrdersInBatch.length} other orders in batch ${order.paymentInfo.batchId} that have already been refunded:`, {
                  refundedOrders: otherOrdersInBatch.map(o => ({ 
                    orderId: o.order_id, 
                    refundedAmount: o.paymentInfo.refundedWalletAmount 
                  }))
                });
              }
            }
          }
          
          console.log(`Processing hybrid payment refund for order ${order.order_id}:`, {
            totalAmount: order.totalAmount,
            walletAmountUsed: order.paymentInfo.walletAmountUsed,
            refundAmount: refundAmount,
            paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
          });
        } else {
          // Refund the full order amount (do not deduct shipping fee)
          refundAmount = order.totalAmount;
        }
        
        refundDetails = {
          originalAmount: order.totalAmount,
          refundAmount: refundAmount,
          isHybridPayment: isHybridPayment
        };
        
        console.log(`Processing refund for order ${order.order_id}:`, refundDetails);
        
        // If refund amount is 0 (already refunded), skip the wallet update
        if (refundAmount > 0) {
          // Generate a unique payment reference for the wallet transaction
          const paymentReference = `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          
          // Add the refund amount to buyer's wallet
          if (!buyer.wallet) {
            buyer.wallet = {
              balance: 0,
              currency: 'NGN',
              transactions: []
            };
          }
          
          // Update wallet balance
          buyer.wallet.balance += refundAmount;
          
          // Add transaction record
          const transactionDescription = isHybridPayment 
            ? `Refund of wallet portion for cancelled order #${order.order_id} (credit payment)`
            : `Refund for cancelled order #${order.order_id}`;
            
          buyer.wallet.transactions.push({
            type: 'credit',
            amount: refundAmount,
            paymentReference: paymentReference,
            description: transactionDescription,
            status: 'completed',
            createdAt: new Date()
          });
          
          // Save the buyer with updated wallet
          await buyer.save();
          
          console.log(`Refund processed successfully. Buyer wallet updated:`, {
            buyerId: buyer._id,
            newBalance: buyer.wallet.balance,
            refundAmount: refundAmount,
            isHybridPayment: isHybridPayment
          });
          
          // Also save the refund details in the order for reference
          order.refundRequest.refundAmount = refundAmount;
          order.refundRequest.paymentReference = paymentReference;
          
          // Mark this order as having had its wallet portion refunded
          if (isHybridPayment) {
            order.paymentInfo.refundedWalletAmount = refundAmount;
            order.paymentInfo.walletRefundedAt = new Date();
            
            // For hybrid payments, add a note about refunding only the wallet portion
            order.notes.push({
              type: 'admin',
              content: `Refunded wallet portion (₦${refundAmount}) of credit payment for order #${order.order_id}. Total order amount was ₦${order.totalAmount}.`,
              createdAt: new Date()
            });
          }
        } else {
          console.log(`Skipping wallet refund for order ${order.order_id} as it has already been refunded.`);
          
          // Add a note about the already refunded wallet portion
          order.notes.push({
            type: 'admin',
            content: `Skipped wallet refund for order #${order.order_id} as the wallet portion was already refunded earlier.`,
            createdAt: new Date()
          });
        }

        // Ensure buyerDetails._id is set
        if (!order.buyerDetails || !order.buyerDetails._id) {
          if (!order.buyerDetails) {
            order.buyerDetails = {};
          }
          order.buyerDetails._id = order.buyer._id;
        }
      } catch (refundError) {
        console.error('Error processing refund to wallet:', refundError);
        // Continue with the approval but note the error
        order.notes.push({
          type: 'admin',
          content: `Error processing refund: ${refundError.message}`,
          createdAt: new Date()
        });
      }
    }
    
    // Ensure all required buyerDetails fields are set before saving
    if (!order.buyerDetails || !order.buyerDetails._id) {
      if (!order.buyerDetails) {
        order.buyerDetails = {};
      }
      order.buyerDetails._id = order.buyer._id;
      
      // Set other buyerDetails fields
      if (order.buyer) {
        order.buyerDetails.firstName = order.buyer.firstName || '';
        order.buyerDetails.lastName = order.buyer.lastName || '';
        order.buyerDetails.username = order.buyer.username || '';
        if (order.buyer.profileImage && order.buyer.profileImage.url) {
          order.buyerDetails.profileImage = [{url: order.buyer.profileImage.url}];
        } else {
          order.buyerDetails.profileImage = [];
        }
      }
    }
    
    // Save the order
    await order.save();
    
    // Prepare email based on status
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Refund Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
        <p>Dear ${order.buyer.firstName},</p>
        <p>Your refund request for order #${order.order_id} has been ${status}.</p>
    `;
    
    if (status === 'approved') {
      if (refundDetails.isHybridPayment) {
        emailHtml += `
          <p><strong>Refund Details:</strong></p>
          <ul>
            <li>Order Amount: ₦${refundDetails.originalAmount?.toLocaleString() || order.totalAmount.toLocaleString()}</li>
            <li>Wallet Amount Used: ₦${refundAmount.toLocaleString()}</li>
          </ul>
          <p>Since you used a combination of your wallet and Paystack for this order, we have refunded the wallet portion (₦${refundAmount.toLocaleString()}) to your Auqli wallet. You can use this balance for future purchases on our platform.</p>
        `;
      } else {
        emailHtml += `
          <p><strong>Refund Details:</strong></p>
          <ul>
            <li>Order Amount: ₦${refundDetails.originalAmount?.toLocaleString() || order.totalAmount.toLocaleString()}</li>
            <li>Refund Amount: ₦${refundAmount.toLocaleString()}</li>
          </ul>
          <p>The full order amount has been added to your Auqli wallet balance. You can use this balance for future purchases on our platform.</p>
        `;
      }
    } else {
      emailHtml += `
        <p><strong>Reason for Rejection:</strong> ${notes || 'No specific reason provided.'}</p>
        <p>If you believe this decision was made in error or have any questions, please contact our support team.</p>
      `;
    }
    
    emailHtml += `
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: ${order.order_id}</li>
          <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
          <li>Seller: ${order.seller.firstName} ${order.seller.lastName}</li>
        </ul>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The Auqli Team</p>
      </div>
    `;
    
    const buyerEmail = {
      to: order.buyer.email,
      from: 'Auqli Refunds <support@auqli.com>',
      subject: `Refund Request ${status === 'approved' ? 'Approved' : 'Rejected'} - Order #${order.order_id}`,
      html: emailHtml
    };
    
    try {
      await sgMail.send(buyerEmail);
    } catch (emailError) {
      console.error('Error sending email to buyer:', emailError);
    }
    
    // Send notification to buyer
    try {
      await createNotification(order.buyer._id, 'refund_request_processed', {
        orderId: order._id,
        status: status,
        orderNumber: order.order_id,
        refundAmount: status === 'approved' ? refundAmount : 0
      });
      
      // Send push notification if buyer has an expo push token
      if (order.buyer.expoPushToken) {
        const notificationController = require('./notificationController');
        await notificationController.sendPushNotification(
          order.buyer.expoPushToken,
          `Refund Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          status === 'approved' 
            ? (refundDetails.isHybridPayment
               ? `Your wallet refund of ₦${refundAmount.toLocaleString()} for order #${order.order_id} has been processed.`
               : `Your refund of ₦${refundAmount.toLocaleString()} for order #${order.order_id} has been processed and added to your wallet.`)
            : `Your refund request for order #${order.order_id} has been rejected. Reason: ${notes || 'No specific reason provided.'}`
        );
      }
    } catch (notifError) {
      console.error('Error sending notification to buyer:', notifError);
    }
    
    res.json({
      message: `Refund request ${status} successfully`,
      order: {
        _id: order._id,
        order_id: order.order_id,
        refundRequest: order.refundRequest
      },
      refundDetails: status === 'approved' ? {
        refundAmount,
        addedToWallet: true
      } : undefined
    });
    
  } catch (error) {
    console.error('Error processing refund request:', error);
    res.status(500).json({ 
      message: 'Error processing refund request', 
      error: error.message 
    });
  }
};

// Get refund requests for a buyer
exports.getBuyerRefundRequests = async (req, res) => {
  try {
    const buyerId = req.params.buyerId || req.user.id;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Ensure the requesting user can only access their own refund requests
    if (req.user.role !== 'admin' && req.user.id !== buyerId) {
      return res.status(403).json({ message: 'You are not authorized to view these refund requests' });
    }
    
    // Build query filters
    const query = {
      buyer: buyerId,
      'refundRequest.requested': true
    };
    
    // Filter by status if provided
    if (status) {
      query['refundRequest.status'] = status;
    }
    
    // Count total matching documents
    const totalRefundRequests = await Order.countDocuments(query);
    
    // Calculate pagination
    const totalPages = Math.ceil(totalRefundRequests / limit);
    const skip = (page - 1) * limit;
    
    // Get orders with refund requests
    const orders = await Order.find(query)
      .populate('seller', 'firstName lastName email businessName storeName')
      .sort({ 'refundRequest.requestedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Format the response
    const refundRequests = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.order_id,
      refundRequest: order.refundRequest,
      seller: {
        id: order.seller._id,
        name: order.seller.businessName || order.seller.storeName,
        email: order.seller.email
      },
      amount: order.totalAmount,
      refundAmount: order.refundRequest.refundAmount,
      paymentMethod: order.paymentInfo?.method,
      requestedAt: order.refundRequest.requestedAt,
      processedAt: order.refundRequest.processedAt,
      status: order.refundRequest.status,
      reason: order.refundRequest.reason,
      createdAt: order.createdAt
    }));
    
    res.json({
      refundRequests,
      pagination: {
        total: totalRefundRequests,
        pages: totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching buyer refund requests:', error);
    res.status(500).json({ 
      message: 'Error fetching refund requests', 
      error: error.message 
    });
  }
};

/**
 * Get manifest URL for an order from Fez Delivery API
 */
exports.getManifestUrl = async (req, res) => {
  try {
    const { orderNo } = req.params;
    
    if (!orderNo) {
      return res.status(400).json({ 
        message: 'Order number is required' 
      });
    }
    
    console.log(`📄 Getting manifest URL for order: ${orderNo}`);
    
    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    console.log('Using fresh token for manifest URL request:', authToken.substring(0, 10) + '...');
    
    // Log request details
    console.log('Making request to Fez API:', {
      url: `${FEZ_API_URL}/orders/${orderNo}/manifest-url`,
      headers: {
        'Authorization': `Bearer ${authToken.substring(0, 10)}...`,
        'secret-key': `${process.env.FEZ_SECRET_KEY?.substring(0, 10)}...` || 'default_key'
      }
    });

    // Get manifest URL from Fez Delivery
    const manifestResponse = await axios.get(`${FEZ_API_URL}/orders/${orderNo}/manifest-url`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': process.env.FEZ_SECRET_KEY 
      }
    });
    
    // Log full response from Fez
    console.log('📥 Full Fez API Response:', {
      status: manifestResponse.status,
      statusText: manifestResponse.statusText,
      headers: manifestResponse.headers,
      data: JSON.stringify(manifestResponse.data, null, 2)
    });

    if (manifestResponse.data && manifestResponse.data.status === 'Success') {
      console.log('✅ Fez manifest URL request successful:', {
        status: manifestResponse.data.status,
        description: manifestResponse.data.description,
        data: manifestResponse.data.data
      });
      
      // Return the exact Fez response format
      return res.json({
        status: manifestResponse.data.status,
        description: manifestResponse.data.description,
        data: {
          url: manifestResponse.data.data.url // Return exactly what Fez returns
        }
      });
    } else {
      console.log('❌ Fez manifest URL request failed:', {
        response: manifestResponse.data,
        orderNo
      });
      return res.status(400).json({ 
        status: 'Error',
        description: manifestResponse.data.description || 'Failed to get manifest URL',
        data: {} // Return empty data object on error to match Fez format
      });
    }
  } catch (error) {
    console.error('❌ Error getting manifest URL from Fez:', {
      message: error.message,
      orderNo: req.params.orderNo
    });
    
    if (error.response) {
      console.error('Fez API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: JSON.stringify(error.response.data, null, 2)
      });
      return res.status(error.response.status).json({
        status: 'Error',
        description: error.response.data.description || 'Error getting manifest URL',
        data: {} // Return empty data object on error to match Fez format
      });
    }
    
    return res.status(500).json({ 
      status: 'Error',
      description: 'Error getting manifest URL',
      data: {} // Return empty data object on error to match Fez format
    });
  }
};

// Helper function to handle failed payments
async function handleFailedPayment(paymentData, res) {
  const { reference, metadata } = paymentData;
  
  if (!metadata || !metadata.orderId) {
    return res.status(200).json({ message: 'No order metadata found in failed payment' });
  }
  
  try {
  const Order = mongoose.model('Order');
    const order = await Order.findById(metadata.orderId);
  
  if (!order) {
      return res.status(200).json({ message: 'Order not found for failed payment' });
    }
    
    // Check if this order has already been processed (paid or cancelled)
    if (order.paid || !order.isOpen) {
      return res.status(200).json({ message: 'Order already processed, ignoring failed payment' });
    }
    
    console.log(`Processing failed payment for order ${order.order_id}`, {
      reference,
      orderStatus: order.paymentInfo.status,
      isOpen: order.isOpen,
      paymentMethod: order.paymentInfo.method
    });
    
    // Check if this is a hybrid payment (wallet + Paystack)
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    
    if (isHybridPayment) {
      console.log(`Failed payment was hybrid for order ${order.order_id}`, {
        totalAmount: order.totalAmount,
        walletAmountUsed: order.paymentInfo.walletAmountUsed,
        paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
      });
      
      // If wallet was already used, we need to refund it
      if (order.paymentInfo.walletAmountUsed > 0) {
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(order.buyer);
        
        if (buyer) {
          // Refund the wallet amount that was used
          const walletTransaction = {
            type: 'credit',
            amount: order.paymentInfo.walletAmountUsed,
            description: `Refund for failed order ${order.order_id}`,
            status: 'completed',
            createdAt: new Date()
          };
          
          // Add transaction to wallet
          buyer.wallet.balance += order.paymentInfo.walletAmountUsed;
          buyer.wallet.transactions.push(walletTransaction);
          
          // Save buyer with updated wallet
          await buyer.save();
          
          console.log(`Refunded wallet amount for failed hybrid payment: ${order.paymentInfo.walletAmountUsed}`, {
            orderId: order._id,
            buyer: buyer._id,
            newWalletBalance: buyer.wallet.balance
          });
        } else {
          console.error(`Could not find buyer ${order.buyer} to refund wallet amount for failed order ${order.order_id}`);
        }
      }
    }
    
    // Mark order as closed with appropriate reason
    order.isOpen = false;
    order.closedAt = new Date();
    order.closedBy = 'auto';
    order.closedReason = `Payment failed: ${paymentData.gateway_response || 'Unknown payment failure'}`;
    
    // Also update items status to cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment failed'
      });
    });
    
    await order.save();
    
    // Notify the buyer about the failed payment
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(order.buyer);
    
    if (buyer && buyer.email) {
      try {
      // Send email notification about failed payment
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
        // Prepare email content
        let emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Failed</h2>
            <p>Dear ${buyer.firstName},</p>
            <p>Your payment for order #${order.order_id} was not successful.</p>
            <p><strong>Reason:</strong> ${paymentData.gateway_response || 'Payment could not be processed'}</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order.order_id}</li>
              <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
            </ul>
        `;
        
        // Add wallet refund info if applicable
        if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
          emailContent += `
            <p><strong>Wallet Refund:</strong> Your wallet credit of ₦${order.paymentInfo.walletAmountUsed.toLocaleString()} used for this order has been refunded to your wallet.</p>
          `;
        }
        
        emailContent += `
            <p>If you would still like to purchase these items, please place a new order.</p>
            <p>If you believe this is an error, please contact our support team.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `;
        
        // Send the email
        await sgMail.send({
          to: buyer.email,
          from: 'Auqli Payment <support@auqli.com>',
          subject: 'Payment Failed - Auqli',
          html: emailContent
        });
        
        console.log(`Sent failed payment email to ${buyer.email} for order ${order.order_id}`);
  } catch (emailError) {
        console.error('Error sending failed payment email:', emailError);
      }
  }
  
  return res.status(200).json({ 
      message: 'Failed payment processed, order cancelled',
      order: {
        _id: order._id,
        order_id: order.order_id,
        isOpen: order.isOpen,
        closedReason: order.closedReason
      }
    });
  } catch (error) {
    console.error('Error handling failed payment:', error);
    return res.status(200).json({ message: 'Error handling failed payment, but acknowledging webhook' });
  }
}

// Helper function to format address for Fez API
function formatAddressForFez(addressObj) {
  const addressParts = [];
  
  if (addressObj.addressLine1) {
    addressParts.push(addressObj.addressLine1);
  }
  
  if (addressObj.addressLine2) {
    addressParts.push(addressObj.addressLine2);
  }
  
  if (addressObj.city) {
    addressParts.push(addressObj.city);
  }
  
  if (addressObj.state) {
    addressParts.push(addressObj.state);
  }
  
  return addressParts.join(', ');
}

/**
 * Update tracking information for an international seller's order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateInternationalOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, trackingUrl, estimatedDeliveryDate } = req.body;
    const sellerId = req.user.id;

    // Validate input
    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the seller owns this order
    if (order.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order'
      });
    }

    // Check if seller is international
    const seller = await Seller.findById(sellerId);
    if (!seller || !seller.isInternational) {
      return res.status(403).json({
        success: false,
        message: 'Only international sellers can use this endpoint'
      });
    }

    // Update tracking information
    order.shipping.tracking.number = trackingNumber;
    if (trackingUrl) {
      order.shipping.tracking.url = trackingUrl;
    }
    if (estimatedDeliveryDate) {
      order.shipping.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    // Add tracking history entry
    order.shipping.tracking.history.push({
      status: 'tracking_updated',
      timestamp: new Date(),
      description: 'Tracking information updated by seller'
    });

    // Save the updated order
    await order.save();

    // Send email notification to buyer
    try {
      const buyer = await Buyer.findById(order.buyer);
      if (buyer && buyer.email) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        await sgMail.send({
          to: buyer.email,
          from: {
            email: 'support@auqli.com',
            name: 'Auqli Orders'
          },
          subject: `Order #${order.order_id} - Tracking Information Updated`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Tracking Updated</h2>
              <p>Dear ${buyer.firstName},</p>
              <p>The tracking information for your order #${order.order_id} has been updated by the seller.</p>
              <p><strong>New Tracking Number:</strong> ${trackingNumber}</p>
              ${trackingUrl ? `<p><strong>Tracking URL:</strong> <a href="${trackingUrl}" target="_blank">${trackingUrl}</a></p>` : ''}
              ${estimatedDeliveryDate ? `<p><strong>Estimated Delivery Date:</strong> ${estimatedDeliveryDate}</p>` : ''}
              <p>You can track your order using the tracking information provided.</p>
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        });
        
        console.log(`Tracking update notification email sent to buyer ${buyer.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send tracking update email:', emailError);
      // Continue execution despite email error
    }

    res.status(200).json({
      success: true,
      message: 'Order tracking information updated successfully',
      order: {
        _id: order._id,
        order_id: order.order_id,
        tracking: {
          number: order.shipping.tracking.number,
          url: order.shipping.tracking.url,
          estimatedDeliveryDate: order.shipping.estimatedDeliveryDate
        }
      }
    });
  } catch (error) {
    console.error('Error updating international order tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order tracking information',
      error: error.message
    });
  }
};

/**
 * Update shipping status for an international seller's order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateInternationalOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    // Validate status
    const validStatuses = ['Picked-Up', 'Dispatched', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the seller owns this order
    if (order.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this order'
      });
    }

    // Check if seller is international
    const seller = await Seller.findById(sellerId);
    if (!seller || !seller.isInternational) {
      return res.status(403).json({
        success: false,
        message: 'Only international sellers can use this endpoint'
      });
    }

    // Update order status
    order.shipping.tracking.status = status;
    order.shipping.tracking.lastUpdate = new Date();

    // Add tracking history entry
    order.shipping.tracking.history.push({
      status,
      timestamp: new Date(),
      description: `Order marked as ${status} by seller`
    });

    // If status is Delivered, update all items to delivered
    if (status === 'Delivered') {
      order.items.forEach(item => {
        item.status = 'delivered';
        item.statusHistory.push({
          status: 'delivered',
          timestamp: new Date(),
          note: 'Automatically updated when order was marked as delivered'
        });
      });
    }

    // If status is Cancelled, update all items to cancelled
    if (status === 'Cancelled') {
      order.items.forEach(item => {
        item.status = 'cancelled';
        item.statusHistory.push({
          status: 'cancelled',
          timestamp: new Date(),
          note: 'Automatically updated when order was marked as cancelled'
        });
      });

      // Close the order
      order.isOpen = false;
      order.closedAt = new Date();
      order.closedBy = 'seller';
      order.closedReason = 'Order cancelled by international seller';
    }

    // Save the updated order
    await order.save();

    // Send email notification to buyer
    try {
      const buyer = await Buyer.findById(order.buyer);
      if (buyer && buyer.email) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        await sgMail.send({
          to: buyer.email,
          from: {
            email: 'support@auqli.com',
            name: 'Auqli Orders'
          },
          subject: `Order #${order.order_id} - Status Updated to ${status}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Status Updated</h2>
              <p>Dear ${buyer.firstName},</p>
              <p>The status of your order #${order.order_id} has been updated to <strong>${status}</strong>.</p>
              ${status === 'Delivered' ? 
                '<p>Your order has been delivered! If you have any issues with your order, please contact the seller or our support team.</p>' : ''}
              ${status === 'Cancelled' ? 
                '<p>Your order has been cancelled by the seller. If you have any questions, please contact our support team.</p>' : ''}
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        });
        
        console.log(`Status update notification email sent to buyer ${buyer.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Continue execution despite email error
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        order_id: order.order_id,
        status: order.shipping.tracking.status,
        lastUpdate: order.shipping.tracking.lastUpdate
      }
    });
  } catch (error) {
    console.error('Error updating international order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};



