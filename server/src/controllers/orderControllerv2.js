const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Buyer = require('../models/Buyer');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { agenda } = require('../config/agenda');
const { mixpanel } = require('../app');
const { trackPurchase } = require('../controllers/campaignController');
const sgMail = require('../config/sendgrid');
const terminalAPI = require('../config/terminalAPI');
const { truncateString, normalizeCountry, formatNigerianPhone, formatAddressForTerminal } = require('../helpers/formatters');
const { validateAddress, validateItems } = require('../helpers/validators');
const axios = require('axios');

// Initialize Paystack for Terminal Africa orders
const crypto = require('crypto');
const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || "sk_test_REDACTED";
const paystack = require('axios').create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to verify Paystack transaction status
const verifyPaystackTransaction = async (reference) => {
  try {
    const response = await paystack.get(`/transaction/verify/${reference}`);
    return {
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

// Helper function to update product stock for paid orders
const updateProductStockForPaidOrder = async (order) => {
  try {
    console.log(`Updating product stock for paid Terminal Africa order: ${order.order_id}`);
    
    for (const item of order.items) {
      const productBefore = await Product.findById(item.product);
      
      if (productBefore) {
        console.log(`Product ${item.product} before stock update:`, {
          currentStock: productBefore.stock,
          currentSoldCount: productBefore.stats.soldCount,
          itemQuantity: item.quantity
        });

        // Since stock was already updated during order creation, we don't need to update it again
        // This function is mainly for consistency with the original controller
        console.log(`Stock already updated for product ${item.product} during order creation`);
      }
    }
    
    console.log(`✅ Product stock verification completed for order: ${order.order_id}`);
  } catch (error) {
    console.error(`Error updating product stock for order ${order.order_id}:`, error);
  }
};

// Helper function to send Slack notification for paid orders
const sendSlackNotificationForPaidOrder = async (order, buyer) => {
  try {
    // Get seller names for the order
    const seller = await Seller.findById(order.seller);
    const sellerName = seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller';
    
    // Send notification to Slack email
    const slackEmailMsg = {
      to: 'orders-aaaaqm2ugmdudvf4jsgf3koetm@auqli.slack.com',
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders'
      },
      subject: 'Order Paid - Terminal Africa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Paid - Terminal Africa</h2>
          <p>A Terminal Africa order has been paid on Auqli.</p>
          <p><strong>Order ID:</strong> ${order.order_id}</p>
          <p><strong>Buyer:</strong> ${buyer.firstName} ${buyer.lastName}</p>
          <p><strong>Seller:</strong> ${sellerName}</p>
          <p><strong>Amount:</strong> ₦${order.totalAmount.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${order.paymentInfo.method}</p>
          <p><strong>Shipment ID:</strong> ${order.shipping?.shipment_id || 'N/A'}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    };

    await sgMail.send(slackEmailMsg);
    console.log('✅ Slack notification sent for paid Terminal Africa order:', order.order_id);
  } catch (error) {
    console.error('Error sending Slack notification for paid order:', error);
  }
};

// Helper function to send order confirmation email
const sendOrderConfirmationEmail = async (buyer, order) => {
  try {
    const seller = await Seller.findById(order.seller);
    const sellerName = seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller';
    
    const emailMsg = {
      to: buyer.email,
      from: {
        email: 'support@auqli.com',
        name: 'Auqli Orders'
      },
      subject: `Order Confirmation - ${order.order_id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Order Confirmation</h2>
          <p>Dear ${buyer.firstName},</p>
          <p>Thank you for your payment! Your order has been confirmed.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${order.order_id}</li>
            <li>Seller: ${sellerName}</li>
            <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
            <li>Items: ${order.items.length} item(s)</li>
            <li>Shipping: ${order.isStorePickup ? 'Store Pickup' : 'Terminal Africa Delivery'}</li>
          </ul>
          ${order.shipping?.tracking?.number ? `<p><strong>Tracking Number:</strong> ${order.shipping.tracking.number}</p>` : ''}
          <p>We'll keep you updated on your order status.</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    await sgMail.send(emailMsg);
    console.log('✅ Order confirmation email sent for Terminal Africa order:', order.order_id);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};

// Create order with Terminal Africa
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
      additionalDetails, 
      pickUpDate,
      senderInfo,
      paidFromWallet = false, 
      isWalletCredit = false, // Parameter for hybrid wallet + Paystack payment
      isStorePickup = false, // Parameter for store pickup
      shipmentPurpose = 'commercial' // Default shipment purpose for Terminal Africa
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
      const sellerIds = [...new Set(items.map(item => item.seller?.sellerId))];
      
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
    const itemsValidation = validateItems(items);
    if (!itemsValidation.valid) {
      return res.status(400).json({ message: itemsValidation.message });
    }
    
    // Only validate shipping address if not store pickup
    if (!isStorePickup) {
      // Format shipping address to Terminal Africa format for validation
      const deliveryAddress = formatAddressForTerminal({
        ...shippingAddress,
        country: 'NG' // Ensure country is set to Nigeria
      });
      
      const addressValidation = validateAddress(deliveryAddress);
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
        const seller = await Seller.findById(item.seller.sellerId);
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
    
    // Get buyer from token
    const buyerId = req.user.id;
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
          message: `Insufficient stock for ${product.name} (${product.stock} available)`
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
          // Initialize shipping fee to 0 - will be updated when carrier is selected
          shippingFee: 0,
          totalWeight: 0,
          // Initialize seller-specific parcel information
          parcelItems: []
        };
      }
      
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      sellerItems[sellerId].totalAmount += itemTotal;
      
      // Add item weight to seller's total weight (default to product weight or a minimum value)
      // Use the weight provided in the item, or fall back to product weight or default
      const itemWeight = (item.weight || product.weight || 0.1) * item.quantity;
      sellerItems[sellerId].totalWeight += itemWeight;
      
      // Add item to seller's parcel items for Terminal Africa
      sellerItems[sellerId].parcelItems.push({
        description: product.description?.substring(0, 100) || product.name,
        name: product.name,
        type: "parcel",
        currency: "NGN",
        value: item.price,
        quantity: item.quantity,
        weight: itemWeight / item.quantity, // Weight per unit
        metadata: {
          productId: product._id.toString(),
          specifications: item.specifications || {}
        }
      });
      
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
    let totalShippingFee = 0;
    
    // Calculate grand total (items + shipping)
    let grandTotal = totalAmount + totalShippingFee;
    
    // Check wallet balance if using wallet payment
    if (isFullyPaidFromWallet) {
      if (buyer.wallet.balance < grandTotal) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance. Required: ${grandTotal}, Available: ${buyer.wallet.balance}` 
        });
      }
    }
    
    // Create a batch ID for all orders
    const batchId = `AUQLI-${uuidv4().substring(0, 8)}`;
    
    // Create orders for each seller
    const orders = [];
    const terminalShipments = [];
    
    for (const sellerId in sellerItems) {
      const sellerData = sellerItems[sellerId];
      const sellerItemsList = sellerData.items;
      const seller = sellerData.seller;
      // Use seller-specific sender info if available, otherwise fall back to the global one
      const sellerSenderInfo = sellerData.senderInfo || senderInfo || {};
      // Use the seller-specific batch ID
      const sellerBatchId = sellerData.batchId;
      // Use seller-specific weight
      const sellerWeight = sellerData.totalWeight;
      // Use seller-specific parcel items
      const sellerParcelItems = sellerData.parcelItems;
      
      const sellerTotal = sellerItemsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Generate a unique order ID
      const uniqueOrderId = `AUQLI-${uuidv4().substring(0, 8)}`;
      
      // Get fresh seller data with all fields populated to ensure we have the latest address info
      const fullSellerData = await Seller.findById(sellerId);
      
      // Log all available address data for debugging
      console.log('DEBUG - Seller Address Data:', {
        sellerId: sellerId,
        hasSellerAddress: fullSellerData?.sellerAddress?.addressLine1 ? true : false,
        sellerAddress: fullSellerData?.sellerAddress,
        hasBusinessAddress: fullSellerData?.businessAddress?.addressLine1 ? true : false,
        businessAddress: fullSellerData?.businessAddress,
        hasWarehouseAddress: fullSellerData?.warehouseDetails?.address?.addressLine1 ? true : false,
        warehouseAddress: fullSellerData?.warehouseDetails?.address
      });
      
      // Format delivery address for Terminal Africa
      const deliveryAddress = formatAddressForTerminal({
        ...shippingAddress,
        country: 'NG' // Ensure country is set to Nigeria
      });
      
      // Determine which address to use for pickup based on availability
      let pickupAddress = null;
      
      // Start with sellerSenderInfo from request
      if (sellerSenderInfo && sellerSenderInfo.senderAddress) {
        // Use the address provided in the request
        const senderName = sellerSenderInfo.senderName || `${fullSellerData.firstName} ${fullSellerData.lastName}`.trim();
        pickupAddress = formatAddressForTerminal({
          recipientName: senderName,
          recipientEmail: sellerSenderInfo.senderEmail || fullSellerData.email,
          recipientPhone: sellerSenderInfo.senderPhone || fullSellerData.phoneNumber,
          recipientAddress: sellerSenderInfo.senderAddress,
          recipientState: sellerSenderInfo.pickUpState || "Lagos",
          recipientCity: '',
          recipientZip: '',
          country: 'NG'
        });
        console.log('Order using pickup address from request');
      } 
      // Then try sellerAddress
      else if (fullSellerData.sellerAddress && fullSellerData.sellerAddress.addressLine1) {
        // Use the seller address
        const sellerName = `${fullSellerData.firstName} ${fullSellerData.lastName}`.trim();
        pickupAddress = formatAddressForTerminal({
          ...fullSellerData.sellerAddress,
          recipientName: sellerName,
          recipientEmail: fullSellerData.email,
          recipientPhone: fullSellerData.phoneNumber,
          country: 'NG'
        });
        console.log('Order using seller address from database');
      } 
      // Try businessAddress
      else if (fullSellerData.businessAddress && fullSellerData.businessAddress.addressLine1) {
        // Use the business address
        const sellerName = `${fullSellerData.firstName} ${fullSellerData.lastName}`.trim();
        pickupAddress = formatAddressForTerminal({
          ...fullSellerData.businessAddress,
          recipientName: sellerName,
          recipientEmail: fullSellerData.email,
          recipientPhone: fullSellerData.phoneNumber,
          country: 'NG'
        });
        console.log('Order using business address from database');
      }
      // Try warehouse address
      else if (fullSellerData.warehouseDetails && fullSellerData.warehouseDetails.address && fullSellerData.warehouseDetails.address.addressLine1) {
        // Use the warehouse address
        const sellerName = `${fullSellerData.firstName} ${fullSellerData.lastName}`.trim();
        pickupAddress = formatAddressForTerminal({
          ...fullSellerData.warehouseDetails.address,
          recipientName: sellerName,
          recipientEmail: fullSellerData.email,
          recipientPhone: fullSellerData.phoneNumber || fullSellerData.warehouseDetails.contactNumber,
          country: 'NG'
        });
        console.log('Order using warehouse address from database');
      }
      // Try legacy address field
      else if (fullSellerData.address) {
        // Use the legacy address
        const sellerName = `${fullSellerData.firstName} ${fullSellerData.lastName}`.trim();
        pickupAddress = formatAddressForTerminal({
          recipientName: sellerName,
          recipientEmail: fullSellerData.email,
          recipientPhone: fullSellerData.phoneNumber,
          recipientAddress: fullSellerData.address,
          recipientState: fullSellerData.state || 'Lagos',
          recipientCity: '',
          recipientZip: fullSellerData.zipCode || fullSellerData.zip || '',
          country: 'NG'
        });
        console.log('Order using legacy address field from database');
      } else {
        console.log('No suitable pickup address found for seller', sellerId);
        // Create minimal address with just the name
        const sellerName = `${fullSellerData.firstName} ${fullSellerData.lastName}`.trim();
        pickupAddress = formatAddressForTerminal({
          recipientName: sellerName,
          recipientEmail: fullSellerData.email,
          recipientPhone: fullSellerData.phoneNumber,
          recipientAddress: 'Address not provided',
          recipientState: 'Lagos',
          recipientCity: '',
          recipientZip: fullSellerData.zipCode || fullSellerData.zip || '',
          country: 'NG'
        });
      }
      
      // Log the formatted addresses for debugging
      console.log('Formatted Addresses for Terminal Africa:', {
        pickup: {
          ...pickupAddress,
          phone_formatted: pickupAddress.phone
        },
        delivery: {
          ...deliveryAddress,
          phone_formatted: deliveryAddress.phone
        }
      });
      
      // Skip Terminal Africa API call for store pickup orders
      let terminalResponse = null;
      let terminalShipmentCreated = false;
      
      if (!isStorePickup) {
        // Create Terminal Africa shipment request
        const terminalShipmentRequest = {
          pickup_address: pickupAddress,
          delivery_address: deliveryAddress,
          metadata: `Order ${uniqueOrderId} for ${buyer.firstName} ${buyer.lastName}`,
          shipment_purpose: shipmentPurpose,
          parcel: {
            items: sellerParcelItems,
            description: `Order from ${seller.storeName || seller.businessName || 'Seller'}`,
            weight_unit: "kg"
          }
        };
        
        console.log('Terminal Africa Shipment Request:', JSON.stringify(terminalShipmentRequest, null, 2));
        
        // Call Terminal Africa API to create shipment
        try {
          terminalResponse = await terminalAPI.post('/shipments/quick', terminalShipmentRequest);
          
          // Add detailed logging of the full Terminal Africa response
          console.log('TERMINAL AFRICA FULL RESPONSE:', JSON.stringify(terminalResponse.data, null, 2));
          
          // Check if the shipment was created successfully
          if (!terminalResponse.data.status || !terminalResponse.data.data) {
            throw new Error(terminalResponse.data.message || 'Failed to create shipment with Terminal Africa');
          }
          
          // Mark as successful
          terminalShipmentCreated = true;
          
          console.log('Terminal Africa Shipment Response:', {
            status: terminalResponse.data.status,
            shipmentId: terminalResponse.data.data?.shipment_id || terminalResponse.data.data?._id,
            message: terminalResponse.data.message,
            responseKeys: terminalResponse.data.data ? Object.keys(terminalResponse.data.data) : []
          });
        } catch (terminalError) {
          console.error('Terminal Africa API Error:', {
            message: terminalError.message,
            response: terminalError.response?.data
          });
          
          // Abort the transaction and return error to client
          if (session.inTransaction()) {
            await session.abortTransaction();
          }
          session.endSession();
          
          // Return meaningful error to client
          return res.status(400).json({
            message: 'Failed to create shipment with Terminal Africa',
            error: terminalError.response?.data?.message || terminalError.message,
            details: terminalError.response?.data || {}
          });
        }
        
        // Store the shipment request for later use
        terminalShipments.push({
          orderId: uniqueOrderId,
          sellerId: sellerId,
          request: terminalShipmentRequest,
          response: terminalResponse.data
        });
      } else {
        // For store pickup, we don't need Terminal Africa
        terminalShipmentCreated = true;
        terminalResponse = { 
          data: { 
            status: true, 
            message: "Store pickup - no shipment required",
            data: { 
              _id: `PICKUP-${uniqueOrderId}`,
              shipment_id: `PICKUP-${uniqueOrderId}`
            } 
          } 
        };
      }

      // Only proceed if we have a successful Terminal response or it's a store pickup
      if (!terminalShipmentCreated && !isStorePickup) {
        // This should not happen as we already handle errors above, but just as a safeguard
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        session.endSession();
        return res.status(400).json({ 
          message: 'Failed to create shipment with Terminal Africa' 
        });
      }

      // Extract the Terminal Africa shipment ID - prefer shipment_id over _id
      const terminalShipmentId = terminalResponse.data?.data?.shipment_id || terminalResponse.data?.data?._id || `MANUAL-${uniqueOrderId}`;
      
      // Log the extracted shipment ID for debugging
      console.log('EXTRACTED TERMINAL SHIPMENT ID:', {
        shipment_id: terminalResponse.data?.data?.shipment_id,
        _id: terminalResponse.data?.data?._id,
        finalExtractedId: terminalShipmentId
      });

      // Create order in database with shipping fee set to 0
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
        isStorePickup: isStorePickup,
        delivery_address: isStorePickup ? null : deliveryAddress,
        pickup_address: isStorePickup ? pickupAddress : pickupAddress,
        shipping: {
          carrier: isStorePickup ? null : {
            name: 'Terminal Africa',
            reference: terminalShipmentId
          },
          fee: {
            amount: 0, // Set initial shipping fee to 0
            currency: 'NGN'
          },
          tracking: {
            number: terminalShipmentId,
            status: 'pending'
          },
          shipment_id: terminalShipmentId
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
      
      // Schedule Terminal Africa warning notification 20 minutes after order creation
      // This covers both payment and carrier selection issues
      agenda.schedule('in 20 minutes', 'send_terminal_order_warning', { orderId: order._id });
      console.log(`Scheduled Terminal Africa warning notification for order ${order.order_id} in 20 minutes`);
      
      // Schedule Terminal Africa stale job for all orders after 30 minutes
      // This will check for both payment completion and carrier selection
      agenda.schedule('in 30 minutes', 'mark_terminal_orders_stale', { orderId: order._id });
      console.log(`Scheduled Terminal Africa stale check for order ${order.order_id} in 30 minutes`);
      
      // Add buyer to seller's customers list if not already a customer
      const existingCustomer = fullSellerData.customers.find(
        customer => customer.buyerId && customer.buyerId.toString() === buyerId.toString()
      );
      
      if (!existingCustomer) {
        // Add buyer as a new customer
        await Seller.findByIdAndUpdate(
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
        await Seller.findOneAndUpdate(
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
      
      // Update product stock for each item in the order
      for (const item of sellerItemsList) {
        // Find the product before update to log its current stock
        const productBefore = await Product.findById(item.product);
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
          { new: true, session } // Return the updated document and use the transaction session
        );

        console.log('Product after stock update:', {
          productId: updateResult._id,
          newStock: updateResult.stock,
          newInventoryQuantity: updateResult.inventory.quantity,
          newSoldCount: updateResult.stats.soldCount,
          updateSuccessful: !!updateResult
        });
      }
      
      orders.push(order);
      
      // Add to our local array for processing after transaction
      orderNotifications.push({
        orderId: order._id,
        buyerId: buyerId,
        sellerId: sellerId
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
    
    // After all orders are processed and Terminal API calls are complete
    await session.commitTransaction();
    session.endSession();

    console.log('Transaction committed successfully');

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

    // Send a notification email to Slack
    try {
      // Get seller names for each order
      const orderSellerInfo = await Promise.all(
        orders.map(async (order) => {
          const seller = await Seller.findById(order.seller);
          return {
            orderId: order.order_id,
            sellerName: seller ? (seller.storeName || seller.businessName || `${seller.firstName} ${seller.lastName}`) : 'Unknown Seller'
          };
        })
      );
      
      // Send a simple notification to Slack email
      const slackEmailMsg = {
        to: 'orders-aaaaqm2ugmdudvf4jsgf3koetm@auqli.slack.com',
        from: {
          email: 'support@auqli.com',
          name: 'Auqli Orders'
        },
        subject: 'New Order on Auqli (Terminal Africa)',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>New Order on Auqli (Terminal Africa)</h2>
            <p>A new order has been created on Auqli using Terminal Africa shipping.</p>
            <p>Order count: ${orders.length}</p>
            <p>Buyer: ${buyer.firstName} ${buyer.lastName}</p>
            ${orderSellerInfo.map(info => 
              `<p>Order ID: ${info.orderId}, Store: ${info.sellerName}</p>`
            ).join('')}
            <p>Time: ${new Date().toISOString()}</p>
          </div>
        `
      };

      await sgMail.send(slackEmailMsg);
      console.log('Slack notification email sent for new order');
    } catch (slackEmailError) {
      console.error('Error sending Slack notification email:', slackEmailError);
      // Continue processing even if email fails
    }

    console.log('Order creation completed');
    
    // Prepare response with detailed order information
    const orderSummaries = [];
    
    for (const order of orders) {
      const sellerInfo = sellerItems[order.seller.toString()];
      orderSummaries.push({
        orderId: order._id,
        order_id: order.order_id,
        seller: order.seller,
        items: order.items.length,
        itemsTotal: order.totalAmount, // This is just the items total
        shippingFee: 0, // Set initial shipping fee to 0 in response
        orderTotal: order.totalAmount, // Total without shipping initially
        terminalShipmentId: order.shipping.shipment_id
      });
    }
    
    // Log the terminal shipments array for debugging
    console.log('TERMINAL SHIPMENTS FOR RESPONSE:', terminalShipments.map(ts => ({
      orderId: ts.orderId,
      shipmentId: ts.response.data?.shipment_id || ts.response.data?.data?.shipment_id || ts.response.data?.data?._id,
      status: ts.response.status,
      responseDataKeys: ts.response ? Object.keys(ts.response) : [],
      dataKeys: ts.response.data ? Object.keys(ts.response.data) : []
    })));
    
    // Check if the order is from a liveshow and update the stream with order information
    if (req.body.channel === "livestream" && req.body.streamId) {
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
                shippingFee: sellerItems[order.seller.toString()].shippingFee || (shippingFee / Object.keys(sellerItems).length),
                orderTotal: order.totalAmount + (sellerItems[order.seller.toString()].shippingFee || (shippingFee / Object.keys(sellerItems).length)),
                seller: order.seller,
                terminalShipmentId: order.shipping.shipment_id,
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
      shippingTotal: 0, // Set initial shipping total to 0
      grandTotal: totalAmount, // Grand total is just items total initially
      orderCount: orders.length,
      sellerEarnings: totalAmount * 0.85, // Simplified calculation
      shippingCost: 0, // Set initial shipping cost to 0
      walletAmountUsed: walletAmountToUse || 0,
      paystackAmount: paystackAmount || 0,
      isWalletCredit: isWalletCredit && walletAmountToUse > 0
    };
    
    return res.status(201).json({
      message: 'Orders created successfully with Terminal Africa shipping',
      orders: orderSummaries,
      totals: responseTotals,
      terminalShipments: terminalShipments.map(ts => ({
        orderId: ts.orderId,
        shipmentId: ts.response.data?.shipment_id || ts.response.data?.data?.shipment_id || ts.response.data?.data?._id,
        status: ts.response.status
      }))
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

// Get shipping rates for an order from Terminal Africa
exports.getOrderRates = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        message: 'Invalid order ID format' 
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found' 
      });
    }
    
    // Check if this is a store pickup order
    if (order.isStorePickup) {
      return res.status(400).json({
        message: 'Store pickup orders do not have shipping rates'
      });
    }
    
    // Get the shipment ID from the order
    const shipmentId = order.shipping?.shipment_id;
    
    if (!shipmentId) {
      return res.status(400).json({ 
        message: 'No shipment ID found for this order' 
      });
    }
    
    // Check if the shipment ID is a manually generated one
    if (shipmentId.startsWith('MANUAL-') || shipmentId.startsWith('PICKUP-')) {
      return res.status(400).json({
        message: 'This order does not have a valid Terminal Africa shipment'
      });
    }
    
    console.log(`Fetching rates for shipment ID: ${shipmentId}`);
    
    // Call Terminal Africa API to get rates for this shipment
    try {
      const ratesResponse = await terminalAPI.get(`/rates/shipment?shipment_id=${shipmentId}`);
      
      // Log the response for debugging
      console.log('Terminal Africa Rates Response:', {
        status: ratesResponse.data.status,
        message: ratesResponse.data.message,
        ratesCount: ratesResponse.data.data?.length || 0
      });
      
      if (!ratesResponse.data.status) {
        return res.status(400).json({
          message: 'Failed to retrieve rates from Terminal Africa',
          error: ratesResponse.data.message
        });
      }
      
      // Return the rates data
      return res.status(200).json({
        message: 'Shipping rates retrieved successfully',
        order_id: order.order_id,
        shipment_id: shipmentId,
        rates: ratesResponse.data.data || []
      });
      
    } catch (terminalError) {
      console.error('Terminal Africa API Error:', {
        message: terminalError.message,
        response: terminalError.response?.data
      });
      
      return res.status(500).json({
        message: 'Failed to retrieve rates from Terminal Africa',
        error: terminalError.response?.data?.message || terminalError.message
      });
    }
    
  } catch (error) {
    console.error('Error getting order rates:', error);
    return res.status(500).json({ 
      message: 'Failed to get shipping rates', 
      error: error.message 
    });
  }
};

// Helper function to arrange shipment pickup with Terminal Africa
const arrangeShipmentHelper = async (order, rateId, session = null) => {
  try {
    console.log(`Arranging pickup for order: ${order.order_id}, shipment: ${order.shipping?.shipment_id}, rate: ${rateId}`);
    
    // Call Terminal Africa API to arrange pickup
    const arrangePickupResponse = await terminalAPI.post('/shipments/pickup', {
      rate_id: rateId
    });
    
    console.log('Terminal Africa Arrange Pickup Response:', {
      status: arrangePickupResponse.data.status,
      message: arrangePickupResponse.data.message
    });
    
    if (!arrangePickupResponse.data.status) {
      throw new Error(arrangePickupResponse.data.message || 'Failed to arrange shipment with Terminal Africa');
    }
    
    // Extract tracking information from the response
    const responseData = arrangePickupResponse.data.data;
    const extras = responseData.extras || {};
    
    // Update the order with tracking information
    if (extras.tracking_number) {
      order.shipping.tracking.number = extras.tracking_number;
    }
    
    if (extras.tracking_url) {
      order.shipping.tracking.url = extras.tracking_url;
    }
    
    // Update shipping documents
    if (!order.shipping.documents) {
      order.shipping.documents = {};
    }
    
    if (extras.shipping_label_url) {
      order.shipping.documents.shippingLabel = extras.shipping_label_url;
    }
    
    if (extras.commercial_invoice_url) {
      order.shipping.documents.commercialInvoice = extras.commercial_invoice_url;
    }
    
    // Update carrier tracking URL
    if (extras.carrier_tracking_url && order.shipping.carrier) {
      order.shipping.carrier.trackingUrl = extras.carrier_tracking_url;
    }
    
    // Update tracking status
    order.shipping.tracking.status = 'confirmed';
    order.shipping.tracking.lastUpdate = new Date();
    
    // Add to tracking history
    if (!order.shipping.tracking.history) {
      order.shipping.tracking.history = [];
    }
    
    // Add event to tracking history
    if (responseData.events && responseData.events.length > 0) {
      for (const event of responseData.events) {
        order.shipping.tracking.history.push({
          status: event.status,
          timestamp: new Date(event.created_at),
          location: event.location,
          description: event.description
        });
      }
    } else {
      // Add a default event if none provided
      order.shipping.tracking.history.push({
        status: 'confirmed',
        timestamp: new Date(),
        description: 'Shipment arranged'
      });
    }
    
    // Save the updated order
    if (session) {
      await order.save({ session });
    } else {
      await order.save();
    }
    
    return {
      success: true,
      tracking: {
        number: extras.tracking_number,
        url: extras.tracking_url,
        carrier_url: extras.carrier_tracking_url
      },
      documents: {
        shipping_label: extras.shipping_label_url,
        commercial_invoice: extras.commercial_invoice_url
      }
    };
    
  } catch (error) {
    console.error('Error in arrangeShipmentHelper:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

// Select a carrier for an order
exports.selectCarrier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId } = req.params;
    const { 
      rate_id, 
      amount, 
      carrier_name, 
      carrier_reference, 
      carrier_logo,
      carrier_rate_description,
      delivery_time, 
      pickup_time,
      delivery_eta,
      pickup_eta,
      delivery_date,
      pickup_date
    } = req.body;
    
    // Validate required fields
    if (!rate_id || !amount || !carrier_name || !carrier_reference) {
      return res.status(400).json({ 
        message: 'Missing required carrier information' 
      });
    }
    
    // Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        message: 'Invalid order ID format' 
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found' 
      });
    }
    
    // Check if this is a store pickup order
    if (order.isStorePickup) {
      return res.status(400).json({
        message: 'Cannot select carrier for store pickup orders'
      });
    }
    
    console.log(`Updating order ${order.order_id} with carrier information: ${carrier_name}, rate: ${rate_id}`);
    
    // Update the order with the selected carrier information
    order.shipping.carrier = {
      name: carrier_name,
      reference: carrier_reference,
      logo: carrier_logo,
      rate_description: carrier_rate_description
    };
    
    // Update shipping fee with the selected rate amount
    order.shipping.fee = {
      amount: amount,
      currency: 'NGN'
    };
    
    // Update delivery and pickup estimates
    if (delivery_date) {
      order.shipping.delivery = {
        ...order.shipping.delivery,
        estimatedDate: new Date(delivery_date)
      };
    }
    
    if (delivery_time) {
      order.shipping.estimatedDeliveryDate = delivery_time;
    }
    
    if (pickup_time) {
      order.shipping.estimatedPickupDate = pickup_time;
    }
    
    // Add rate information to the order
    order.shipping.rate_id = rate_id;
    order.shipping.delivery_eta = delivery_eta;
    order.shipping.pickup_eta = pickup_eta;
    
    // Calculate new order total with shipping
    const newOrderTotal = order.totalAmount + amount;
    
    // Save the updated order
    await order.save({ session });
    
    console.log(`Carrier selected successfully for order ${order.order_id}. Now automatically arranging shipment...`);
    
    // Automatically arrange shipment after successful carrier selection
    const arrangementResult = await arrangeShipmentHelper(order, rate_id, session);
    
    if (!arrangementResult.success) {
      console.error(`Failed to automatically arrange shipment for order ${order.order_id}:`, arrangementResult.error);
      // Don't fail the carrier selection if shipment arrangement fails
      // Just log the error and continue
    } else {
      console.log(`✅ Shipment automatically arranged for order ${order.order_id}`);
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Prepare response
    const response = {
      message: 'Carrier selected successfully',
      order_id: order.order_id,
      shipment_id: order.shipping?.shipment_id,
      carrier: {
        name: carrier_name,
        reference: carrier_reference,
        rate_id: rate_id,
        amount: amount,
        delivery_time: delivery_time,
        pickup_time: pickup_time
      },
      totals: {
        itemsTotal: order.totalAmount,
        shippingFee: amount,
        orderTotal: newOrderTotal
      }
    };
    
    // Add shipment arrangement details if successful
    if (arrangementResult.success) {
      response.shipment_arranged = true;
      response.tracking = arrangementResult.tracking;
      response.documents = arrangementResult.documents;
      response.message = 'Carrier selected and shipment arranged successfully';
    } else {
      response.shipment_arranged = false;
      response.arrangement_error = arrangementResult.error;
      response.message = 'Carrier selected successfully, but shipment arrangement failed. You can try arranging shipment manually.';
    }
    
    return res.status(200).json(response);
    
  } catch (error) {
    // Abort the transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error selecting carrier:', error);
    return res.status(500).json({ 
      message: 'Failed to select carrier', 
      error: error.message 
    });
  }
};

// Arrange shipment pickup with Terminal Africa
exports.arrangeShipment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId } = req.params;
    const { rate_id } = req.body;
    
    // Validate required fields
    if (!rate_id) {
      return res.status(400).json({ 
        message: 'Rate ID is required' 
      });
    }
    
    // Validate orderId
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        message: 'Invalid order ID format' 
      });
    }
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        message: 'Order not found' 
      });
    }
    
    // Check if this is a store pickup order
    if (order.isStorePickup) {
      return res.status(400).json({
        message: 'Cannot arrange shipment for store pickup orders'
      });
    }
    
    // Get the shipment ID from the order
    const shipmentId = order.shipping?.shipment_id;
    
    if (!shipmentId) {
      return res.status(400).json({ 
        message: 'No shipment ID found for this order' 
      });
    }
    
    // Check if the shipment ID is a manually generated one
    if (shipmentId.startsWith('MANUAL-') || shipmentId.startsWith('PICKUP-')) {
      return res.status(400).json({
        message: 'This order does not have a valid Terminal Africa shipment'
      });
    }
    
    // Use the helper function to arrange shipment
    const arrangementResult = await arrangeShipmentHelper(order, rate_id, session);
    
    if (!arrangementResult.success) {
      // Abort the transaction
      await session.abortTransaction();
      session.endSession();
      
      return res.status(500).json({
        message: 'Failed to arrange shipment with Terminal Africa',
        error: arrangementResult.error
      });
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      message: 'Shipment arranged successfully',
      order_id: order.order_id,
      shipment_id: shipmentId,
      tracking: arrangementResult.tracking,
      documents: arrangementResult.documents
    });
    
  } catch (error) {
    // Abort the transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error arranging shipment:', error);
    return res.status(500).json({ 
      message: 'Failed to arrange shipment', 
      error: error.message 
    });
  }
};

// Cancel order by seller
exports.cancelOrderBySeller = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user.id;

    // Find the order and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName storeName');

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

    // Check if order is in cancellable status
    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!order.items.every(item => cancellableStatuses.includes(item.status || 'pending'))) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    // Check if this is a store pickup order
    if (order.isStorePickup) {
      console.log('Store pickup order - skipping Terminal Africa cancellation');
    } else {
      // Cancel shipment with Terminal Africa if shipment exists
      const shipmentId = order.shipping?.shipment_id;
      
      if (shipmentId && !shipmentId.startsWith('MANUAL-') && !shipmentId.startsWith('PICKUP-')) {
        try {
          console.log(`Cancelling Terminal Africa shipment: ${shipmentId}`);
          
          const cancelResponse = await terminalAPI.post('/shipments/cancel', {
            shipment_id: shipmentId
          });
          
          console.log('Terminal Africa cancellation response:', {
            status: cancelResponse.data.status,
            message: cancelResponse.data.message
          });
          
          if (cancelResponse.data.status) {
            console.log('Terminal Africa shipment cancelled successfully');
          } else {
            console.log('Terminal Africa cancellation failed:', cancelResponse.data.message);
            // Continue with local cancellation despite Terminal API error
          }
        } catch (terminalError) {
          console.error('Terminal Africa API error:', {
            message: terminalError.message,
            response: terminalError.response?.data
          });
          // Continue with local cancellation despite Terminal API error
        }
      }
    }

    // Handle wallet refund for hybrid payments
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    let walletRefunded = false;
    let walletRefundAmount = 0;
    
    if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
      try {
        console.log(`Processing wallet refund for hybrid payment in order ${order.order_id}`);
        
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
          await buyer.save({ session });
          
          walletRefunded = true;
          console.log(`Successfully refunded wallet amount: ${walletRefundAmount}`);
        }
      } catch (refundError) {
        console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
        // Continue with order cancellation even if refund fails
      }
    }

    // Update all items status to cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      if (!item.statusHistory) {
        item.statusHistory = [];
      }
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason || 'Cancelled by seller'
      });
    });

    // Update shipping status to cancelled
    if (order.shipping && order.shipping.tracking) {
      order.shipping.tracking.status = 'cancelled';
      order.shipping.tracking.lastUpdate = new Date();
      
      if (!order.shipping.tracking.history) {
        order.shipping.tracking.history = [];
      }
      
      order.shipping.tracking.history.push({
        status: 'cancelled',
        timestamp: new Date(),
        description: reason || 'Order cancelled by seller'
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            'stats.soldCount': -item.quantity,
            'stock': item.quantity,
            'inventory.quantity': item.quantity 
          }
        },
        { session }
      );
    }

    // Handle refund request for paid orders
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
    } else {
      // For unpaid orders, close the order immediately
      order.isOpen = false;
      order.closedAt = new Date();
      order.closedBy = 'seller';
      order.closedReason = reason || 'Order cancelled by seller';
    }

    // Save the order
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send email notifications
    let buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancellation Notice</h2>
        <p>Dear ${order.buyer.firstName},</p>
        <p>Your order #${order.order_id} has been cancelled by the seller.</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p><strong>Seller:</strong> ${order.seller.storeName || order.seller.businessName}</p>
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
      subject: 'Order Cancellation Confirmation - Auqli',
      html: buyerEmailHtml
    };

    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Orders <support@auqli.com>',
      subject: 'Order Cancellation Notice - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Cancellation Notice</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>You have successfully cancelled order #${order.order_id}.</p>
          <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          <p><strong>Buyer:</strong> ${order.buyer.firstName} ${order.buyer.lastName}</p>
          ${order.paid ? `<p>Since this was a paid order, a refund request has been automatically created for the buyer.</p>` : ''}
          ${walletRefunded ? `<p>The wallet amount used for this order (₦${walletRefundAmount.toLocaleString()}) has been refunded to the buyer's wallet.</p>` : ''}
          <p>The product stock has been restored.</p>
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
          to: admins.map(admin => admin.email).filter(Boolean),
          from: 'Auqli Orders <support@auqli.com>',
          subject: 'New Refund Request - Order Cancelled by Seller',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Refund Request</h2>
              <p>A new refund request has been created due to order cancellation by seller.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Order ID: ${order.order_id}</li>
                <li>Seller: ${order.seller.storeName || order.seller.businessName}</li>
                <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
                <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
                <li>Reason: ${reason || 'Order cancelled by seller'}</li>
                ${walletRefunded ? `<li>Note: Wallet payment of ₦${walletRefundAmount.toLocaleString()} was automatically refunded</li>` : ''}
              </ul>
              <p>Please process this refund request promptly.</p>
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
    // Abort the transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
};

// Cancel order by buyer
exports.cancelOrderByBuyer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const buyerId = req.user.id;

    // Find the order and populate necessary fields
    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName lastName')
      .populate('seller', 'email firstName lastName businessName storeName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify this is the buyer's order
    if (order.buyer._id.toString() !== buyerId) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // Check if order is already cancelled
    if (order.items.some(item => item.status === 'cancelled')) {
      return res.status(400).json({ 
        message: 'This order has already been cancelled' 
      });
    }

    // Check if order is in cancellable status (buyers can only cancel pending orders)
    if (!order.items.every(item => (item.status || 'pending') === 'pending')) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled. Only pending orders can be cancelled by buyers.' 
      });
    }

    // Check if this is a store pickup order
    if (order.isStorePickup) {
      console.log('Store pickup order - skipping Terminal Africa cancellation');
    } else {
      // Cancel shipment with Terminal Africa if shipment exists
      const shipmentId = order.shipping?.shipment_id;
      
      if (shipmentId && !shipmentId.startsWith('MANUAL-') && !shipmentId.startsWith('PICKUP-')) {
        try {
          console.log(`Cancelling Terminal Africa shipment: ${shipmentId}`);
          
          const cancelResponse = await terminalAPI.post('/shipments/cancel', {
            shipment_id: shipmentId
          });
          
          console.log('Terminal Africa cancellation response:', {
            status: cancelResponse.data.status,
            message: cancelResponse.data.message
          });
          
          if (cancelResponse.data.status) {
            console.log('Terminal Africa shipment cancelled successfully');
          } else {
            console.log('Terminal Africa cancellation failed:', cancelResponse.data.message);
            // Continue with local cancellation despite Terminal API error
          }
        } catch (terminalError) {
          console.error('Terminal Africa API error:', {
            message: terminalError.message,
            response: terminalError.response?.data
          });
          // Continue with local cancellation despite Terminal API error
        }
      }
    }

    // Handle wallet refund for hybrid payments
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    let walletRefunded = false;
    let walletRefundAmount = 0;
    
    if (isHybridPayment && order.paymentInfo.walletAmountUsed > 0) {
      try {
        console.log(`Processing wallet refund for hybrid payment in order ${order.order_id}`);
        
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
          await buyer.save({ session });
          
          walletRefunded = true;
          console.log(`Successfully refunded wallet amount: ${walletRefundAmount}`);
        }
      } catch (refundError) {
        console.error(`Error refunding wallet amount for order ${order.order_id}:`, refundError);
        // Continue with order cancellation even if refund fails
      }
    }

    // Update all items status to cancelled
    order.items.forEach(item => {
      item.status = 'cancelled';
      if (!item.statusHistory) {
        item.statusHistory = [];
      }
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: reason || 'Cancelled by buyer'
      });
    });

    // Update shipping status to cancelled
    if (order.shipping && order.shipping.tracking) {
      order.shipping.tracking.status = 'cancelled';
      order.shipping.tracking.lastUpdate = new Date();
      
      if (!order.shipping.tracking.history) {
        order.shipping.tracking.history = [];
      }
      
      order.shipping.tracking.history.push({
        status: 'cancelled',
        timestamp: new Date(),
        description: reason || 'Order cancelled by buyer'
      });
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            'stats.soldCount': -item.quantity,
            'stock': item.quantity,
            'inventory.quantity': item.quantity 
          }
        },
        { session }
      );
    }

    // Handle refund request for paid orders
    if (order.paid || (order.paymentInfo && order.paymentInfo.method === 'wallet')) {
      console.log('Creating refund request for paid order:', order.order_id);
      
      order.refundRequest = {
        requested: true,
        requestedAt: new Date(),
        requestedBy: 'buyer',
        reason: reason || 'Order cancelled by buyer',
        status: 'pending',
        refundAmount: order.totalAmount
      };
    } else {
      // For unpaid orders, close the order immediately
      order.isOpen = false;
      order.closedAt = new Date();
      order.closedBy = 'buyer';
      order.closedReason = reason || 'Order cancelled by buyer';
    }

    // Save the order
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send email notifications
    let buyerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Cancellation Confirmation</h2>
        <p>Dear ${order.buyer.firstName},</p>
        <p>Your order #${order.order_id} has been cancelled as requested.</p>
        <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
        <p><strong>Seller:</strong> ${order.seller.storeName || order.seller.businessName}</p>
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
      subject: 'Order Cancellation Confirmation - Auqli',
      html: buyerEmailHtml
    };

    const sellerEmail = {
      to: order.seller.email,
      from: 'Auqli Orders <support@auqli.com>',
      subject: 'Order Cancellation Notice - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Cancellation Notice</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>Order #${order.order_id} has been cancelled by the buyer.</p>
          <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          <p><strong>Buyer:</strong> ${order.buyer.firstName} ${order.buyer.lastName}</p>
          ${order.paid ? `<p>Since this was a paid order, a refund request has been automatically created for the buyer.</p>` : ''}
          ${walletRefunded ? `<p>The wallet amount used for this order (₦${walletRefundAmount.toLocaleString()}) has been refunded to the buyer's wallet.</p>` : ''}
          <p>The product stock has been restored.</p>
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
          to: admins.map(admin => admin.email).filter(Boolean),
          from: 'Auqli Orders <support@auqli.com>',
          subject: 'New Refund Request - Order Cancelled by Buyer',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Refund Request</h2>
              <p>A new refund request has been created due to order cancellation by buyer.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Order ID: ${order.order_id}</li>
                <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
                <li>Seller: ${order.seller.storeName || order.seller.businessName}</li>
                <li>Amount: ₦${order.totalAmount.toLocaleString()}</li>
                <li>Reason: ${reason || 'Order cancelled by buyer'}</li>
                ${walletRefunded ? `<li>Note: Wallet payment of ₦${walletRefundAmount.toLocaleString()} was automatically refunded</li>` : ''}
              </ul>
              <p>Please process this refund request promptly.</p>
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
    // Abort the transaction if it's still active
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error cancelling order:', error);
    res.status(500).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    });
  }
};

// Mark Terminal Africa order as paid (for Paystack payments)
exports.markOrderAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentReference, manualNote } = req.body;
    
    if (!transactionId && !paymentReference) {
      return res.status(400).json({ message: 'Either transactionId or paymentReference is required' });
    }
    
    const order = await Order.findById(id).populate('seller', 'email firstName lastName businessName storeName');
    
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
          details: verificationResult.error 
        });
      }
    }
    
    // Check if order is already paid
    if (order.paid) {
      // Look for other unpaid orders from the same buyer with the same payment reference or transaction ID
      const searchCriteria = {
        buyer: order.buyer,
        paid: false,
        'paymentInfo.method': 'paystack',
        $or: []
      };
      
      if (paymentReference) {
        searchCriteria.$or.push({ 'paymentInfo.paymentReference': paymentReference });
      }
      
      if (transactionId) {
        searchCriteria.$or.push({ 'paymentInfo.transactionId': transactionId });
      }
      
      if (verificationResult && verificationResult.data && verificationResult.data.id) {
        searchCriteria.$or.push({ 'paymentInfo.transactionId': verificationResult.data.id });
      }
      
      if (searchCriteria.$or.length > 0) {
        const otherUnpaidOrders = await Order.find(searchCriteria)
          .populate('seller', 'email firstName lastName businessName storeName');
        
        if (otherUnpaidOrders.length > 0) {
          console.log(`Found ${otherUnpaidOrders.length} other unpaid Terminal Africa orders from the same buyer`);
          
          // Update each order's payment status
          const updatePromises = otherUnpaidOrders.map(async (otherOrder) => {
            otherOrder.paid = true;
            otherOrder.paymentInfo.status = 'paid';
            otherOrder.paymentInfo.transactionId = transactionId || verificationResult?.data?.id;
            otherOrder.paymentInfo.paymentReference = paymentReference || null;
            otherOrder.paymentInfo.paidAt = new Date();
            otherOrder.notificationsSent = true;
            
            // Update product stock verification for this order
            await updateProductStockForPaidOrder(otherOrder);
            
            // Check if this is a hybrid payment (wallet + Paystack)
            const isHybridPayment = otherOrder.paymentInfo.isWalletCredit && otherOrder.paymentInfo.walletAmountUsed > 0;
            
            if (isHybridPayment) {
              console.log(`Confirming hybrid payment for Terminal Africa order ${otherOrder.order_id}`, {
                totalAmount: otherOrder.totalAmount,
                walletAmountUsed: otherOrder.paymentInfo.walletAmountUsed,
                paystackAmount: otherOrder.totalAmount - otherOrder.paymentInfo.walletAmountUsed
              });
            }
            
            const updatedOtherOrder = await otherOrder.save();
            
            // Cancel any scheduled job to mark this order as stale
            try {
              await agenda.cancel({ 
                name: 'mark_terminal_orders_stale',
                'data.orderId': otherOrder._id.toString()
              });
              
              console.log(`Cancelled stale marking job for now-paid Terminal Africa order ${otherOrder.order_id}`);
            } catch (jobError) {
              console.error(`Error cancelling stale job for order ${otherOrder.order_id}:`, jobError);
            }
            
            // Get the buyer for notifications
            const buyer = await Buyer.findById(otherOrder.buyer);
            
            // Send order confirmation email
            if (buyer && buyer.email) {
              try {
                await sendOrderConfirmationEmail(buyer, otherOrder);
              } catch (emailError) {
                console.error(`Error sending order confirmation email for order ${otherOrder.order_id}:`, emailError);
              }
            }
            
            // Send Slack notification for the paid order
            await sendSlackNotificationForPaidOrder(otherOrder, buyer);
            
            return updatedOtherOrder;
          });
          
          const updatedOtherOrders = await Promise.all(updatePromises);
          
          return res.status(200).json({ 
            message: `Original order already paid. ${updatedOtherOrders.length} related Terminal Africa orders marked as paid.`, 
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
      console.log(`Confirming hybrid payment for Terminal Africa order ${order.order_id}`, {
        totalAmount: order.totalAmount,
        walletAmountUsed: order.paymentInfo.walletAmountUsed,
        paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
      });
    }
    
    // Update product stock verification
    await updateProductStockForPaidOrder(order);
    
    // Cancel the stale job for this order
    try {
      await agenda.cancel({ 
        name: 'mark_terminal_orders_stale',
        'data.orderId': order._id.toString()
      });
      console.log(`Cancelled stale job for Terminal Africa order ${order.order_id}`);
    } catch (jobErr) {
      console.error('Error cancelling stale job:', jobErr);
    }

    await order.save();
    
    // Get the buyer for notification
    const buyer = await Buyer.findById(order.buyer);
    
    // Send order confirmation email
    if (buyer && buyer.email) {
      try {
        await sendOrderConfirmationEmail(buyer, order);
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
      }
    }
    
    // Send Slack notification
    await sendSlackNotificationForPaidOrder(order, buyer);
    
    return res.status(200).json({ 
      message: 'Terminal Africa order marked as paid successfully', 
      order: {
        _id: order._id,
        order_id: order.order_id,
        paid: order.paid,
        paymentInfo: order.paymentInfo
      }
    });
    
  } catch (error) {
    console.error('Error marking Terminal Africa order as paid:', error);
    return res.status(500).json({ 
      message: 'Failed to mark order as paid', 
      error: error.message 
    });
  }
};

// Verify payment by reference for Terminal Africa orders
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
        details: verificationResult.error
      });
    }

    // If orderId is provided, mark the order as paid
    if (orderId) {
      const order = await Order.findById(orderId).populate('seller', 'email firstName lastName businessName storeName');
      
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

        // Update product stock verification
        await updateProductStockForPaidOrder(order);
        
        // Check if this is a hybrid payment (wallet + Paystack)
        const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
        
        if (isHybridPayment) {
          console.log(`Confirming hybrid payment for Terminal Africa order ${order.order_id}`, {
            totalAmount: order.totalAmount,
            walletAmountUsed: order.paymentInfo.walletAmountUsed,
            paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
          });
        }
        
        await order.save();
        
        // Get the buyer for notification and send Slack email
        const buyer = await Buyer.findById(order.buyer);
        
        // Send Slack notification for the paid order
        if (buyer) {
          await sendSlackNotificationForPaidOrder(order, buyer);
        }
        
        // Mark notifications as sent
        order.notificationsSent = true;
        await order.save();
        
        // Send order confirmation email
        if (buyer && buyer.email) {
          try {
            await sendOrderConfirmationEmail(buyer, order);
          } catch (emailError) {
            console.error('Error sending order confirmation email:', emailError);
          }
        }

        return res.status(200).json({
          message: 'Payment verified and Terminal Africa order marked as paid',
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

// Handle Paystack webhook for Terminal Africa orders
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
    console.log(`Received successful payment event from Paystack for Terminal Africa:`, {
      reference: event.data.reference,
      amount: event.data.amount / 100,
      status: event.data.status,
      metadata: event.data.metadata || {}
    });
    
    const metadata = event.data.metadata || {};
    
    // Check if this is a wallet top-up
    if (metadata.type === 'wallet_topup') {
      return await handleWalletTopUp(event.data, res);
    }
    
    // If there's no metadata or orderId, just acknowledge the webhook
    if (!metadata || !metadata.orderId) {
      return res.status(200).json({ message: 'Webhook received, but no order metadata' });
    }

    try {
      // Find the order
      const order = await Order.findById(metadata.orderId);
      
      if (!order) {
        console.log(`Order not found for Terminal Africa Paystack payment: ${metadata.orderId}`);
        return res.status(200).json({ message: 'Order not found, but acknowledging webhook' });
      }
      
      // Check if this is a Paystack order that's not already paid
      if (order.paymentInfo.method !== 'paystack' || order.paid) {
        console.log(`Terminal Africa order ${order.order_id} is either not a Paystack order or already paid`);
        return res.status(200).json({ message: 'Order already processed or not Paystack order' });
      }
      
      // Mark the order as paid
      order.paid = true;
      order.paymentInfo.status = 'paid';
      order.paymentInfo.transactionId = event.data.id;
      order.paymentInfo.paymentReference = event.data.reference;
      order.paymentInfo.paidAt = new Date();
      
      // Update product stock verification
      await updateProductStockForPaidOrder(order);
      
      // Get the buyer for notification and send Slack email
      const webhookBuyer = await Buyer.findById(order.buyer);
      if (webhookBuyer) {
        await sendSlackNotificationForPaidOrder(order, webhookBuyer);
      }
      
      // Cancel the stale job for this order
      try {
        await agenda.cancel({ 
          name: 'mark_terminal_orders_stale', 
          'data.orderId': order._id.toString() 
        });
        console.log(`Cancelled stale job for Terminal Africa order ${order.order_id}`);
      } catch (jobErr) {
        console.error('Error cancelling stale job:', jobErr);
      }

      // Check if this is a hybrid payment (wallet + Paystack)
      const isHybridPayment = order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
      
      if (isHybridPayment) {
        console.log(`Processing hybrid payment for Terminal Africa order ${order.order_id}`, {
          totalAmount: order.totalAmount,
          walletAmountUsed: order.paymentInfo.walletAmountUsed,
          paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
        });
      }
      
      await order.save();
      
      // Send order confirmation email
      if (webhookBuyer && webhookBuyer.email) {
        try {
          console.log(`Sending order confirmation email to ${webhookBuyer.email} for paid Terminal Africa order ${order.order_id}`);
          await sendOrderConfirmationEmail(webhookBuyer, order);
        } catch (emailError) {
          console.error('Error sending order confirmation email for paid Terminal Africa order:', emailError);
        }
      }
      
      return res.status(200).json({ message: 'Terminal Africa payment processed successfully' });
    } catch (error) {
      console.error('Error processing Terminal Africa Paystack webhook:', error);
      return res.status(200).json({ message: 'Error processing webhook, but acknowledging receipt' });
    }
  }
  
  // Handle payment failed event
  if (event.event === 'charge.failed') {
    console.log(`Received payment failure event from Paystack for Terminal Africa:`, {
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
      await sendSimpleTopUpEmail(buyer, existingTransaction);
    } catch (emailError) {
      console.error('Error sending wallet top-up email:', emailError);
    }
    
    return res.status(200).json({ message: 'Wallet topped up successfully via webhook' });
  }

  // If no transaction found, create a new one
  const amount = paymentData.amount / 100;
  
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
    await sendSimpleTopUpEmail(buyer, newTransaction);
  } catch (emailError) {
    console.error('Error sending wallet top-up email:', emailError);
  }
  
  return res.status(200).json({ message: 'Wallet topped up successfully via webhook' });
}

// Simple email function for wallet top-up
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

// Helper function to handle failed payments
async function handleFailedPayment(paymentData, res) {
  const { reference, metadata } = paymentData;
  
  if (!metadata || !metadata.orderId) {
    return res.status(200).json({ message: 'No order metadata found in failed payment' });
  }
  
  try {
    const order = await Order.findById(metadata.orderId);
  
    if (!order) {
      return res.status(200).json({ message: 'Order not found for failed payment' });
    }
    
    // Check if this order has already been processed (paid or cancelled)
    if (order.paid || !order.isOpen) {
      return res.status(200).json({ message: 'Order already processed, ignoring failed payment' });
    }
    
    console.log(`Processing failed payment for Terminal Africa order ${order.order_id}`, {
      reference,
      orderStatus: order.paymentInfo.status,
      isOpen: order.isOpen,
      paymentMethod: order.paymentInfo.method
    });
    
    // Check if this is a hybrid payment (wallet + Paystack)
    const isHybridPayment = order.paymentInfo && order.paymentInfo.isWalletCredit && order.paymentInfo.walletAmountUsed > 0;
    
    if (isHybridPayment) {
      console.log(`Failed payment was hybrid for Terminal Africa order ${order.order_id}`, {
        totalAmount: order.totalAmount,
        walletAmountUsed: order.paymentInfo.walletAmountUsed,
        paystackAmount: order.totalAmount - order.paymentInfo.walletAmountUsed
      });
      
      // If wallet was already used, we need to refund it
      if (order.paymentInfo.walletAmountUsed > 0) {
        const buyer = await Buyer.findById(order.buyer);
        
        if (buyer) {
          // Refund the wallet amount that was used
          const walletTransaction = {
            type: 'credit',
            amount: order.paymentInfo.walletAmountUsed,
            description: `Refund for failed Terminal Africa order ${order.order_id}`,
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
          console.error(`Could not find buyer ${order.buyer} to refund wallet amount for failed Terminal Africa order ${order.order_id}`);
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
      if (!item.statusHistory) {
        item.statusHistory = [];
      }
      item.statusHistory.push({
        status: 'cancelled',
        timestamp: new Date(),
        note: 'Payment failed'
      });
    });
    
    await order.save();
    
    // Notify the buyer about the failed payment
    const buyer = await Buyer.findById(order.buyer);
    
    if (buyer && buyer.email) {
      try {
        // Prepare email content
        let emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Failed</h2>
            <p>Dear ${buyer.firstName},</p>
            <p>Your payment for Terminal Africa order #${order.order_id} was not successful.</p>
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
        
        const failedPaymentEmail = {
          to: buyer.email,
          from: {
            email: 'support@auqli.com',
            name: 'Auqli Support'
          },
          subject: 'Payment Failed - Terminal Africa Order',
          html: emailContent
        };
        
        await sgMail.send(failedPaymentEmail);
        console.log('Failed payment notification email sent to buyer');
      } catch (emailError) {
        console.error('Error sending failed payment notification email:', emailError);
      }
    }
    
    return res.status(200).json({ message: 'Failed payment processed successfully' });
  } catch (error) {
    console.error('Error processing failed payment:', error);
    return res.status(200).json({ message: 'Error processing failed payment, but acknowledging receipt' });
  }
}

// Handle Terminal Africa webhook events (use existing webhook handler)
exports.handleTerminalWebhook = async (req, res) => {
  try {
    const { handleWebhook } = require('../webhooks/terminalWebhook');
    await handleWebhook(req, res);
  } catch (error) {
    console.error('Error handling Terminal webhook:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to process Terminal webhook',
      error: error.message
    });
  }
};

// Create Terminal Africa webhook
exports.createTerminalWebhook = async (req, res) => {
  try {
    const { name, active, events, live, url } = req.body;
    
    // Validate required fields
    if (!name || typeof active !== 'boolean' || !events || !Array.isArray(events) || typeof live !== 'boolean' || !url) {
      return res.status(400).json({
        status: false,
        message: 'Missing required fields: name, active, events, live, and url are required'
      });
    }
    
    // Validate events
    const validEvents = [
      'packaging.created',
      'packaging.updated',
      'shipment.cancelled',
      'shipment.created',
      'shipment.in-transit',
      'shipment.updated',
      'shipment.delivered'
    ];
    
    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid event types: ${invalidEvents.join(', ')}. Valid events: ${validEvents.join(', ')}`
      });
    }
    
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        status: false,
        message: 'URL must start with http:// or https://'
      });
    }
    
    // If live is true, URL must be HTTPS
    if (live && !url.startsWith('https://')) {
      return res.status(400).json({
        status: false,
        message: 'Live webhooks must use HTTPS URLs'
      });
    }
    
    // Check if Terminal API is configured
    if (!process.env.TERMINAL_SECRET_KEY) {
      return res.status(500).json({
        status: false,
        message: 'Terminal Africa API key not configured'
      });
    }
    
    // Use the existing terminalAPI client
    const response = await terminalAPI.post('/webhooks', {
      name,
      active,
      events,
      live,
      url
    });
    
    console.log('Terminal webhook created successfully:', response.data);
    
    res.status(201).json({
      status: true,
      message: 'Webhook created successfully',
      data: response.data.data
    });
    
  } catch (error) {
    console.error('Error creating Terminal webhook:', error);
    
    if (error.response) {
      // Terminal Africa API error
      return res.status(error.response.status).json({
        status: false,
        message: error.response.data.message || 'Failed to create webhook',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      status: false,
      message: 'Failed to create webhook',
      error: error.message
    });
  }
};

// Get all Terminal Africa webhooks
exports.getTerminalWebhooks = async (req, res) => {
  try {
    const { page = 1, perPage = 10 } = req.query;
    
    // Check if Terminal API is configured
    if (!process.env.TERMINAL_SECRET_KEY) {
      return res.status(500).json({
        status: false,
        message: 'Terminal Africa API key not configured'
      });
    }
    
    // Use the existing terminalAPI client
    const response = await terminalAPI.get('/webhooks', {
      params: {
        page: parseInt(page),
        perPage: parseInt(perPage)
      }
    });
    
    console.log('Terminal webhooks retrieved successfully');
    
    res.status(200).json({
      status: true,
      message: 'Webhooks retrieved successfully',
      data: response.data.data
    });
    
  } catch (error) {
    console.error('Error retrieving Terminal webhooks:', error);
    
    if (error.response) {
      // Terminal Africa API error
      return res.status(error.response.status).json({
        status: false,
        message: error.response.data.message || 'Failed to retrieve webhooks',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      status: false,
      message: 'Failed to retrieve webhooks',
      error: error.message
    });
  }
};

// Delete Terminal Africa webhook
exports.deleteTerminalWebhook = async (req, res) => {
  try {
    const { webhook_id } = req.params;
    
    if (!webhook_id) {
      return res.status(400).json({
        status: false,
        message: 'Webhook ID is required'
      });
    }
    
    // Check if Terminal API is configured
    if (!process.env.TERMINAL_SECRET_KEY) {
      return res.status(500).json({
        status: false,
        message: 'Terminal Africa API key not configured'
      });
    }
    
    // Use the existing terminalAPI client
    const response = await terminalAPI.delete(`/webhooks/${webhook_id}`);
    
    console.log('Terminal webhook deleted successfully:', webhook_id);
    
    res.status(200).json({
      status: true,
      message: 'Webhook deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting Terminal webhook:', error);
    
    if (error.response) {
      // Terminal Africa API error
      return res.status(error.response.status).json({
        status: false,
        message: error.response.data.message || 'Failed to delete webhook',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      status: false,
      message: 'Failed to delete webhook',
      error: error.message
    });
  }
};
