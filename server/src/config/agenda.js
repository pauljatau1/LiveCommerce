const Agenda = require('agenda');
const mongoose = require('mongoose');
const axios = require('axios');

// Verify SendGrid API key at startup
const verifySendGridConfig = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('⚠️ SENDGRID_API_KEY is not set in environment variables!');
    return false;
  }
  
  if (apiKey.startsWith('SG.')) {
    console.log('✅ SendGrid API key appears to be properly formatted');
    return true;
  } else {
    console.error('⚠️ SendGrid API key does not appear to be properly formatted. Should start with "SG."');
    return false;
  }
};

// Check SendGrid configuration at startup
verifySendGridConfig();

const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: 'agendaJobs'
  }
});

// Define the job processor for order closure
agenda.define('closeOrder', async (job) => {
  try {
    console.log('Starting closeOrder job with data:', job.attrs.data);
    const { orderId } = job.attrs.data;
    
    if (!orderId) {
      console.error('No orderId provided for closeOrder job');
      return;
    }
    
    console.log(`Processing auto-close for order: ${orderId}`);
    
    const Order = mongoose.model('Order');
    const Transaction = mongoose.model('Transaction');
    const Category = mongoose.model('Category');
    const Seller = mongoose.model('Seller');
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // First, verify if the order is still open and needs processing
    const orderCheck = await Order.findById(orderId);
    if (!orderCheck) {
      console.error(`Order not found with ID: ${orderId}`);
      return;
    }

    if (!orderCheck.isOpen) {
      console.log(`Order ${orderCheck.order_id} is already closed, skipping auto-close`);
      return;
    }

    // For non-COD orders, check if it's paid
    const isCOD = orderCheck.paymentInfo?.isCashOnDelivery;
    if (!orderCheck.paid && !isCOD) {
      console.log(`Order ${orderCheck.order_id} is not paid and not COD, skipping auto-close`);
      return;
    }
    
    console.log(`Processing auto-close for order ${orderCheck.order_id}. Will release payment to seller upon closing.`, {
      paymentMethod: orderCheck.paymentInfo?.method,
      isCashOnDelivery: isCOD,
      isPaid: orderCheck.paid
    });

    // Now load the full order data with populated references
    const order = await Order.findById(orderId)
      .populate('buyer', 'email firstName')
      .populate('seller', 'email firstName businessName walletBalance')
      .populate('items.product', 'name category');

    if (!order) {
      console.error(`Error retrieving populated order with ID: ${orderId}`);
      return;
    }
    
    // Verify shipping status is delivered
    const shippingStatus = order.shipping?.tracking?.status?.toLowerCase();
    if (shippingStatus !== 'delivered') {
      console.log(`Order ${order.order_id} shipping status is ${shippingStatus}, not ready for auto-close`);
      // Reschedule the job for later if the shipping status isn't delivered yet
      job.schedule('in 5 minutes');
      await job.save();
      console.log(`Rescheduled auto-close job for order ${order.order_id} in 5 minutes`);
      return;
    }
    
    console.log(`Found order to close: ${order.order_id}`, {
      isOpen: order.isOpen,
      paid: order.paid,
      itemCount: order.items.length,
      shippingStatus
    });

    // Calculate fees and amounts
    console.log('Fetching categories for fee calculation');
    const categories = await Category.find({});
    const categoryFeeMap = new Map(
      categories.map(cat => [cat.name.toLowerCase(), cat.platformFee])
    );
    
    console.log(`Found ${categories.length} categories for fee calculation`);

    let totalPlatformFee = 0;
    let totalAmount = 0;

    order.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      const categoryName = typeof item.product?.category === 'string' 
        ? item.product.category.toLowerCase() 
        : null;
      
      const categoryFee = categoryFeeMap.get(categoryName) || 0;
      const itemPlatformFee = itemTotal * (categoryFee / 100);
      totalPlatformFee += itemPlatformFee;
      
      console.log(`Calculated fees for item: ${item.productName}`, {
        category: categoryName,
        categoryFee: `${categoryFee}%`,
        itemTotal,
        platformFee: itemPlatformFee
      });
    });

    // Calculate payment processing fee (1.5%)
    const paymentProcessingFee = totalAmount * 0.015;
    const totalDeductions = totalPlatformFee + paymentProcessingFee;
    const sellerAmount = totalAmount - totalDeductions;
    
    console.log('Final calculations for order:', {
      orderId: order.order_id,
      totalAmount,
      platformFee: totalPlatformFee,
      processingFee: paymentProcessingFee,
      totalDeductions,
      sellerAmount
    });

    // Update seller's wallet and close order
    console.log(`Updating seller wallet and closing order ${order.order_id}`);
    let updatedSeller;
    let updatedOrder;
    
    try {
      // Use a session to ensure transaction atomicity
      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        // Update seller's wallet
        updatedSeller = await Seller.findByIdAndUpdate(
          order.seller._id,
          { $inc: { walletBalance: sellerAmount } },
          { new: true, session }
        );
        
        if (!updatedSeller) {
          throw new Error(`Failed to update seller ${order.seller._id}`);
        }
        
        console.log(`Seller wallet updated:`, {
          sellerId: updatedSeller._id,
          previousBalance: order.seller.walletBalance || 0,
          newBalance: updatedSeller.walletBalance,
          increment: sellerAmount
        });
        
        // Update order status
        updatedOrder = await Order.findByIdAndUpdate(
          order._id,
          {
            isOpen: false,
            closedAt: new Date(),
            closedBy: 'auto',
            closedReason: 'Auto-closed after delivery with no reported issues'
          },
          { new: true, session }
        );
        
        if (!updatedOrder) {
          throw new Error(`Failed to update order ${order._id}`);
        }
        
        console.log(`Order closed:`, {
          orderId: updatedOrder._id,
          isOpen: updatedOrder.isOpen,
          closedBy: updatedOrder.closedBy,
          closedAt: updatedOrder.closedAt
        });
        
        // Create transaction records directly with the session
        const txnPromises = [];
        
        // Add payment method info to order payment transaction
        txnPromises.push(
          new Transaction({
            seller: order.seller._id,
            type: 'order_payment',
            amount: totalAmount,
            orderId: order._id,
            description: `Payment for order #${order.order_id}${order.paymentInfo?.isCashOnDelivery ? ' (Cash on Delivery)' : order.paymentInfo?.method ? ` (${order.paymentInfo.method})` : ''}`,
            metadata: {
              paymentMethod: order.paymentInfo?.method || 'unknown',
              isCashOnDelivery: order.paymentInfo?.isCashOnDelivery || false
            },
            status: 'completed'
          }).save({ session })
        );
        
        console.log(`Creating transaction records for order ${order.order_id}`, {
          paymentMethod: order.paymentInfo?.method,
          isCashOnDelivery: order.paymentInfo?.isCashOnDelivery,
          totalAmount: totalAmount,
          sellerAmount: sellerAmount
        });
        
        // 2. Platform fee transactions for each item
        order.items.forEach(item => {
          const itemTotal = item.price * item.quantity;
          const categoryName = typeof item.product?.category === 'string' 
            ? item.product.category.toLowerCase() 
            : null;
          const categoryFee = categoryFeeMap.get(categoryName) || 0;
          const itemPlatformFee = itemTotal * (categoryFee / 100);

          if (itemPlatformFee > 0) {
            txnPromises.push(
              new Transaction({
                seller: order.seller._id,
                type: 'platform_fee',
                amount: itemPlatformFee,
                orderId: order._id,
                description: `Platform fee for ${item.productName} in order #${order.order_id}`,
                metadata: {
                  categoryFee: categoryFee,
                  categoryName: categoryName,
                  itemTotal: itemTotal
                },
                status: 'completed'
              }).save({ session })
            );
          }
        });
        
        // 3. Processing fee transaction
        txnPromises.push(
          new Transaction({
            seller: order.seller._id,
            type: 'processing_fee',
            amount: paymentProcessingFee,
            orderId: order._id,
            description: `Payment processing fee for order #${order.order_id}`,
            metadata: {
              processingFeePercent: 1.5,
              itemTotal: totalAmount
            },
            status: 'completed'
          }).save({ session })
        );
        
        // Wait for all transaction saves to complete
        await Promise.all(txnPromises);
        console.log(`Created and saved ${txnPromises.length} transaction records within session`);
      });
      
      await session.endSession();
      
      console.log(`Successfully closed order ${order.order_id} and updated seller wallet`, {
        newWalletBalance: updatedSeller.walletBalance
      });
    } catch (updateError) {
      console.error('Error updating seller wallet or closing order:', updateError);
      // Check if order is still open and reschedule job
      const retryCheck = await Order.findById(orderId);
      if (retryCheck && retryCheck.isOpen) {
        job.schedule('in 10 minutes');
        await job.save();
        console.log(`Rescheduled auto-close job for order ${order.order_id} after error`);
      }
      return; // Exit early without sending emails
    }

    // Verify that the order was actually closed
    const verifyOrder = await Order.findById(orderId);
    if (verifyOrder && verifyOrder.isOpen) {
      console.error(`Order ${order.order_id} is still open after close attempt. Forcing update.`);
      
      try {
        // Force direct update as last resort
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              isOpen: false,
              closedAt: new Date(),
              closedBy: 'auto',
              closedReason: 'Auto-closed after delivery (forced update)'
            }
          }
        );
        console.log(`Forced order closure for ${order.order_id}`);
      } catch (forceError) {
        console.error('Error forcing order closure:', forceError);
      }
    }

    // Send closure notification emails
    console.log(`Sending closure notification emails for order ${order.order_id}`);
    const buyerClosureEmail = {
      to: order.buyer.email,
      from: 'Auqli Orders <support@auqli.com>',
      subject: 'Order Closed Successfully - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Closed Successfully</h2>
          <p>Dear ${order.buyer.firstName},</p>
          <p>Your order #${order.order_id} has been automatically closed as no issues were reported after delivery.</p>
          <p>Thank you for shopping with us!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    const sellerClosureEmail = {
      to: order.seller.email,
      from: 'Auqli Orders <support@auqli.com>',
      subject: 'Order Closed and Payment Released - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Order Closed and Payment Released</h2>
          <p>Dear ${order.seller.firstName},</p>
          <p>Order #${order.order_id} has been automatically closed and payment has been released to your wallet.</p>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li>Payment Method: ${order.paymentInfo?.isCashOnDelivery ? 'Cash on Delivery' : (order.paymentInfo?.method || 'Standard Payment')}</li>
            <li>Total Order Amount: ₦${totalAmount.toLocaleString()}</li>
            <li style="margin-top: 10px;"><strong>Platform Fees:</strong> ₦${totalPlatformFee.toLocaleString()}</li>
            <li>Payment Processing Fee (1.5%): ₦${paymentProcessingFee.toLocaleString()}</li>
            <li>Total Deductions: ₦${totalDeductions.toLocaleString()}</li>
            <li style="margin-top: 10px; font-weight: bold;">Amount Released: ₦${sellerAmount.toLocaleString()}</li>
            
          </ul>
          <p>Thank you for selling with Auqli!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    };

    try {
      await Promise.all([
        sgMail.send(buyerClosureEmail),
        sgMail.send(sellerClosureEmail)
      ]);
      console.log(`Closure notification emails sent successfully for order ${order.order_id}`);
    } catch (emailError) {
      console.error('Error sending closure notification emails:', emailError);
      if (emailError.response) {
        console.error('SendGrid response:', emailError.response.body);
      }
    }
    
    console.log(`Successfully completed closeOrder job for order ${order.order_id}`);
  } catch (error) {
    console.error('Error in closeOrder job:', error);
  }
});

// Define job for sending order notifications
agenda.define('send-order-notifications', async (job) => {
  try {
    console.log('Starting send-order-notifications job:', job.attrs.data);
    
    const { orderId, buyerId, sellerId, batchProcess = false } = job.attrs.data;
    const notificationController = require('../controllers/notificationController');

    // Process batch notifications if this is a batch job
    if (batchProcess) {
      console.log('Processing batch notifications for buyer:', buyerId);
      
      // Check if there's already a job in progress for this buyer
      const runningJobs = await agenda.jobs({
        name: 'send-order-notifications',
        'data.buyerId': buyerId,
        'data.batchProcess': true,
        $or: [
          { lockedAt: { $ne: null } },
          { nextRunAt: { $lt: new Date() } }
        ]
      });
      
      // If there are already running jobs for this buyer (more than this one), skip
      if (runningJobs.length > 1) {
        console.log(`Skipping duplicate batch notification job for buyer: ${buyerId}. Already ${runningJobs.length} jobs in progress.`);
        return;
      }
      
      await notificationController.processBatchOrderNotifications(buyerId);
      return;
    }
    
    // Fetch the necessary data
    console.log('Fetching order, buyer, and seller data...', {
      orderId: orderId?.toString(),
      buyerId,
      sellerId
    });

    const Order = mongoose.model('Order');
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    const Message = mongoose.model('Message');
    const Conversation = mongoose.model('Conversation');
    
    let order, buyer, seller;
    try {
      order = await Order.findById(orderId)
        .populate('items.product', 'name images price')
        .populate('shipping')
        .populate('delivery_address');
      console.log('Order fetch result:', order ? 'Found' : 'Not found');
      
      // Skip if notifications were already sent for this order
      if (order && order.notificationsSent) {
        console.log(`Skipping notifications for order ${order.order_id} as they were already sent`);
        return;
      }
    } catch (err) {
      console.error('Error fetching order:', err);
    }

    try {
      buyer = await Buyer.findById(buyerId);
      console.log('Buyer fetch result:', buyer ? 'Found' : 'Not found');
    } catch (err) {
      console.error('Error fetching buyer:', err);
    }

    try {
      seller = await Seller.findById(sellerId);
      console.log('Seller fetch result:', seller ? 'Found' : 'Not found');
    } catch (err) {
      console.error('Error fetching seller:', err);
    }
    
    console.log('Data fetch results:', {
      orderFound: !!order,
      buyerFound: !!buyer,
      sellerFound: !!seller,
      orderDetails: order ? {
        id: order._id.toString(),
        order_id: order.order_id,
        items: order.items.length
      } : null
    });
    
    if (!order || !buyer || !seller) {
      console.error('Missing data for order notifications:', { orderId, buyerId, sellerId });
      return;
    }

    // Find or create conversation
    console.log('Finding or creating conversation...');
    let conversation = await Conversation.findOne({
      'participants': {
        $all: [
          { $elemMatch: { id: buyerId, model: 'Buyer' } },
          { $elemMatch: { id: sellerId, model: 'Seller' } }
        ]
      }
    });

    if (!conversation) {
      console.log('Creating new conversation...');
      conversation = new Conversation({
        participants: [
          { id: buyerId, model: 'Buyer' },
          { id: sellerId, model: 'Seller' }
        ]
      });
      await conversation.save();
      console.log('New conversation created:', conversation._id.toString());
    } else {
      console.log('Found existing conversation:', conversation._id.toString());
    }

    // Format order items for the message
    console.log('Formatting order items...');
    const formattedItems = order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      image: item.product.images[0]?.url || ''
    }));

    // Create the order message
    console.log('Creating order message...');
    const message = new Message({
      conversation: conversation._id,
      sender: { id: sellerId, model: 'Seller' },
      recipient: { id: buyerId, model: 'Buyer' },
      content: `Thank you for your order #${order.order_id}. We'll process it right away!`,
      messageType: 'order',
      order: {
        id: order._id,
        items: formattedItems,
        shippingFee: order.shipping?.fee?.amount || 0,
        totalAmount: order.totalAmount,
        tracking: {
          number: order.shipping?.tracking?.number,
          url: order.shipping?.tracking?.url,
          carrier: order.shipping?.carrier?.name,
          status: order.shipping?.tracking?.status
        },
        delivery_address: {
          first_name: order.delivery_address?.first_name,
          last_name: order.delivery_address?.last_name,
          email: order.delivery_address?.email,
          phone: order.delivery_address?.phone,
          line1: order.delivery_address?.line1,
          line2: order.delivery_address?.line2,
          city: order.delivery_address?.city,
          state: order.delivery_address?.state,
          country: order.delivery_address?.country,
          zip: order.delivery_address?.zip
        },
        status: order.status
      }
    });

    await message.save();
    console.log('Order message saved:', message._id.toString());

    // Update conversation
    console.log('Updating conversation...');
    conversation.lastMessage = {
      content: `Thank you for your order #${order.order_id}. We'll process it right away!`,
      sender: { id: sellerId, model: 'Seller' },
      messageType: 'order',
      createdAt: message.createdAt
    };

    // Increment unread count for buyer
    const buyerKey = buyerId.toString();
    const currentCount = conversation.unreadCount.get(buyerKey) || 0;
    conversation.unreadCount.set(buyerKey, currentCount + 1);

    await conversation.save();
    console.log('Conversation updated successfully');
    
    // Send notifications and emails
    console.log('Sending notifications...');
    await notificationController.handleOrderCreationNotifications(order, buyer, seller);
    
    // Mark order as having had notifications sent
    console.log(`Marking order ${order.order_id} as having had notifications sent`);
    await Order.findByIdAndUpdate(orderId, { notificationsSent: true });
    
    console.log('Order notifications and message sent successfully');
  } catch (error) {
    console.error('Error in send-order-notifications job:', error);
  }
});

// Add auction status update job
agenda.define('update-auction-status', async (job) => {
  try {
    const { productId, newStatus } = job.attrs.data;
    const Product = mongoose.model('Product');

    const product = await Product.findById(productId);
    if (!product || product.status !== 'offline_auction') return;

    product.auction.status = newStatus;
    await product.save();

    // If starting the auction, notify followers
    if (newStatus === 'ongoing') {
      const Seller = mongoose.model('Seller');
      const seller = await Seller.findById(product.seller).populate('followers.buyerId', 'email firstName');
      
      if (seller && seller.followers.length > 0) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const notifications = seller.followers.map(follower => ({
          to: follower.buyerId.email,
          from: 'Auqli Auctions <support@auqli.com>',
          subject: 'New Auction Started! - Auqli',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>New Auction Started!</h2>
              <p>Dear ${follower.buyerId.firstName},</p>
              <p>A new auction has started for "${product.name}" by ${seller.businessName}.</p>
              <p>Starting bid: $${product.auction.minBid}</p>
              <p>Don't miss out on this opportunity!</p>
              <p><a href="${process.env.FRONTEND_URL}/products/${product._id}">View Auction</a></p>
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        }));

        await sgMail.send(notifications);
      }
    }
    
    // If ending the auction, check for a winner and create an order
    if (newStatus === 'ended') {
      console.log('Auction ended via scheduled job:', productId);
      
      // End the auction through the product method to ensure winner is set
      if (product.auction.status !== 'ended') {
        // Call the product's endAuction method - this will set the winner if there is one
        try {
          const updatedProduct = await Product.findById(productId);
          if (updatedProduct && updatedProduct.auction.status !== 'ended') {
            await updatedProduct.endAuction();
            console.log('Called endAuction method for product:', productId);
          }
        } catch (endError) {
          console.error('Error calling endAuction method:', endError);
        }
      }
      
      // Now schedule the end-auction job to handle notifications and order creation
      try {
        await job.agenda.now('end-auction', { productId });
        console.log('Scheduled end-auction job to handle winner notification and order creation');
      } catch (scheduleError) {
        console.error('Error scheduling end-auction job:', scheduleError);
      }
    }

  } catch (error) {
    console.error('Error in update-auction-status job:', error);
  }
});

// Define job for creating an order for auction winners
agenda.define('create-auction-winner-order', async (job) => {
  try {
    const { productId } = job.attrs.data;
    const Product = mongoose.model('Product');
    const Buyer = mongoose.model('Buyer');
    const Seller = mongoose.model('Seller');
    const Order = mongoose.model('Order');
    const Transaction = mongoose.model('Transaction');
    const axios = require('axios');

    console.log('Starting create-auction-winner-order job for product:', productId);

    // Check if an order already exists for this auction
    const existingOrder = await Order.findOne({ 
      channel: 'auction',
      'items.product': productId
    });
    
    if (existingOrder) {
      console.log('Order already exists for auction product:', {
        productId,
        orderId: existingOrder._id,
        orderStatus: existingOrder.items[0].status
      });
      return;
    }

    // Fetch the product with populated winner and seller data
    const product = await Product.findById(productId)
      .populate('auction.winner.buyer')
      .populate('seller');

    if (!product || product.status !== 'offline_auction') {
      console.log('Product not found or not an auction product:', productId);
      return;
    }
    
    if (!product.auction.winner || !product.auction.winner.buyer) {
      console.log('No valid auction winner found for product:', productId);
      return;
    }

    // Validate that product has stock available
    if (product.stock < 1) {
      console.error('Insufficient stock for auction product:', {
        productId: product._id,
        productName: product.name,
        availableStock: product.stock,
        requiredStock: 1
      });
      
      // Reschedule job to retry later or notify admin
      job.schedule('in 12 hours');
      await job.save();
      console.log('Rescheduled order creation job due to insufficient product stock');
      return;
    }

    const buyer = product.auction.winner.buyer;
    const seller = product.seller;
    const bidAmount = product.auction.winner.bidAmount;

    console.log('Creating order for auction winner:', {
      buyer: buyer._id,
      seller: seller._id,
      product: product._id,
      bidAmount
    });

    // Default shipping fee of 1000 as requested
    const shippingFee = 1000;
    const totalAmount = bidAmount + shippingFee;

    // Get the most up-to-date buyer information
    const freshBuyer = await Buyer.findById(buyer._id);
    
    if (!freshBuyer) {
      console.error('Could not find buyer with ID:', buyer._id);
      return;
    }

    let holdRemoved = false;
    
    // Check if there's a hold for this product in the buyer's wallet
    const holdIndex = freshBuyer.wallet.onHoldItems.findIndex(
      item => item.productId.toString() === productId.toString()
    );
    
    // If there's a hold, remove it first
    if (holdIndex !== -1) {
      const holdAmount = freshBuyer.wallet.onHoldItems[holdIndex].amount;
      console.log(`Found hold of ₦${holdAmount} for auction winner ${freshBuyer._id} on product ${productId}`);
      
      // Make sure we don't subtract more than what's actually on hold
      const currentOnHoldAmount = freshBuyer.wallet.onHoldAmount || 0;
      freshBuyer.wallet.onHoldAmount = Math.max(0, currentOnHoldAmount - holdAmount);
      
      // Log the before/after values to help with debugging
      console.log(`Adjusting onHoldAmount from ₦${currentOnHoldAmount} to ₦${freshBuyer.wallet.onHoldAmount} after removing hold for product ${productId}`);
      
      // Remove the hold item from the array
      freshBuyer.wallet.onHoldItems.splice(holdIndex, 1);
      
      await freshBuyer.save();
      console.log(`Released hold of ₦${holdAmount} for auction winner ${freshBuyer._id} on product ${productId}`);
      holdRemoved = true;
    } else {
      console.log(`No hold found for auction winner ${freshBuyer._id} on product ${productId}. Hold may have been removed already.`);
    }

    // Check if buyer has enough balance for the order
    if (freshBuyer.wallet.balance < totalAmount) {
      console.error('Buyer does not have enough balance for auction order:', {
        buyerId: freshBuyer._id,
        walletBalance: freshBuyer.wallet.balance,
        requiredAmount: totalAmount
      });
      
      // Schedule a retry with a delay if balance is insufficient
      job.schedule('in 1 hour');
      await job.save();
      console.log('Rescheduled order creation job for 1 hour later due to insufficient funds');
      return;
    }

    // Generate transaction for wallet payment
    const paymentReference = `AUCT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const transaction = {
      type: 'debit',
      amount: totalAmount,
      paymentReference,
      description: `Payment for auction item: ${product.name}`,
      status: 'completed',
      createdAt: new Date()
    };

    // Create order in database
    const order = new Order({
      buyer: freshBuyer._id,
      seller: seller._id,
      channel: 'auction', // Set channel to 'auction' as requested
      items: [{
        product: product._id,
        productName: product.name,
        seller: seller._id,
        quantity: 1,
        price: bidAmount,
        status: 'processing',
        statusHistory: [{
          status: 'processing',
          timestamp: new Date(),
          note: 'Order created automatically after auction ended'
        }]
      }],
      totalAmount: bidAmount,
      delivery_address: {
        first_name: freshBuyer.firstName,
        last_name: freshBuyer.lastName,
        email: freshBuyer.email,
        phone: freshBuyer.phoneNumber,
        // Use the first shipping address if available, or empty values
        ...(freshBuyer.shippingAddresses && freshBuyer.shippingAddresses.length > 0 ? {
          line1: freshBuyer.shippingAddresses[0].addressLine1,
          line2: freshBuyer.shippingAddresses[0].addressLine2 || '',
          city: freshBuyer.shippingAddresses[0].city,
          state: freshBuyer.shippingAddresses[0].state,
          country: freshBuyer.shippingAddresses[0].country,
          zip: freshBuyer.shippingAddresses[0].zipCode
        } : {
          line1: '',
          city: '',
          state: '',
          country: 'NG',
          zip: ''
        })
      },
      shipping: {
        method: 'standard',
        fee: {
          amount: shippingFee,
          currency: 'NGN'
        },
        tracking: {
          status: 'pending'
        }
      },
      paid: true,
      paymentInfo: {
        method: 'wallet',
        status: 'paid',
        paymentReference,
        paidAt: new Date()
      }
    });

    // Save the order
    await order.save();
    console.log('Order created successfully for auction winner:', order._id);

    // Update product stock
    await Product.findByIdAndUpdate(
      product._id,
      { 
        $inc: { 
          'stats.soldCount': 1,
          'stock': -1,
          'inventory.quantity': -1 
        }
      }
    );
    console.log('Product stock updated for auction item:', product._id);

    // Update buyer's wallet - reduce the balance
    await Buyer.findByIdAndUpdate(
      freshBuyer._id,
      {
        $inc: { 'wallet.balance': -totalAmount },
        $push: { 'wallet.transactions': transaction }
      }
    );
    console.log('Buyer wallet updated with deduction:', totalAmount);
    
    // Create Fez Delivery shipment
    try {
      console.log('Starting Fez shipment creation for auction order:', {
        orderId: order._id,
        orderIdString: order.order_id,
        buyerAddress: order.delivery_address
      });
      
      // Initialize Fez API configuration
      const FEZ_API_URL = process.env.FEZ_API_URL || 'https://apisandbox.fezdelivery.co/v1';
      console.log('Using Fez API URL:', FEZ_API_URL);
      
      // Get fresh auth token for Fez
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
      
      console.log('Calling getFezAuthToken()');
      const authToken = await getFezAuthToken();
      console.log('Using fresh token for auction winner order shipment (first 10 chars):', authToken.substring(0, 10) + '...');
      
      // Prepare buyer's delivery address
      const shippingAddress = {
        recipientAddress: order.delivery_address.line1 + (order.delivery_address.line2 ? `, ${order.delivery_address.line2}` : ''),
        recipientState: order.delivery_address.state || "Lagos",
        recipientName: `${order.delivery_address.first_name} ${order.delivery_address.last_name}`,
        recipientPhone: order.delivery_address.phone,
        recipientEmail: order.delivery_address.email || freshBuyer.email || ''
      };
      
      console.log('Prepared shipping address:', shippingAddress);
      
      // Prepare seller's information
      const sellerSenderInfo = {
        senderName: `${seller.firstName} ${seller.lastName}`,
        senderAddress: seller.address || 'Not provided',
        senderPhone: seller.phoneNumber || 'Not provided',
        senderEmail: seller.email || ''
      };
      
      console.log('Prepared seller info:', sellerSenderInfo);
      
      // Create unique batch ID for the seller
      const sellerBatchId = `AUCT-${seller._id.toString().substring(0, 8)}-${Date.now()}`;
      
      // Prepare parcel information
      const sellerParcel = {
        valueOfItem: bidAmount.toString(),
        weight: 1, // Default weight of 1kg for auction items
        itemDescription: `Auction item: ${product.name}`
      };
      
      console.log('Prepared parcel info:', sellerParcel);
      
      // Create Fez Delivery request
      const fezRequest = {
        recipientAddress: shippingAddress.recipientAddress,
        recipientState: shippingAddress.recipientState,
        recipientName: shippingAddress.recipientName,
        recipientPhone: shippingAddress.recipientPhone,
        recipientEmail: shippingAddress.recipientEmail,
        uniqueID: order.order_id,
        BatchID: sellerBatchId,
        valueOfItem: sellerParcel.valueOfItem,
        weight: Math.max(1, Math.round(sellerParcel.weight)),
        itemDescription: sellerParcel.itemDescription.substring(0, 200), // Ensure it doesn't exceed 200 chars
        additionalDetails: `Auction order`,
        isItemCod: false, // Auction orders are always pre-paid
        thirdparty: "true",
        senderName: sellerSenderInfo.senderName,
        senderAddress: sellerSenderInfo.senderAddress,
        senderPhone: sellerSenderInfo.senderPhone,
        senderEmail: sellerSenderInfo.senderEmail,
        pickUpState: sellerSenderInfo.senderAddress.includes(",") ? 
          sellerSenderInfo.senderAddress.split(",").pop().trim() : "Lagos",
        pickUpDate: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
      };
      
      console.log('Sending Fez shipment request for auction order:', {
        orderUniqueId: order.order_id,
        requestBody: JSON.stringify(fezRequest, null, 2)
      });
      
      // Log request headers
      const requestHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'secret-key': process.env.FEZ_SECRET_KEY || "jmPPVB9OZstzNCNZn-73Yrca2O1dXx7BSKWPMQaCrtnO845zMPxa_fftFauXPAWB",
        'Content-Type': 'application/json'
      };
      
      console.log('Request headers:', {
        Authorization: requestHeaders.Authorization.substring(0, 15) + '...',
        'secret-key': requestHeaders['secret-key'].substring(0, 10) + '...',
        'Content-Type': requestHeaders['Content-Type']
      });
      
      // Make API call to Fez Delivery
      console.log(`Calling Fez API: POST ${FEZ_API_URL}/order`);
      const fezResponse = await axios.post(`${FEZ_API_URL}/order`, [fezRequest], {
        headers: requestHeaders
      });
      
      console.log('Fez API response for auction order:', {
        status: fezResponse.status,
        statusText: fezResponse.statusText,
        data: JSON.stringify(fezResponse.data, null, 2)
      });
      
      // Update order with Fez tracking information
      if (fezResponse.data && fezResponse.data.status === 'Success') {
        const orderNos = fezResponse.data.orderNos || {};
        console.log('orderNos from Fez response:', orderNos);
        console.log('Looking for order_id:', order.order_id);
        
        const fezOrderNo = orderNos[order.order_id];
        console.log('Found fezOrderNo:', fezOrderNo);
        
        if (fezOrderNo) {
          const updateFields = {
            'shipping.tracking.number': fezOrderNo,
            'shipping.fez_order_number': fezOrderNo,
            'shipping.tracking.carrier': 'Fez Delivery',
            'shipping.tracking.url': `https://fezdelivery.co/track?orderNo=${fezOrderNo}`,
            'shipping.carrier.name': 'Fez Delivery',
            'shipping.carrier.reference': fezOrderNo,
            'shipping.shipment_id': fezOrderNo
          };
          
          console.log('Updating order with fields:', updateFields);
          
          const updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            { $set: updateFields },
            { new: true }
          );
          
          console.log('Order updated with Fez tracking information:', {
            orderId: order._id,
            fezOrderNo,
            trackingNumber: updatedOrder.shipping.tracking.number,
            fezOrderNumber: updatedOrder.shipping.fez_order_number,
            shipmentId: updatedOrder.shipping.shipment_id
          });
        } else {
          console.error('fezOrderNo not found in response for uniqueID:', order.order_id);
          console.error('Full orderNos object:', orderNos);
        }
      } else {
        console.error('Failed to create Fez shipment for auction order:', {
          orderId: order._id,
          responseStatus: fezResponse.data?.status,
          responseMessage: fezResponse.data?.message,
          fullResponse: fezResponse.data
        });
      }
    } catch (fezError) {
      console.error('Error creating Fez shipment for auction order:', {
        orderId: order._id,
        error: fezError.message,
        stack: fezError.stack
      });
      
      if (fezError.response) {
        console.error('Error response:', {
          status: fezError.response.status,
          data: fezError.response.data
        });
      }
    }
    
    // Schedule notification job
    await agenda.now('send-order-notifications', {
      orderId: order._id,
      buyerId: freshBuyer._id,
      sellerId: seller._id
    });

    console.log('Order notifications scheduled for auction winner order');

    // Send email to the buyer about the purchase
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: freshBuyer.email,
      from: 'Auqli Auctions <support@auqli.com>',
      subject: 'Congratulations on Winning the Auction! - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations on Winning the Auction!</h2>
          <p>Dear ${freshBuyer.firstName},</p>
          <p>You've successfully won the auction for "${product.name}".</p>
          <p>An order has been automatically created and payment has been processed from your wallet.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${order.order_id}</li>
            <li>Product: ${product.name}</li>
            <li>Winning Bid: ₦${bidAmount.toLocaleString()}</li>
            <li>Shipping Fee: ₦${shippingFee.toLocaleString()}</li>
            <li>Total Amount: ₦${totalAmount.toLocaleString()}</li>
          </ul>
          <p>The seller will process your order shortly.</p>
          <p>Thank you for participating in our auction!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    });

    // Send email to the seller about the sale
    await sgMail.send({
      to: seller.email,
      from: 'Auqli Auctions <support@auqli.com>',
      subject: 'Your Auction Item Has Been Sold! - Auqli',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Auction Item Has Been Sold!</h2>
          <p>Dear ${seller.firstName},</p>
          <p>Your auction for "${product.name}" has successfully concluded with a winning bid.</p>
          <p>An order has been automatically created and the buyer has been charged.</p>
          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Order ID: ${order.order_id}</li>
            <li>Product: ${product.name}</li>
            <li>Winning Bid: ₦${bidAmount.toLocaleString()}</li>
            <li>Buyer: ${freshBuyer.firstName} ${freshBuyer.lastName}</li>
          </ul>
          <p>Please process this order promptly.</p>
          <p>Thank you for using our auction platform!</p>
          <p>Best regards,<br>The Auqli Team</p>
        </div>
      `
    });
    
  } catch (error) {
    console.error('Error in create-auction-winner-order job:', error);
  }
});

// Define job for updating order status in messages
agenda.define('update-order-message-status', async (job) => {
  try {
    const { orderId, newStatus } = job.attrs.data;
    
    const Order = mongoose.model('Order');
    const Message = mongoose.model('Message');
    
    // Find all messages that contain this order
    const messages = await Message.find({
      'order.id': orderId,
      messageType: 'order'
    });

    // Update the order status in all messages
    await Promise.all(messages.map(message => {
      message.order.status = newStatus;
      return message.save();
    }));

    console.log(`Updated order status to ${newStatus} in ${messages.length} messages for order: ${orderId}`);
  } catch (error) {
    console.error('Error in update-order-message-status job:', error);
  }
});

// Define job for processing pending message notifications
agenda.define('process-pending-message-notifications', async (job) => {
  try {
    console.log('Starting process-pending-message-notifications job');
    
    const Seller = mongoose.model('Seller');
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Find sellers with pending message notifications
    const sellers = await Seller.find({
      'messageNotifications.pendingCount': { $gt: 0 },
      'messageNotifications.conversationsWithNewMessages.0': { $exists: true }
    }).populate({
      path: 'messageNotifications.conversationsWithNewMessages',
      model: 'Conversation',
      select: 'participants lastMessage'
    });
    
    console.log(`Found ${sellers.length} sellers with pending message notifications`);
    
    // Process each seller
    for (const seller of sellers) {
      try {
        // Check if the cooldown period has passed (5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (!seller.messageNotifications.lastSentAt || 
            seller.messageNotifications.lastSentAt < fiveMinutesAgo) {
          
          console.log(`Processing pending notifications for seller ${seller._id}`);
          
          // Skip if seller has opted out of email notifications
          if (seller.notificationPreferences && seller.notificationPreferences.emailNotifications === false) {
            console.log(`Seller ${seller._id} has opted out of email notifications, skipping`);
            continue;
          }
          
          const conversationCount = seller.messageNotifications.conversationsWithNewMessages.length;
          let emailSubject = '';
          let emailContent = '';
          
          // Build email content based on number of conversations
          if (conversationCount === 1) {
            // For a single conversation, get buyer information
            const conversation = seller.messageNotifications.conversationsWithNewMessages[0];
            const buyerParticipant = conversation.participants.find(p => p.model === 'Buyer');
            
            if (!buyerParticipant) {
              console.log(`No buyer participant found for conversation ${conversation._id}, skipping`);
              continue;
            }
            
            // Get buyer name
            const Buyer = mongoose.model('Buyer');
            const buyer = await Buyer.findById(buyerParticipant.id);
            if (!buyer) {
              console.log(`Buyer ${buyerParticipant.id} not found, skipping`);
              continue;
            }
            
            const buyerName = `${buyer.firstName} ${buyer.lastName}`;
            const messagePreview = conversation.lastMessage ? 
              (conversation.lastMessage.content || `Sent ${conversation.lastMessage.messageType}`) : 
              'New message';
            
            emailSubject = `New message from ${buyerName} - Auqli`;
            emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>You have a new message!</h2>
                <p>Dear ${seller.firstName},</p>
                <p>${buyerName} has sent you a message: "${messagePreview.length > 50 ? messagePreview.substring(0, 47) + '...' : messagePreview}"</p>
                <p>Please log in to your Auqli account to respond.</p>
                <p><a href="${process.env.FRONTEND_URL}/dashboard/messages/${conversation._id}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View Messages</a></p>
                <p>Best regards,<br>The Auqli Team</p>
              </div>
            `;
          } else {
            // For multiple conversations
            emailSubject = `You have ${conversationCount} conversations with new messages - Auqli`;
            emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>You have new messages!</h2>
                <p>Dear ${seller.firstName},</p>
                <p>You have ${conversationCount} conversations with new messages on Auqli.</p>
                <p>Please log in to your Auqli account to respond to your customers.</p>
                <p><a href="${process.env.FRONTEND_URL}/dashboard/messages" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px;">View All Messages</a></p>
                <p>Best regards,<br>The Auqli Team</p>
              </div>
            `;
          }
          
          // Send the email
          const msg = {
            to: seller.email,
            from: 'Auqli Messages <support@auqli.com>',
            subject: emailSubject,
            html: emailContent
          };
          
          await sgMail.send(msg);
          console.log(`Sent pending notification email to seller ${seller._id}`);
          
          // Update the seller's notification status
          seller.messageNotifications.lastSentAt = new Date();
          seller.messageNotifications.pendingCount = 0;
          seller.messageNotifications.conversationsWithNewMessages = [];
          await seller.save();
        } else {
          console.log(`Cooldown period not passed for seller ${seller._id}, skipping`);
        }
      } catch (sellerError) {
        console.error(`Error processing seller ${seller._id}:`, sellerError);
        // Continue to next seller
      }
    }
    
    console.log('Finished process-pending-message-notifications job');
  } catch (error) {
    console.error('Error in process-pending-message-notifications job:', error);
  }
});

// Define job for timer-based bid ending
agenda.define('bid_timer', async (job) => {
  try {
    console.log('[BID_TIMER] Starting bid timer job with data:', job.attrs.data);
    const { streamId, productId, sellerId, jobId, activeProductIndex, productName } = job.attrs.data;
    
    if (!streamId || !productId) {
      console.error('[BID_TIMER] Missing required data for bid timer job');
      return;
    }
    
    console.log(`[BID_TIMER] Starting 30-second timer for product "${productName}" in stream ${streamId}`);
    
    // Get socket.io instance directly from the socket module
    const socketManager = require('../socket/socketManager');
    const io = socketManager.getIO();
    
    if (!io) {
      console.error('[BID_TIMER] Socket.io instance not available, cannot emit timer updates');
      // Still continue with the timer, but won't emit updates
    } else {
      console.log('[BID_TIMER] Successfully got socket.io instance');
    }
    
    // Duration in seconds
    const duration = 30;
    
    // Create and format the time for initial message
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Function to emit timer updates
    const emitTimerUpdate = (secondsLeft) => {
      const formattedTime = formatTime(secondsLeft);
      
      if (io) {
        // Create data structure matching frontend expectations
        const updateData = {
          streamId,
          productId,
          secondsLeft,
          formattedTime,
          jobId,
          productIndex: activeProductIndex,
          productName,
          timestamp: new Date()
        };
        
        // Emit to stream_notifications room
        io.to('stream_notifications').emit('bid_timer_update', updateData);
        
        console.log(`[BID_TIMER] Emitted timer update to stream_notifications room: ${formattedTime} seconds left for product "${productName}"`);
      } else {
        console.log(`[BID_TIMER] Timer update: ${formattedTime} seconds left (not emitted - no socket connection)`);
      }
    };
    
    // Start the countdown by emitting the initial value
    emitTimerUpdate(duration);
    
    // Countdown function using setTimeout for each second
    const countdown = (secondsLeft) => {
      if (secondsLeft <= 0) {
        // Timer has reached zero
        console.log(`[BID_TIMER] Timer reached zero for product "${productName}" in stream ${streamId}`);
        
        // Emit final timer update
        if (io) {
          // Create data structure matching frontend expectations
          const completeData = {
            streamId,
            productId,
            jobId,
            productIndex: activeProductIndex,
            productName,
            timestamp: new Date()
          };
          
          // Emit to stream_notifications room
          io.to('stream_notifications').emit('bid_timer_complete', completeData);
          
          console.log('[BID_TIMER] Emitted bid_timer_complete event to stream_notifications room');
        }
        
        // Call the endProductBidding endpoint
        callEndProductBidding();
        return;
      }
      
      // Wait one second, then emit the next timer update
      setTimeout(() => {
        secondsLeft -= 1;
        emitTimerUpdate(secondsLeft);
        countdown(secondsLeft);
      }, 1000);
    };
    
    // Start the countdown from duration-1 (since we already emitted the initial value)
    countdown(duration - 1);
    
    // Function to call the endProductBidding endpoint
    const callEndProductBidding = async () => {
      try {
        console.log(`[BID_TIMER] Calling endProductBidding for product "${productName}" in stream ${streamId}`);
        
        // Import stream controller
        const streamController = require('../controllers/streamController');
        
        // Create mock request and response objects with all necessary properties
        const mockReq = {
          params: { streamId },
          body: { 
            productId, 
            sellerId 
          },
          app: {
            get: (name) => {
              if (name === 'io') return io;
              return null;
            }
          },
          user: { 
            id: sellerId 
          },
          get: (name) => {
            if (name === 'host') return 'auqli.com';
            return null;
          }
        };
        
        const mockRes = {
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            this.data = data;
            console.log(`[BID_TIMER] endProductBidding completed with status: ${this.statusCode}`, 
              data?.product ? { 
                bidStatus: data.product.bidStatus,
                hasOrder: !!data.product.orderId 
              } : 'No product data returned');
            return this;
          }
        };
        
        // Call the endProductBidding function
        console.log('[BID_TIMER] Executing endProductBidding with request:', {
          streamId: mockReq.params.streamId,
          productId: mockReq.body.productId,
          sellerId: mockReq.body.sellerId
        });
        
        await streamController.endProductBidding(mockReq, mockRes);
        
        console.log(`[BID_TIMER] Successfully ended bidding for product "${productName}" in stream ${streamId}`);
      } catch (error) {
        console.error(`[BID_TIMER] Error calling endProductBidding:`, error);
      }
    };
    
  } catch (error) {
    console.error('[BID_TIMER] Error in bid_timer job:', error);
  }
});

// Start Agenda
const startAgenda = async () => {
  await agenda.start();
  console.log('Agenda started successfully');
  
  // Schedule the pending message notifications job to run every 5 minutes
  await agenda.every('5 minutes', 'process-pending-message-notifications');
  console.log('Scheduled message notification job to run every 5 minutes');
};

module.exports = { agenda, startAgenda }; 