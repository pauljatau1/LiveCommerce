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
const FEZ_API_URL = process.env.FEZ_API_URL || 'https://apisandbox.fezdelivery.co/v1';
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
          'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
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

      console.log(`Creating webhook for event: ${event}`);

      try {
        const response = await terminalAPI.post('/webhooks', webhookData);
        
        if (response.data && response.data.status) {
          console.log(`Successfully created webhook for ${event}:`, {
            webhookId: response.data.data?.id,
            event: event
          });
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

    console.log('Completed webhook initialization process');
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
      paidFromWallet = false // New parameter for wallet payment
    } = req.body;
    
    // Validate inputs
    const itemsValidation = validateFezItems(items);
    if (!itemsValidation.valid) {
      return res.status(400).json({ message: itemsValidation.message });
    }
    
    const addressValidation = validateFezAddress(shippingAddress);
    if (!addressValidation.valid) {
      return res.status(400).json({ message: addressValidation.message });
    }
    
    // Only validate parcel if it's provided
    if (Object.keys(parcel).length > 0) {
      const parcelValidation = validateFezParcel(parcel);
      if (!parcelValidation.valid) {
        return res.status(400).json({ message: parcelValidation.message });
      }
    }
    
    // Get buyer from token
    const buyerId = req.user.id;
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(buyerId);
    
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    
    // Fetch products and calculate total
    const Product = mongoose.model('Product');
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } }).populate('seller');
    
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
          message: `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }
    }
    
    // Group items by seller
    const sellerItems = {};
    let totalAmount = 0;
    
    items.forEach(item => {
      const product = productMap[item.productId];
      if (!product) {
        return;
      }
      
      const sellerId = product.seller._id.toString();
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
          shippingFee: 0,
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
        productName: product.name,
        seller: product.seller._id,
        quantity: item.quantity,
        price: item.price,
        weight: itemWeight,
        specifications: item.specifications || {}
      });
    });
    
    // Calculate shipping fee for each seller based on their items' total weight
    // This is a simplified calculation - you may want to use a more sophisticated algorithm
    // or call a shipping rate API for each seller
    let totalShippingFee = 0;
    for (const sellerId in sellerItems) {
      const sellerData = sellerItems[sellerId];
      
      // Calculate shipping fee based on weight
      // This is a simple example - replace with your actual calculation logic
      const baseShippingFee = 1000; // Base fee in Naira
      const weightFactor = 500; // Additional fee per kg
      
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
    if (shippingFee) {
      const totalWeight = Object.values(sellerItems).reduce((sum, seller) => sum + seller.totalWeight, 0);
      
      for (const sellerId in sellerItems) {
        const sellerData = sellerItems[sellerId];
        // Distribute the shipping fee proportionally based on weight
        const weightRatio = sellerData.totalWeight / totalWeight;
        sellerData.shippingFee = Math.round(shippingFee * weightRatio);
      }
      
      // Ensure the sum of distributed fees equals the original total
      // (might be off by a few naira due to rounding)
      const distributedTotal = Object.values(sellerItems).reduce((sum, seller) => sum + seller.shippingFee, 0);
      
      // Adjust the first seller's fee to make up any difference
      if (distributedTotal !== shippingFee && Object.keys(sellerItems).length > 0) {
        const firstSellerId = Object.keys(sellerItems)[0];
        sellerItems[firstSellerId].shippingFee += (shippingFee - distributedTotal);
      }
    }
    
    // Calculate grand total (items + shipping)
    let grandTotal = totalAmount + totalShippingFee;
    
    // Check wallet balance if using wallet payment
    if (paidFromWallet) {
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
      
      // Create order in database
      const order = new Order({
        order_id: uniqueOrderId,
        buyer: buyerId,
        seller: sellerId,
        channel: req.body.channel || 'marketplace',
        items: sellerItemsList,
        totalAmount: sellerTotal,
        delivery_address: {
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
        shipping: {
          carrier: {
            name: 'Fez Delivery',
            reference: sellerBatchId // Use seller-specific batch ID
          },
          fee: {
            amount: sellerShippingFee, // Use seller-specific shipping fee
            currency: 'NGN'
          },
          tracking: {
            number: uniqueOrderId,
            status: 'pending'
          },
          shipment_id: uniqueOrderId
        },
        paid: (paymentMethod !== 'paystack' || isItemCod || paidFromWallet) ? (!isItemCod || paidFromWallet) : false,
        paymentInfo: {
          method: paidFromWallet ? 'wallet' : paymentMethod,
          status: isItemCod && !paidFromWallet ? 'awaiting_cod' : 
                 (paymentMethod === 'paystack' && !isItemCod && !paidFromWallet) ? 'pending' : 'paid',
          isCashOnDelivery: isItemCod && !paidFromWallet,
          ...(isItemCod && !paidFromWallet ? {} : 
             (paymentMethod === 'paystack' && !isItemCod && !paidFromWallet) ? {} : { paidAt: new Date() })
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
      
      // Add buyer to seller's customers list if not already a customer
      const Seller = mongoose.model('Seller');
      const sellerDoc = await Seller.findById(sellerId);
      
      if (sellerDoc) {
        // Check if buyer is already a customer
        const existingCustomer = sellerDoc.customers.find(
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
      
      // Don't schedule the notification job here - we'll do it once after transaction is committed
      console.log('Adding order to notification queue:', {
        orderId: order._id.toString(),
        buyerId,
        sellerId
      });
      
      // Create transaction record for seller earnings (if not COD and not pending Paystack payment)
      if ((!isItemCod || paidFromWallet) && !(paymentMethod === 'paystack' && !isItemCod && !paidFromWallet)) {
        // Only create transaction for the product amount (not including shipping)
        const Transaction = mongoose.model('Transaction');
        const transaction = new Transaction({
          seller: sellerId,
          orderId: order._id,
          amount: sellerTotal,
          type: 'order_payment',
          status: 'pending', // Changed from 'completed' to 'pending'
          description: `Payment for order #${order.order_id} (products only, excluding shipping fee)`,
          metadata: {
            itemTotal: sellerTotal,
            processingFeePercent: 0,
            categoryName: sellerItemsList[0]?.productName || 'Mixed',
            categoryFee: 0
          }
        });
        
        await transaction.save({ session });
        
        // Do not update seller's balance here - it will be updated when the order is closed
      }
      
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
      
      // Create Fez Delivery request with sender information and seller-specific parcel details
      const fezRequest = {
        recipientAddress: shippingAddress.recipientAddress,
        recipientState: shippingAddress.recipientState,
        recipientName: shippingAddress.recipientName,
        recipientPhone: shippingAddress.recipientPhone,
        recipientEmail: shippingAddress.recipientEmail || '',
        uniqueID: order.order_id, // Unique ID for each order
        BatchID: sellerBatchId, // Seller-specific batch ID
        valueOfItem: sellerParcel.valueOfItem,
        weight: Math.max(1, Math.round(sellerParcel.weight)), // Ensure minimum weight of 1kg for Fez
        itemDescription: sellerParcel.itemDescription,
        additionalDetails: additionalDetails || '',
        isItemCod: isItemCod && !paidFromWallet,
        thirdparty: "true",
        senderName: sellerSenderInfo.senderName || `${seller.firstName} ${seller.lastName}`,
        senderAddress: sellerSenderInfo.senderAddress || seller.address || 'Not provided',
        senderPhone: sellerSenderInfo.senderPhone || seller.phone || 'Not provided',
        senderEmail: sellerSenderInfo.senderEmail || seller.email || '',
      };
      
      // Add optional fields if provided
      if (pickUpDate) {
        fezRequest.pickUpDate = pickUpDate;
      } else {
        // Set a default pickup date (tomorrow)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        fezRequest.pickUpDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
      
      if (sellerSenderInfo.pickUpState) {
        fezRequest.pickUpState = sellerSenderInfo.pickUpState;
      } else if (seller.state) {
        fezRequest.pickUpState = seller.state;
      } else {
        // Default to Lagos if no pickup state is provided
        fezRequest.pickUpState = "Lagos";
      }
      
      fezRequests.push(fezRequest);
      
      // Queue the notification for after the transaction is committed
      // Store the order ID, buyer ID, and seller ID for processing after transaction commit
      const notificationData = {
        orderId: order._id,
        buyerId: buyerId,
        sellerId: sellerId // Ensure this is the correct seller ID
      };
      
      // Add to our local array
      orderNotifications.push(notificationData);
      
      // // Log the notification data for debugging
      // console.log('Prepared notification data:', {
      //   orderId: order._id.toString(),
      //   buyerId: buyerId,
      //   sellerId: sellerId,
      //   orderIdValid: !!order._id,
      //   buyerIdValid: !!buyerId,
      //   sellerIdValid: !!sellerId
      // });
    }
    
    // Get a fresh authentication token for Fez Delivery
    const authToken = await getFezAuthToken();
    console.log('Using fresh token for order creation:', authToken.substring(0, 10) + '...');
    
    // Make API call to Fez Delivery with fresh token
    const fezResponse = await axios.post(`${FEZ_API_URL}/order`, fezRequests, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
        'Content-Type': 'application/json'
      }
    });
    
    // Update orders with Fez tracking information
    if (fezResponse.data && fezResponse.data.status === 'Success') {
      const orderNos = fezResponse.data.orderNos;
      
      for (const order of orders) {
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
    
    // After all orders are processed and Fez API call is complete
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

    console.log('Order creation completed');
    
    // Prepare response with detailed order information
    const orderDetails = orders.map(order => {
      const sellerInfo = sellerItems[order.seller.toString()];
      return {
        orderId: order._id,
        order_id: order.order_id,
        seller: order.seller,
        items: order.items.length,
        itemsTotal: order.totalAmount, // This is just the items total
        shippingFee: sellerInfo.shippingFee,
        orderTotal: order.totalAmount + sellerInfo.shippingFee, // Total including shipping
        fezOrderNo: fezResponse.data?.orderNos?.[order.order_id] || null
      };
    });
    
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
              buyer: order.buyer,
              orderDetails: {
                _id: order._id,
                order_id: order.order_id,
                itemsCount: order.items.length,
                totalAmount: order.totalAmount,
                shippingFee: sellerItems[order.seller.toString()].shippingFee,
                orderTotal: order.totalAmount + sellerItems[order.seller.toString()].shippingFee,
                seller: order.seller,
                fezOrderNo: fezResponse.data?.orderNos?.[order.order_id] || null
              },
              product: firstItem.product,
              amount: order.totalAmount
            });
          }
          
          // Save the stream with updated orders
          await stream.save();
          
          // Send a socket notification about the order for the stream
          if (req.app && req.app.get('io')) {
            const io = req.app.get('io');
            
            // Create notification object for WebSocket
            const notificationObj = {
              id: Date.now().toString(),
              type: 'liveshow_order',
              user: stream.seller.storeName || 'Host',
              avatar: stream.seller.storeAvatar?.url || '',
              content: `New order placed during the liveshow`,
              data: {
                message: `New order placed during the liveshow`,
                streamId: stream._id.toString(),
                sellerId: stream.seller._id.toString(),
                storeName: stream.seller.storeName || 'Unknown Store',
                orders: orderDetails
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
      sellerEarnings: totalAmount, // Only the items total goes to sellers
      shippingCost: totalShippingFee // This goes to Fez Delivery
    };
    
    return res.status(201).json({
      message: 'Orders created successfully',
      orders: orderDetails,
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
    const query = { buyer: buyerId };

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
    const query = { seller: sellerId };

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
          order_id: order.order_id,
          status: status
        }
      ),
      // New buyer notification
      createBuyerNotification(
        order.buyer,
        'order_status_update',
        {
          orderId: order._id,
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
          order_id: order.order_id,
          status: status
        }
      ),
      // New buyer notification
      createBuyerNotification(
        order.buyer,
        'order_status_update',
        {
          orderId: order._id,
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
      .populate('seller', 'firstName lastName email phoneNumber businessName')
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
         .select('_id status description preferredResolution requestDate items timeline evidence sellerResponse refundDetails');

       const response = {
         order: {
           _id: order._id,
           order_id: order.order_id,
           channel: order.channel,
           createdAt: order.createdAt,
           totalAmount: order.totalAmount,
           paid: order.paid,
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
           product: {
             _id: item.product._id,
             name: item.product.name,
             category: item.product.category,
             description: item.product.description,
             images: item.product.images,
             discount: item.product.discount,
             seller: item.product.seller,
             brand: item.product.brand,
             variants: item.product.variants, // Add variants
             shippingInfo: item.product.shippingInfo,
             returnPolicy: item.product.returnPolicy,
             // Include any other product fields you want
             stock: item.product.stock,
             sku: item.product.sku,
             status: item.product.status,
             condition: item.product.condition
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

         
         shipping: {
        method: order.shipping.method,
        carrier: order.shipping.carrier,
        fee: order.shipping.fee,
        rate_id: order.shipping.rate_id,
        estimatedDeliveryDate: order.shipping.estimatedDeliveryDate,
        estimatedPickupDate: order.shipping.estimatedPickupDate,
        tracking: {
          number: order.shipping.tracking.number,
          carrier: order.shipping.tracking.carrier,
          status: order.shipping.tracking.status,
          lastUpdate: order.shipping.tracking.lastUpdate,
          history: order.shipping.tracking.history
        },
        shipment_id: order.shipping.shipment_id,
        shipment_purpose: order.shipping.shipment_purpose,
        documents: {
          shippingLabel: order.shipping?.documents?.shippingLabel,
          commercialInvoice: order.shipping?.documents?.commercialInvoice
        },
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
          order_id: order.order_id,
          status: 'closed',
          reason: order.closedReason
        }),
        createBuyerNotification(order.buyer._id, 'order_status_update', {
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
            'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
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
        sellerName: order.seller.storeName
      }),
      createNotification(order.seller._id, 'shipment_cancelled', {
        orderId: order._id,
        buyerName: `${order.buyer.firstName} ${order.buyer.lastName}`
      })
    ]);

    res.json({ 
      message: 'Shipment cancelled successfully',
      order: updatedOrder
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
    
    const authUrl = 'https://apisandbox.fezdelivery.co/v1/user/authenticate';
    const authData = {
      user_id: process.env.FEZ_USER_ID || "bolu@auqli.com",
      password: process.env.FEZ_PASSWORD || "Bolu@123"
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
    const { state, pickupLocations } = req.body;
    
    // Validate input
    if (!Array.isArray(pickupLocations)) {
      return res.status(400).json({
        status: 'Error',
        description: 'pickupLocations must be an array',
        error: 'Invalid input'
      });
    }

    // Get a fresh authentication token
    console.log('🔄 Getting fresh authentication token...');
    const authToken = await getFezAuthToken();
    console.log(`🔑 Using token: ${authToken.substring(0, 10)}...`);
    
    // Prepare the request URL and headers
    const url = 'https://apisandbox.fezdelivery.co/v1/order/cost';
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
      'Content-Type': 'application/json'
    };
    
    // Make parallel requests for each pickup location
    const costPromises = pickupLocations.map(async (location) => {
      const { pickUpState, weight, sellerId } = location;
      
      console.log(`📤 Cost request for seller ${sellerId}: ${JSON.stringify({ state, pickUpState, weight }, null, 2)}`);
      
      try {
        const response = await axios.post(url, {
          state,
          pickUpState,
          weight
        }, { 
          headers,
          timeout: 30000 // 30 seconds timeout
        });

        return {
          sellerId,
          pickUpState,
          weight,
          ...response.data
        };
      } catch (error) {
        console.error(`Error fetching cost for seller ${sellerId}:`, error.message);
        return {
          sellerId,
          pickUpState,
          weight,
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
      totalCost
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

/**
 * Internal version of getDeliveryCost that can be called from other controllers
 * Returns the cost data directly instead of sending an HTTP response
 */
exports.calculateDeliveryCostInternal = async (shippingDetails) => {
  try {
    console.log('🚚 Starting internal delivery cost calculation...');
    const { state, pickupLocations } = shippingDetails;
    
    // Validate input
    if (!Array.isArray(pickupLocations)) {
      throw new Error('pickupLocations must be an array');
    }

    // Get a fresh authentication token
    console.log('🔄 Getting fresh authentication token...');
    const authToken = await getFezAuthToken();
    console.log(`🔑 Using token: ${authToken.substring(0, 10)}...`);
    
    // Prepare the request URL and headers
    const url = 'https://apisandbox.fezdelivery.co/v1/order/cost';
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
      'Content-Type': 'application/json'
    };
    
    // Make parallel requests for each pickup location
    const costPromises = pickupLocations.map(async (location) => {
      const { pickUpState, weight, sellerId } = location;
      
      console.log(`📤 Internal cost request for seller ${sellerId}: ${JSON.stringify({ state, pickUpState, weight }, null, 2)}`);
      
      try {
        const response = await axios.post(url, {
          state,
          pickUpState,
          weight
        }, { 
          headers,
          timeout: 30000 // 30 seconds timeout
        });

        return {
          sellerId,
          pickUpState,
          weight,
          ...response.data
        };
      } catch (error) {
        console.error(`Error fetching cost for seller ${sellerId}:`, error.message);
        return {
          sellerId,
          pickUpState,
          weight,
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
        'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB"
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
        'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
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

// Mark order as paid (for Paystack payments)
exports.markOrderAsPaid = async (req, res) => {
  const { id } = req.params;
  const { paymentReference, transactionId = uuidv4(), manualNote } = req.body;

  try {
    // Verify Paystack transaction if reference is provided
    let verificationResult = null;
    if (paymentReference) {
      verificationResult = await verifyPaystackTransaction(paymentReference);
      
      if (!verificationResult.success) {
        return res.status(400).json({ 
          message: 'Payment verification failed', 
          error: verificationResult.error 
        });
      }
    }

    // Find order and check if it exists
    const order = await Order.findById(id)
      .populate('seller', 'email firstName lastName businessName walletBalance');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is already paid
    if (order.paid) {
      return res.status(400).json({ message: 'Order is already marked as paid' });
    }

    // Add a flag to track if notifications have been sent
    const notificationsAlreadySent = order.notificationsSent || false;
    
    // Mark notifications as sent
    order.notificationsSent = true;

    // Update order payment status
    order.paid = true;
    order.paymentInfo.status = 'paid';
    order.paymentInfo.transactionId = transactionId;
    order.paymentInfo.paymentReference = paymentReference || null;
    order.paymentInfo.paidAt = new Date();

    const updatedOrder = await order.save();

    // Only schedule notifications if they haven't been sent yet
    if (!notificationsAlreadySent) {
      console.log(`Scheduling order notifications for order ${order.order_id} after manual payment marking`);
      
      // Create notifications
      const notificationData = {
        orderId: order._id,
        buyerId: order.buyer,
        sellerId: order.seller._id
      };
      
      agenda.schedule('in 5 seconds', 'send-order-notifications', notificationData);
    } else {
      console.log(`Skipping notifications for order ${order.order_id} as they have already been sent`);
    }

    // Always send order confirmation email for paid Paystack order, regardless of notification status
    // This ensures the buyer gets their confirmation email that was skipped at order creation
    try {
      const Buyer = mongoose.model('Buyer');
      const buyer = await Buyer.findById(order.buyer);
      if (buyer) {
        console.log(`Sending order confirmation email to ${buyer.email} for paid Paystack order ${order.order_id}`);
        await exports.sendOrderConfirmationEmail(updatedOrder, buyer);
      }
    } catch (emailError) {
      console.error('Error sending order confirmation email for paid Paystack order:', emailError);
      // Continue processing even if email fails
    }

    res.status(200).json({ 
      message: 'Order marked as paid successfully', 
      order: updatedOrder,
      verificationDetails: paymentReference ? verificationResult.data : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark order as paid', error: error.message });
  }
};

// Verify payment by reference
exports.verifyPaymentByReference = async (req, res) => {
  const { reference, orderId } = req.body;

  if (!reference) {
    return res.status(400).json({ message: 'Payment reference is required' });
  }

  try {
    // Verify with Paystack
    const verificationResult = await verifyPaystackTransaction(reference);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        message: 'Payment verification failed', 
        error: verificationResult.error 
      });
    }

    // If order ID is provided, mark that specific order as paid
    if (orderId) {
      const order = await Order.findById(orderId).populate('seller');
      
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if this is a Paystack order that's not already paid
      if (order.paymentInfo.method !== 'paystack' || order.paid) {
        return res.status(400).json({ 
          message: 'Invalid order status. Only unpaid Paystack orders can be marked as paid.' 
        });
      }

      // Update order payment status
      order.paid = true;
      order.paymentInfo.status = 'paid';
      order.paymentInfo.transactionId = verificationResult.data.id.toString();
      order.paymentInfo.paymentReference = reference;
      order.paymentInfo.paidAt = new Date();

      const updatedOrder = await order.save();

      // Create transaction record for seller earnings
      const Transaction = mongoose.model('Transaction');
      const transaction = new Transaction({
        seller: order.seller._id,
        orderId: order._id,
        amount: order.totalAmount,
        type: 'order_payment',
        status: 'completed',
        description: `Payment for order #${order.order_id} (products only, excluding shipping fee)`,
        metadata: {
          itemTotal: order.totalAmount,
          processingFeePercent: 0,
          categoryName: order.items[0]?.productName || 'Mixed',
          categoryFee: 0,
          paymentReference: reference
        }
      });
      
      await transaction.save();
      
      // Update seller's balance
      await Seller.findByIdAndUpdate(
        order.seller._id,
        { $inc: { 'wallet.balance': order.totalAmount } }
      );

      // Create notifications
      const notificationData = {
        orderId: order._id,
        buyerId: order.buyer,
        sellerId: order.seller._id
      };
      
      agenda.schedule('in 5 seconds', 'send-order-notifications', notificationData);

      // Always send order confirmation email for paid Paystack order, regardless of notification status
      // This ensures the buyer gets their confirmation email that was skipped at order creation
      try {
        const Buyer = mongoose.model('Buyer');
        const buyer = await Buyer.findById(order.buyer);
        if (buyer) {
          console.log(`Sending order confirmation email to ${buyer.email} for paid Paystack order ${order.order_id} (reference verification)`);
          await exports.sendOrderConfirmationEmail(updatedOrder, buyer);
        }
      } catch (emailError) {
        console.error('Error sending order confirmation email for reference verified payment:', emailError);
        // Continue processing even if email fails
      }

      return res.status(200).json({ 
        message: 'Order marked as paid successfully', 
        order: updatedOrder,
        verificationDetails: verificationResult.data
      });
    }

    // If no order ID is provided, just return the verification result
    return res.status(200).json({
      message: 'Payment verification successful',
      verificationDetails: verificationResult.data
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
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

  // Handle successful charge event
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data;
    
    // If there's no metadata, just acknowledge the webhook
    if (!metadata) {
      return res.status(200).json({ message: 'Webhook received, but no metadata' });
    }

    try {
      // Check if this is a wallet top-up
      if (metadata.transactionType === 'wallet_topup' && metadata.buyerId) {
        return await handleWalletTopUp(event.data, res);
      }
      
      // Check if this is an order payment
      if (metadata.orderId) {
        const result = await handleOrderPayment(event.data, res);
        
        // After order payment is processed, check if there are other recent orders from the same buyer
        // that need notifications, and process them in a batch
        try {
          const Order = mongoose.model('Order');
          const order = await Order.findById(metadata.orderId);
          
          if (order) {
            // Schedule a batch notification job to check for other recent orders from this buyer
            const { agenda } = require('../config/agenda');
            await agenda.schedule('in 3 seconds', 'send-order-notifications', {
              buyerId: order.buyer.toString(),
              batchProcess: true
            });
            console.log('Scheduled batch notification check after payment for buyer:', order.buyer);
          }
        } catch (batchError) {
          console.error('Error scheduling batch notification after payment:', batchError);
          // Continue with normal response regardless of batch scheduling error
        }
        
        return result;
      }

      // If we can't determine the type, just acknowledge
      return res.status(200).json({ message: 'Webhook received, but transaction type unknown' });
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      // Still return 200 to acknowledge the webhook
      return res.status(200).json({ message: 'Error processing webhook, but acknowledging receipt' });
    }
  }

  // For other events, just acknowledge receipt
  return res.status(200).json({ message: 'Webhook received' });
};

// Helper function to handle order payments
async function handleOrderPayment(paymentData, res) {
  const { reference, metadata } = paymentData;
  const orderId = metadata.orderId;
  
  const order = await Order.findById(orderId).populate('seller');
  
  if (!order) {
    return res.status(200).json({ message: 'Order not found, but acknowledging webhook' });
  }

  // Check if order is already paid
  if (order.paid) {
    return res.status(200).json({ message: 'Order already marked as paid' });
  }

  // Update order payment status
  order.paid = true;
  order.paymentInfo.status = 'paid';
  order.paymentInfo.transactionId = paymentData.id.toString();
  order.paymentInfo.paymentReference = reference;
  order.paymentInfo.paidAt = new Date();

  // Add a flag to track if notifications have been sent
  order.notificationsSent = order.notificationsSent || false;
  const notificationsAlreadySent = order.notificationsSent;
  
  // Mark notifications as sent
  order.notificationsSent = true;
  
  const updatedOrder = await order.save();

  // Create transaction record for seller earnings
  const Transaction = mongoose.model('Transaction');
  const transaction = new Transaction({
    seller: order.seller._id,
    orderId: order._id,
    amount: order.totalAmount,
    type: 'order_payment',
    status: 'completed',
    description: `Payment for order #${order.order_id} (products only, excluding shipping fee)`,
    metadata: {
      itemTotal: order.totalAmount,
      processingFeePercent: 0,
      categoryName: order.items[0]?.productName || 'Mixed',
      categoryFee: 0,
      paymentReference: reference
    }
  });
  
  await transaction.save();
  
  // Update seller's balance
  await Seller.findByIdAndUpdate(
    order.seller._id,
    { $inc: { 'wallet.balance': order.totalAmount } }
  );

  // Only schedule notifications if they haven't been sent yet
  if (!notificationsAlreadySent) {
    console.log(`Scheduling order notifications for order ${order.order_id} after Paystack payment`);
    
    // Create notifications
    const notificationData = {
      orderId: order._id,
      buyerId: order.buyer,
      sellerId: order.seller._id
    };
    
    agenda.schedule('in 5 seconds', 'send-order-notifications', notificationData);
  } else {
    console.log(`Skipping notifications for order ${order.order_id} as they have already been sent`);
  }

  // Always send order confirmation email for paid Paystack order, regardless of notification status
  // This ensures the buyer gets their confirmation email that was skipped at order creation
  try {
    const Buyer = mongoose.model('Buyer');
    const buyer = await Buyer.findById(order.buyer);
    if (buyer) {
      console.log(`Sending order confirmation email to ${buyer.email} for paid Paystack order ${order.order_id} (webhook)`);
      await exports.sendOrderConfirmationEmail(updatedOrder, buyer);
    }
  } catch (emailError) {
    console.error('Error sending order confirmation email for Paystack webhook payment:', emailError);
    // Continue processing even if email fails
  }

  return res.status(200).json({ message: 'Order marked as paid via webhook' });
}

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
      email: 'orders@auqli.com',
      name: 'Auqli Orders'
    },
    subject: `Order Confirmation - #${order.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://auqli.com/logo.png" alt="Auqli Logo" style="max-width: 150px;">
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
          
          <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="https://auqli.com/account/orders/${order._id}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">View Order</a>
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
        status: 'pending'
      };
      
      // Also update the order status to indicate it has a refund
      order.orderStatus.hasRefund = true;
    }

    // Only attempt to cancel with Fez if order is paid and has tracking number
    if (order.paid && order.shipping.tracking.number) {
      try {
        // Get a fresh authentication token for Fez Delivery
        const authToken = await getFezAuthToken();
        console.log('Using fresh token for order cancellation:', authToken.substring(0, 10) + '...');
        
        // Cancel shipment with Fez Delivery
        const cancelResponse = await axios.delete(`${FEZ_API_URL}/order`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
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
        const adminEmails = admins.map(admin => admin.email).filter(Boolean);
        
        if (adminEmails.length > 0) {
          const adminEmail = {
            to: adminEmails,
            from: 'Auqli Refunds <support@auqli.com>',
            subject: `New Refund Request - Order #${order.order_id}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>New Refund Request</h2>
                <p>A new refund request has been created for a cancelled order.</p>
                <p><strong>Order Details:</strong></p>
                <ul>
                  <li>Order ID: ${order.order_id}</li>
                  <li>Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</li>
                  <li>Seller: ${order.seller.businessName}</li>
                  <li>Amount: ${order.totalAmount}</li>
                  <li>Payment Method: ${order.paymentInfo?.method || 'Unknown'}</li>
                  <li>Reason: ${reason || 'Order cancelled by seller'}</li>
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

    try {
      await Promise.all([
        sgMail.send(buyerEmail),
        sgMail.send(sellerEmail)
      ]);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Continue execution despite email error
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
        refundRequest: order.refundRequest
      }
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
      .populate('seller', 'email firstName lastName');
    
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
        
        // Refund the full order amount (do not deduct shipping fee)
        refundAmount = order.totalAmount;
        
        refundDetails = {
          originalAmount: order.totalAmount,
          refundAmount: refundAmount
        };
        
        console.log(`Processing refund for order ${order.order_id}:`, refundDetails);
        
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
        buyer.wallet.transactions.push({
          type: 'credit',
          amount: refundAmount,
          paymentReference: paymentReference,
          description: `Refund for cancelled order #${order.order_id}`,
          status: 'completed',
          createdAt: new Date()
        });
        
        // Save the buyer with updated wallet
        await buyer.save();
        
        console.log(`Refund processed successfully. Buyer wallet updated:`, {
          buyerId: buyer._id,
          newBalance: buyer.wallet.balance,
          refundAmount: refundAmount
        });
        
        // Also save the refund details in the order for reference
        order.refundRequest.refundAmount = refundAmount;
        order.refundRequest.paymentReference = paymentReference;
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
      emailHtml += `
        <p><strong>Refund Details:</strong></p>
        <ul>
          <li>Order Amount: ₦${refundDetails.originalAmount?.toLocaleString() || order.totalAmount.toLocaleString()}</li>
          <li>Refund Amount: ₦${refundAmount.toLocaleString()}</li>
        </ul>
        <p>The full order amount has been added to your Auqli wallet balance. You can use this balance for future purchases on our platform.</p>
      `;
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
            ? `Your refund of ₦${refundAmount.toLocaleString()} for order #${order.order_id} has been processed and added to your wallet.`
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
        'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB"
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


