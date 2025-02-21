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
  createBuyerNotification 
} = require('../controllers/notificationController');
const Category = require('../models/Category');



// Initialize Paystack
const paystackSecretKey = "sk_test_REDACTED";
const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${paystackSecretKey}`,
    'Content-Type': 'application/json'
  }
});

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

// Helper function to validate address format
const validateAddress = (address) => {
  const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'line1', 'city', 'state', 'country', 'zip'];
  const missingFields = requiredFields.filter(field => !address[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required address fields: ${missingFields.join(', ')}`);
  }
  return true;
};

// Helper function to validate parcel data
const validateParcel = (parcel) => {
  if (!parcel.weight) {
    throw new Error('Parcel weight is required');
  }

  // Validate weight is a positive number
  if (parcel.weight <= 0) {
    throw new Error('Parcel weight must be greater than 0');
  }

  return true;
};

// Helper function to validate item data
const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Items must be a non-empty array');
  }

  items.forEach((item, index) => {
    const requiredFields = ['name', 'description', 'quantity', 'weight', 'price'];
    const missingFields = requiredFields.filter(field => !item[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields for item at index ${index}: ${missingFields.join(', ')}`);
    }

    if (item.weight <= 0) {
      throw new Error(`Invalid weight for item at index ${index}`);
    }
    
    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for item at index ${index}`);
    }
  });

  return true;
};

// create an order
exports.createOrder = async (req, res) => {
  console.log('Starting createOrder with user:', {
    userId: req.user.id,
    userRole: req.user.role
  });

  // Verify user is a buyer
  if (req.user.role !== 'Buyer') {
    return res.status(403).json({
      message: 'Only buyers can create orders',
      currentRole: req.user.role
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items,
      pickup_addresses,
      delivery_address,
      parcel,
      paymentMethod,
      channel = 'marketplace'
    } = req.body;

    console.log('Starting order creation with items:', items);
    console.log('Pickup addresses:', pickup_addresses);

    // Validate delivery address and all pickup addresses
    validateAddress(delivery_address);
    if (pickup_addresses) {
      Object.values(pickup_addresses).forEach(addr => validateAddress(addr));
    }

    // Group items by seller and create orders
    const itemsBySeller = {};
    const orders = [];
    const shipments = [];

    // First, group items by seller and validate products
    for (const item of items) {
      console.log('Processing item:', item);

      const product = await Product.findById(item.productId)
        .populate('seller', 'warehouseAddress firstName lastName email phone');

      console.log('Found product:', product);

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const sellerId = product.seller._id.toString();
      console.log('Seller ID:', sellerId);

      if (!itemsBySeller[sellerId]) {
        // Get pickup address for this seller
        let pickup_address;
        if (pickup_addresses && pickup_addresses[sellerId]) {
          console.log('Using provided pickup address for seller:', sellerId);
          pickup_address = pickup_addresses[sellerId];
        } else {
          console.log('Using warehouse address for seller:', sellerId);
          pickup_address = {
            first_name: product.seller.firstName,
            last_name: product.seller.lastName,
            email: product.seller.email,
            phone: product.seller.phone,
            ...product.seller.warehouseAddress
          };
        }

        console.log('Final pickup address:', pickup_address);

        itemsBySeller[sellerId] = {
          items: [],
          seller: product.seller,
          pickup_address
        };
      }

      itemsBySeller[sellerId].items.push({
        product: product._id,
        productName: product.name,
        seller: sellerId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        description: item.description,
        weight: item.weight,
        status: 'pending',
        specifications: {
          color: item.specifications?.color,
          size: item.specifications?.size,
          material: item.specifications?.material
        }
      });
    }

    console.log('Items grouped by seller:', itemsBySeller);

    // Create shipments and orders for each seller
    for (const [sellerId, sellerData] of Object.entries(itemsBySeller)) {
      console.log('Creating shipment for seller:', sellerId);
      console.log('Seller data:', sellerData);

      // Calculate total weight for this seller's items
      const totalWeight = sellerData.items.reduce((sum, item) => {
        console.log('Calculating weight for item:', {
          name: item.name,
          weight: item.weight,
          quantity: item.quantity,
          itemTotalWeight: item.weight * item.quantity
        });
        return sum + (item.weight * item.quantity);
      }, 0);

      console.log('Total calculated weight for seller:', {
        sellerId,
        totalWeight,
        items: sellerData.items.length
      });

      // Prepare shipping data for Terminal Africa
      const shippingData = {
        pickup_address: sellerData.pickup_address,
        delivery_address,
        parcel: {
          weight: totalWeight, 
          weight_unit: 'kg',
          description: "Auqli Order Items",
          items: sellerData.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            weight: item.weight,
            weight_unit: 'kg',
            value: item.price,
            currency: 'NGN',
            type: 'parcel'
          }))
        },
        shipment_purpose: "commercial",
        metadata: {
          seller_id: sellerId,
          channel
        }
      };

      console.log('Prepared shipping data:', {
        sellerId,
        parcelWeight: shippingData.parcel.weight,
        itemsCount: shippingData.parcel.items.length,
        items: shippingData.parcel.items.map(item => ({
          name: item.name,
          weight: item.weight,
          quantity: item.quantity,
          totalWeight: item.weight * item.quantity
        }))
      });

      // Create shipment with Terminal Africa
      const shipmentResponse = await terminalAPI.post('/shipments/quick', shippingData);
      console.log('Terminal Africa response:', shipmentResponse.data);

      if (!shipmentResponse.data.status) {
        throw new Error(shipmentResponse.data.message || 'Failed to create shipment');
      }

      shipments.push(shipmentResponse.data.data);

      // Create order for this seller with safe carrier access
      const orderData = {
        buyer: req.user.id,
        seller: sellerId,
        items: sellerData.items.map(item => ({
          ...item,
          seller: sellerId,  // Add seller ID to each item
          specifications: {
            color: item.specifications?.color,
            size: item.specifications?.size,
            material: item.specifications?.material
          }
        })),
        delivery_address,
        pickup_address: sellerData.pickup_address,
        shipping: {
          method: 'Terminal Africa',
          carrier: {
            name: 'Terminal Africa',
            reference: shipmentResponse.data.data.rate_id
          },
          fee: {
            amount: shipmentResponse.data.data.shipment_cost || 0,
            currency: 'NGN'
          },
          rate_id: shipmentResponse.data.data.rate_id,
          shipment_id: shipmentResponse.data.data.shipment_id,
          tracking: {
            number: shipmentResponse.data.data.tracking_number,
            url: shipmentResponse.data.data.tracking_url,
            status: 'pending'
          }
        },
        paymentMethod,
        totalAmount: sellerData.items.reduce((total, item) => total + item.price * item.quantity, 0)
      };

      const order = new Order(orderData);
      const savedOrder = await order.save({ session });
      orders.push(savedOrder);

      // Create notification for seller
      await createNotification(
        savedOrder.seller,
        'new_order',
        {
          order_id: savedOrder.order_id,
          amount: savedOrder.totalAmount,
          items: savedOrder.items.length
        }
      );

      // After order is created, notify both parties
      await Promise.all([
        // Existing seller notification
        createNotification(
          savedOrder.seller,
          'new_order',
          {
            order_id: savedOrder.order_id,
            amount: savedOrder.totalAmount,
            items: savedOrder.items.length
          }
        ),
        // New buyer notification
        createBuyerNotification(
          savedOrder.buyer,
          'order_created',
          {
            orderId: savedOrder._id,
            order_id: savedOrder.order_id,
            totalAmount: savedOrder.totalAmount,
            items: savedOrder.items.map(item => ({
              name: item.productName,
              quantity: item.quantity
            })),
            sellerName: savedOrder.seller.businessName || 'Seller'
          }
        )
      ]);
    }

    // Add this code after orders are created but before final response
    for (const [sellerId, sellerData] of Object.entries(itemsBySeller)) {
      try {
        console.log('Processing seller-buyer relationship for:', {
          sellerId,
          buyerId: req.user.id
        });

        const seller = await Seller.findById(sellerId);
        const buyer = await Buyer.findById(req.user.id);

        console.log('Found seller:', {
          sellerId: seller?._id,
          sellerEmail: seller?.email,
          exists: !!seller
        });

        console.log('Found buyer:', {
          buyerId: buyer?._id,
          buyerEmail: buyer?.email,
          exists: !!buyer
        });

        if (!seller || !buyer) {
          console.error('Missing user data:', {
            sellerExists: !!seller,
            buyerExists: !!buyer,
            requestedSellerId: sellerId,
            requestedBuyerId: req.user.id
          });
          throw new Error(`Seller or Buyer not found - Seller: ${!!seller}, Buyer: ${!!buyer}`);
        }

        // Check if buyer already exists in seller's followers
        const isFollowing = seller.followers?.some(
          follower => follower.buyerId?.toString() === buyer._id.toString()
        );

        console.log('Follower status:', {
          isFollowing,
          followersCount: seller.followers?.length || 0
        });

        if (!isFollowing) {
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

          console.log('Adding new follower with address:', mainAddress);

          // Add buyer to seller's followers
          seller.followers.push({
            buyerId: buyer._id,
            firstName: buyer.firstName,
            lastName: buyer.lastName,
            email: buyer.email,
            followDate: new Date(),
            totalOrders: 1,
            mainAddress
          });

          // Add to buyer's activity feed
          buyer.activityFeed.push({
            type: 'follow',
            content: `Started following ${seller.storeName || seller.businessName}`,
            reference: seller._id,
            referenceModel: 'Seller',
            createdAt: new Date()
          });

          await Promise.all([seller.save(), buyer.save()]);
        } else {
          // Update existing follower's order count
          const followerIndex = seller.followers.findIndex(
            f => f.buyerId?.toString() === buyer._id.toString()
          );
          if (followerIndex !== -1) {
            seller.followers[followerIndex].totalOrders += 1;
            await seller.save();
          }
        }
      } catch (error) {
        console.error('Error processing seller-buyer relationship:', {
          error: error.message,
          sellerId,
          buyerId: req.user.id,
          stack: error.stack
        });
        throw error; // Re-throw to be caught by the main try-catch
      }
    }

    await session.commitTransaction();

    // Send emails for each order
    for (const order of orders) {
      const populatedOrder = await Order.findById(order._id)
        .populate('buyer', 'email firstName lastName')
        .populate('seller', 'email firstName lastName businessName')
        .populate('items.product', 'name');

      // Buyer email
      const buyerEmail = {
        to: populatedOrder.buyer.email,
        from: 'Auqli Orders <joseph@auqli.com>',
        subject: 'Order Confirmation - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Confirmation</h2>
            <p>Dear ${populatedOrder.buyer.firstName},</p>
            <p>Thank you for your order! Here are your order details:</p>
            <p><strong>Order ID:</strong> ${populatedOrder.order_id}</p>
            <p><strong>Items:</strong></p>
            <ul>
              ${populatedOrder.items.map(item => `
                <li>${item.product.name} x ${item.quantity} - ₦${item.price.toLocaleString()}</li>
              `).join('')}
            </ul>
            <p><strong>Total Amount:</strong> ₦${populatedOrder.totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Address:</strong><br>
              ${populatedOrder.delivery_address.line1}<br>
              ${populatedOrder.delivery_address.line2 || ''}<br>
              ${populatedOrder.delivery_address.city}, ${populatedOrder.delivery_address.state}<br>
              ${populatedOrder.delivery_address.country}
            </p>
            <p>We'll notify you once your order is confirmed and ready for shipping.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      // Seller email
      const sellerEmail = {
        to: populatedOrder.seller.email,
        from: 'Auqli Orders <joseph@auqli.com>',
        subject: 'New Order Received - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Order Received</h2>
            <p>Dear ${populatedOrder.seller.firstName},</p>
            <p>You have received a new order:</p>
            <p><strong>Order ID:</strong> ${populatedOrder.order_id}</p>
            <p><strong>Items:</strong></p>
            <ul>
              ${populatedOrder.items.map(item => `
                <li>${item.product.name} x ${item.quantity} - ₦${item.price.toLocaleString()}</li>
              `).join('')}
            </ul>
            <p><strong>Total Amount:</strong> ₦${populatedOrder.totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Details:</strong><br>
              ${populatedOrder.delivery_address.first_name} ${populatedOrder.delivery_address.last_name}<br>
              ${populatedOrder.delivery_address.line1}<br>
              ${populatedOrder.delivery_address.line2 || ''}<br>
              ${populatedOrder.delivery_address.city}, ${populatedOrder.delivery_address.state}<br>
              ${populatedOrder.delivery_address.country}
            </p>
            <p>Please prepare the items for shipping.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      await Promise.all([
        sgMail.send(buyerEmail),
        sgMail.send(sellerEmail)
      ]);
    }

    res.status(201).json({
      message: 'Orders created successfully',
      orders: orders.map(order => ({
        orderId: order._id,
        seller: order.seller,
        shipment_id: order.shipping.shipment_id,
        items: order.items
      })),
      shipments: shipments.map(shipment => ({
        shipment_id: shipment.shipment_id,
        tracking_number: shipment.tracking_number,
        carrier: 'Terminal Africa'
      }))
    });

  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    await session.abortTransaction();
    res.status(error.response?.status || 500).json({
      message: 'Failed to create order',
      error: error.message,
      details: error.response?.data
    });
  } finally {
    session.endSession();
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

// Mark multiple orders as paid
exports.markAsPaid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orders } = req.body;
    console.log('Starting markAsPaid process for orders:', orders);

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: 'Orders array is required' });
    }

    const processedOrders = [];
    let totalAmount = 0;
    let totalShippingFee = 0;

    for (const orderData of orders) {
      const { 
        orderId, 
        amount, 
        carrier_reference, 
        shipping_fee, 
        carrier_name, 
        rate_id,
        estimatedDeliveryDate,
        estimatedPickupDate
      } = orderData;

      console.log('Processing order:', orderId);

      const order = await Order.findById(orderId);
      if (!order) {
        console.log('Order not found:', orderId);
        throw new Error(`Order not found: ${orderId}`);
      }

      console.log('Found order:', {
        orderId: order._id,
        items: order.items,
        totalAmount: order.totalAmount
      });

      // Verify amount matches order total
      if (amount !== order.totalAmount) {
        console.log('Amount mismatch:', { expected: order.totalAmount, received: amount });
        throw new Error(`Payment amount does not match order total for order ${orderId}`);
      }

      // Validate dates
      if (!estimatedDeliveryDate || !estimatedPickupDate) {
        throw new Error(`Estimated delivery and pickup dates are required for order ${orderId}`);
      }

      // Validate that pickup date is before delivery date
      if (new Date(estimatedPickupDate) >= new Date(estimatedDeliveryDate)) {
        throw new Error(`Estimated pickup date must be before delivery date for order ${orderId}`);
      }

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
          { new: true, session }
        );

        // // Update seller's wallet balance
        // await Seller.findByIdAndUpdate(
        //   item.seller,
        //   {
        //     $inc: { 'walletBalance': item.price * item.quantity }
        //   },
        //   { session }
        // );

        console.log('Product after update:', {
          productId: updateResult._id,
          newStock: updateResult.stock,
          newInventoryQuantity: updateResult.inventory.quantity,
          newSoldCount: updateResult.stats.soldCount,
          updateSuccessful: !!updateResult
        });
      }

      // Ensure tracking object exists with required fields
      const tracking = {
        status: 'pending',
        history: [],
        carrier: carrier_name,
        ...(order.shipping.tracking || {}) // Preserve existing tracking data if any
      };

      // Update shipping information
      order.shipping = {
        ...order.shipping,
        method: order.shipping.method || 'standard',
        carrier: {
          name: carrier_name,
          reference: carrier_reference
        },
        fee: {
          amount: shipping_fee,
          currency: 'NGN'
        },
        rate_id: rate_id,
        estimatedDeliveryDate: new Date(estimatedDeliveryDate),
        estimatedPickupDate: estimatedPickupDate,
        tracking: tracking,
        documents: order.shipping.documents || {  // Add default documents object
          shippingLabel: null,
          commercialInvoice: null
        }
      };

      // Ensure all required fields are present
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            paid: true,
            paymentInfo: {
              ...order.paymentInfo,
              status: 'paid',
              paidAt: new Date()
            },
            shipping: order.shipping
          }
        },
        { new: true, runValidators: true, session }
      );

      processedOrders.push(updatedOrder);
      totalAmount += amount;
      totalShippingFee += shipping_fee;

      // Create notification for seller
      await createNotification(order.seller, 'order_paid', {
        orderId: order._id,
        order_id: order.order_id,
        amount: order.totalAmount,
        paymentMethod: order.paymentInfo.method
      });

      // After order is marked as paid, notify both parties
      await Promise.all([
        // Existing seller notification
        createNotification(
          order.seller,
          'order_paid',
          {
            order_id: order.order_id,
            amount: order.totalAmount,
            paymentMethod: order.paymentInfo.method
          }
        ),
        // New buyer notification
        createBuyerNotification(
          order.buyer,
          'order_paid',
          {
            orderId: order._id,
            order_id: order.order_id,
            amount: order.totalAmount,
            paymentMethod: order.paymentInfo.method,
            sellerName: order.seller.businessName || 'Seller'
          }
        )
      ]);
    }

    await session.commitTransaction();

    // Send emails for each order
    for (const order of processedOrders) {
      const populatedOrder = await Order.findById(order._id)
        .populate('buyer', 'email firstName lastName')
        .populate('seller', 'email firstName lastName businessName')
        .populate('items.product', 'name');

      // Buyer payment confirmation email
      const buyerEmail = {
        to: populatedOrder.buyer.email,
        from: 'Auqli Payments <joseph@auqli.com>',
        subject: 'Payment Confirmed - Auqli Order',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Confirmed</h2>
            <p>Dear ${populatedOrder.buyer.firstName},</p>
            <p>Your payment has been confirmed for order #${populatedOrder.order_id}.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              ${populatedOrder.items.map(item => `
                <li>${item.product.name} x ${item.quantity} - ₦${item.price.toLocaleString()}</li>
              `).join('')}
            </ul>
            <p><strong>Total Amount Paid:</strong> ₦${populatedOrder.totalAmount.toLocaleString()}</p>
            <p><strong>Shipping Fee:</strong> ₦${populatedOrder.shipping.fee.amount.toLocaleString()}</p>
            <p>We'll notify you once your order is ready for shipping.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      // Seller payment notification email
      const sellerEmail = {
        to: populatedOrder.seller.email,
        from: 'Auqli Payments <joseph@auqli.com>',
        subject: 'Payment Received - Auqli Order',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Received</h2>
            <p>Dear ${populatedOrder.seller.firstName},</p>
            <p>Payment has been received for order #${populatedOrder.order_id}.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              ${populatedOrder.items.map(item => `
                <li>${item.product.name} x ${item.quantity} - ₦${item.price.toLocaleString()}</li>
              `).join('')}
            </ul>
            <p><strong>Total Amount:</strong> ₦${populatedOrder.totalAmount.toLocaleString()}</p>
            <p>Please prepare the order for shipping.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      await Promise.all([
        sgMail.send(buyerEmail),
        sgMail.send(sellerEmail)
      ]);
    }

    console.log('Orders marked as paid successfully');

    res.json({
      message: 'Orders marked as paid successfully',
      totalAmount,
      totalShippingFee,
      orders: processedOrders.map(order => ({
        _id: order._id,
        paid: order.paid,
        paymentInfo: order.paymentInfo,
        shipping: {
          carrier: order.shipping.carrier,
          fee: order.shipping.fee,
          rate_id: order.shipping.rate_id,
          tracking: order.shipping.tracking
        }
      }))
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in markAsPaid:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Failed to mark orders as paid',
      error: error.message
    });
  } finally {
    session.endSession();
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

  try {
    const orders = await Order.find({ buyer: buyerId }).sort({ createdAt: -1 })
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for buyer', error: error.message });
  }
};

// Get all orders for a seller
exports.getOrdersForSeller = async (req, res) => {
  const { sellerId } = req.params;

  try {
    const orders = await Order.find({ seller: sellerId }).sort({ createdAt: -1 })
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve orders for seller', error: error.message });
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
      .populate('items.product', 'name category images discount') // Added images and discount
      .populate('items.seller', 'businessName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate payment breakdown
    let paymentBreakdown = null;
    if (order.paid || !order.isOpen) {  // Calculate if paid or closed
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
          closedReason: order.closedReason
        },
        paymentBreakdown  // Add the payment breakdown here
      },
      buyer: order.buyer,
      seller: order.seller,
      items: order.items.map(item => ({
        product: {
          _id: item.product._id,
          name: item.product.name,
          category: item.product.category,
          images: item.product.images, // Include product images
          discount: item.product.discount, // Include product discount
          seller: item.product.seller
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
      discount: order.discount ? {
        code: order.discount.code,
        amount: order.discount.amount
      } : null,
      notes: order.notes,
      timeline: timeline.sort((a, b) => b.timestamp - a.timestamp)
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      message: 'Failed to retrieve order details',
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
          from: 'Auqli Shipping <joseph@auqli.com>',
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
          from: 'Auqli Shipping <joseph@auqli.com>',
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
        from: 'Auqli Orders <joseph@auqli.com>',
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
    
    // Find order and check permissions
    const order = await Order.findById(orderId)
      .populate('seller', 'email firstName lastName storeName')
      .populate('buyer', 'email firstName lastName');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // // Check if user is authorized (either seller or admin)
    // if (req.user.role !== 'admin' && order.seller._id.toString() !== req.user.id) {
    //   return res.status(403).json({ message: 'Unauthorized to cancel this shipment' });
    // }

    // Check if shipment can be cancelled (only before pickup)
    const allowedStatuses = ['pending', 'confirmed', 'pickup_arranged'];
    if (!allowedStatuses.includes(order.shipping.tracking.status)) {
      return res.status(400).json({ 
        message: 'Shipment cannot be cancelled at this stage' 
      });
    }

    // Cancel shipment with Terminal Africa
    const cancelResponse = await terminalAPI.post('/shipments/cancel', {
      shipment_id: order.shipping.shipment_id
    });

    if (!cancelResponse.data.status) {
      throw new Error(cancelResponse.data.message || 'Failed to cancel shipment');
    }

    // Create new tracking entry
    const newTrackingEntry = {
      status: 'cancelled',
      description: `Shipment cancelled by ${req.user.role === 'admin' ? 'admin' : 'seller'}`,
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

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      shippingUpdate,
      { new: true }
    ).populate('seller', 'email firstName lastName storeName')
     .populate('buyer', 'email firstName lastName');

    // Send cancellation emails
    const buyerEmail = {
      to: updatedOrder.buyer.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Shipment Cancellation Notice - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Shipment Cancellation Notice</h2>
          <p>Dear ${updatedOrder.buyer.firstName},</p>
          <p>The shipment for your order #${updatedOrder._id} has been cancelled.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${updatedOrder._id}</li>
            <li>Seller: ${updatedOrder.seller.storeName}</li>
            <li>Cancellation Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    const sellerEmail = {
      to: updatedOrder.seller.email,
      from: 'Auqli Shipping <joseph@auqli.com>',
      subject: 'Shipment Cancellation Confirmation - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Shipment Cancellation Confirmation</h2>
          <p>Dear ${updatedOrder.seller.firstName},</p>
          <p>The shipment for order #${updatedOrder._id} has been successfully cancelled.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${updatedOrder._id}</li>
            <li>Buyer: ${updatedOrder.buyer.firstName} ${updatedOrder.buyer.lastName}</li>
            <li>Cancellation Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>If you need to arrange a new shipment, please do so through your seller dashboard.</p>
        </div>
      `
    };

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
    console.error('Cancel shipment error:', error);
    res.status(500).json({
      message: 'Failed to cancel shipment',
      error: error.message
    });
  }
};


