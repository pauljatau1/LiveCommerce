const mongoose = require('mongoose');


// Define the address schema to match Terminal Africa's format
const addressSchema = new mongoose.Schema({
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String },
  phone: { type: String },
  line1: { type: String },
  line2: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  zip: { type: String }
});

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  productImages: [{
    url: { type: String },
  }],
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    // enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'shipment_in_transit'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  specifications: {
    color: String,
    size: String,
    material: String,
    // Add any other specification fields you need
  },
});

const orderSchema = new mongoose.Schema({
  order_id: {
    type: String,
    unique: true,
    required: true,
    default: function () {
      // Generate a random 5-character alphanumeric string
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'OR';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  },
  isStorePickup: {
    type: Boolean,
    default: false
  },
  isInternational: {
    type: Boolean,
    default: false
  },
  storePickupStatus: {
    state: {
      type: String,
      enum: ['pending', 'confirmed_by_seller', 'approved'],
      default: 'pending'
    },
    confirmedAt: Date,
    approvedAt: Date,
    pickupRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupRequest'
    }
  },
  isStale: {
    type: Boolean,
    default: false
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  buyerDetails: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    username: {
      type: String,
    },
    profileImage: [{
      url: { type: String },
    }]
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  channel: {
    type: String,
    // enum: ['marketplace', 'liveshow', 'other'],
    default: 'marketplace'
  },
  status: {
    type: String,
    enum: ['draft', 'pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'confirmed', 'in-transit', 'in_transit', 'picked-up'],
    default: 'draft'
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  // Update field names to match Terminal Africa's API
  delivery_address: addressSchema,
  pickup_address: addressSchema,
  shipping: {
    method: String,
    carrier: {
      name: String,
      reference: String
    },
    fee: {
      amount: Number,
      currency: String
    },
    rate_id: String,
    estimatedDeliveryDate: {
      type: String,
    },
    estimatedPickupDate: {
      type: String,

    },
    tracking: {
      number: String,
      url: String,
      carrier: String,
      status: {
        type: String,
        default: 'pending'
      },
      lastUpdate: Date,
      history: [{
        status: String,
        timestamp: Date,
        location: String,
        description: String
      }]
    },
    shipment_id: String,
    fez_order_number: String,
    shipment_purpose: String,
    documents: {
      shippingLabel: String,
      commercialInvoice: String
    },
    delivery: {
      estimatedDate: Date,
      actualDate: Date
    }
  },
  paid: {
    type: Boolean,
    default: false
  },
  paymentInfo: {
    method: {
      type: String,
      default: 'paystack'
    },
    status: {
      type: String,
      default: 'pending'
    },
    transactionId: String,
    paymentReference: String,
    paidAt: Date,
    isCashOnDelivery: {
      type: Boolean,
      default: false
    },
    isWalletCredit: {
      type: Boolean,
      default: false
    },
    walletAmountUsed: {
      type: Number,
      default: 0
    }
  },
  discount: {
    code: String,
    amount: Number
  },
  orderStatus: {
    hasReturn: {
      type: Boolean,
      default: false
    },
    hasDispute: {
      type: Boolean,
      default: false
    },
    hasRefund: {
      type: Boolean,
      default: false
    }
  },
  refundRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    requestedAt: Date,
    requestedBy: {
      type: String,
      // enum: ['buyer', 'seller', 'admin']
    },
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    processedAt: Date,
    processedBy: {
      type: String,
      enum: ['admin', 'system']
    },
    notes: String,
    refundAmount: Number,
    paymentReference: String
  },
  notes: [{
    type: {
      type: String,
      enum: ['buyer', 'seller', 'admin']
    },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  closedAt: Date,
  closedBy: {
    type: String,
    enum: ['admin', 'buyer', 'auto', 'seller'],
  },
  closedReason: String,
  notificationsSent: {
    type: Boolean,
    default: false
  },
  paymentOTP: {
    type: String
  },
  paymentOTPExpires: {
    type: Date
  },
  smsStatus: {
    buyerSMS: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    sellerSMS: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  }
});

// Add a pre-save middleware to handle seller wallet updates
orderSchema.pre('save', async function (next) {
  if (this.isModified('isOpen') && !this.isOpen) {
    try {
      console.log('Order closing process started:', {
        orderId: this._id,
        order_id: this.order_id,
        items: this.items.length,
        isNew: this.isNew,
        currentIsOpen: this.isOpen,
        paymentMethod: this.paymentInfo?.method,
        isCashOnDelivery: this.paymentInfo?.isCashOnDelivery,
        isPaid: this.paid,
        closedReason: this.closedReason,
        closedBy: this.closedBy
      });

      // Check if this order is already being processed elsewhere (to avoid duplicate processing)
      if (this._orderClosingProcessed) {
        console.log('Order closing already processed for this session, skipping:', this._id);
        return next();
      }

      // Mark this order as processed to avoid duplicate processing
      this._orderClosingProcessed = true;

      // DB-level guard: check if platform_fee transactions already exist for this order
      // to prevent double-crediting if the middleware fires more than once on the same order
      const Transaction = mongoose.model('Transaction');
      const existingPaymentTxn = await Transaction.findOne({
        orderId: this._id,
        seller: this.seller,
        type: 'order_payment'
      });
      if (existingPaymentTxn) {
        console.log(`Payment already processed for order ${this.order_id}, skipping duplicate wallet credit.`);
        return next();
      }

      // Check if the order was cancelled (any item has 'cancelled' status or closedReason contains 'cancel')
      const isCancelled = this.items.some(item => item.status === 'cancelled') ||
        (this.closedReason && this.closedReason.toLowerCase().includes('cancel'));

      // Skip payment release for cancelled orders
      if (isCancelled) {
        console.log(`Order ${this.order_id} was cancelled. Skipping payment release to seller.`, {
          itemStatuses: this.items.map(item => item.status),
          closedReason: this.closedReason,
          closedBy: this.closedBy
        });
        return next();
      }

      // Populate the products
      await this.populate('items.product', 'name category');

      const Category = mongoose.model('Category');

      console.log('Populated items:', this.items.map(item => ({
        productName: item.productName,
        product: item.product,
        category: item.product?.category
      })));

      // Get unique category names (preserve original case for lookup)
      const rawCategoryNames = [...new Set(this.items.map(item =>
        typeof item.product?.category === 'string' ? item.product.category : null
      ).filter(Boolean))];

      console.log('Looking up categories by names:', rawCategoryNames);

      // Use $in for reliable multi-value lookup (case-insensitive via collation)
      // Fetch all categories and match case-insensitively in-memory to avoid regex pitfalls
      const allCategories = await Category.find({});
      const categoryFeeMap = new Map(
        allCategories.map(cat => [cat.name.toLowerCase(), cat.platformFee || 0])
      );

      console.log('Category fee map created:',
        Object.fromEntries(categoryFeeMap.entries())
      );

      // Calculate totals and fees for each item
      let totalPlatformFee = 0;
      let totalAmount = 0;

      this.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const categoryName = typeof item.product?.category === 'string'
          ? item.product.category.toLowerCase()
          : null;

        console.log('Looking up fee for category:', {
          categoryName,
          availableCategories: Array.from(categoryFeeMap.keys()),
          foundFee: categoryFeeMap.get(categoryName)
        });

        const categoryFee = categoryFeeMap.get(categoryName) || 0;
        const itemPlatformFee = itemTotal * (categoryFee / 100);
        totalPlatformFee += itemPlatformFee;

        console.log('Item fee calculation:', {
          productName: item.productName,
          categoryName,
          categoryFee,
          itemTotal,
          itemPlatformFee
        });
      });

      // Calculate payment processing fee (1.5%)
      const paymentProcessingFee = totalAmount * 0.015;
      const totalDeductions = totalPlatformFee + paymentProcessingFee;
      const sellerAmount = totalAmount - totalDeductions;

      console.log('Final calculations:', {
        totalAmount,
        totalPlatformFee,
        paymentProcessingFee,
        totalDeductions,
        sellerAmount
      });

      // Update seller's wallet
      const Seller = mongoose.model('Seller');
      // Transaction model already declared above (for DB-level guard)

      // Use findOneAndUpdate to prevent race conditions
      const updatedSeller = await Seller.findOneAndUpdate(
        { _id: this.seller },
        { $inc: { walletBalance: sellerAmount } },
        { new: true }
      );

      if (!updatedSeller) {
        throw new Error(`Seller not found with ID: ${this.seller}`);
      }

      console.log('Seller wallet updated:', {
        sellerId: updatedSeller._id,
        newBalance: updatedSeller.walletBalance
      });

      // Create transaction records with detailed metadata
      const transactionPromises = [];

      // Order payment transaction - include payment method info
      transactionPromises.push(
        Transaction.create({
          seller: this.seller,
          type: 'order_payment',
          amount: totalAmount,
          orderId: this._id,
          description: `Payment for order #${this.order_id}${this.paymentInfo?.isCashOnDelivery ? ' (Cash on Delivery)' : this.paymentInfo?.method ? ` (${this.paymentInfo.method})` : ''}`,
          metadata: {
            paymentMethod: this.paymentInfo?.method || 'unknown',
            isCashOnDelivery: this.paymentInfo?.isCashOnDelivery || false,
            closedBy: this.closedBy
          },
          status: 'completed'
        })
      );

      console.log(`Creating payment transactions for order ${this.order_id}`, {
        paymentMethod: this.paymentInfo?.method,
        isCashOnDelivery: this.paymentInfo?.isCashOnDelivery,
        totalAmount: totalAmount,
        sellerAmount: sellerAmount,
        closedBy: this.closedBy
      });

      // Platform fee transactions for each item
      for (const item of this.items) {
        const itemTotal = item.price * item.quantity;
        const categoryFee = categoryFeeMap.get(typeof item.product?.category === 'string' ? item.product.category.toLowerCase() : null) || 0;
        const itemPlatformFee = itemTotal * (categoryFee / 100);

        if (itemPlatformFee > 0) {
          transactionPromises.push(
            Transaction.create({
              seller: this.seller,
              type: 'platform_fee',
              amount: itemPlatformFee,
              orderId: this._id,
              description: `Platform fee for ${item.productName} in order #${this.order_id}`,
              metadata: {
                categoryFee: categoryFee,
                categoryName: typeof item.product?.category === 'string' ? item.product.category : null,
                itemTotal: itemTotal
              },
              status: 'completed'
            })
          );
        }
      }

      // Processing fee transaction
      transactionPromises.push(
        Transaction.create({
          seller: this.seller,
          type: 'processing_fee',
          amount: paymentProcessingFee,
          orderId: this._id,
          description: `Payment processing fee for order #${this.order_id}`,
          metadata: {
            processingFeePercent: 1.5,
            itemTotal: totalAmount
          },
          status: 'completed'
        })
      );

      try {
        await Promise.all(transactionPromises);
        console.log(`Successfully created ${transactionPromises.length} transaction records for order ${this.order_id}`);
      } catch (txnError) {
        console.error(`Error creating transaction records for order ${this.order_id}:`, txnError);
        // Continue execution - the seller's wallet was already updated
      }

      // Send email notification to seller
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const sellerEmail = {
          to: updatedSeller.email,
          from: {
            email: 'support@auqli.com',
            name: 'Auqli Orders'
          },
          subject: 'Order Closed and Payment Released',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Order Closed and Payment Released</h2>
              <p>Dear ${updatedSeller.firstName},</p>
              <p>Order #${this.order_id} has been closed and the payment has been released to your wallet.</p>
              <p><strong>Payment Details:</strong></p>
              <ul>
                <li>Payment Method: ${this.paymentInfo?.isCashOnDelivery ? 'Cash on Delivery' : (this.paymentInfo?.method || 'Standard Payment')}</li>
                <li>Total Order Amount: ₦${totalAmount.toLocaleString()}</li>
                
                <li style="margin-top: 10px;"><strong>Platform Fees Breakdown:</strong></li>
                ${this.items.map(item => {
            const categoryFee = categoryFeeMap.get(typeof item.product?.category === 'string' ? item.product.category.toLowerCase() : null) || 0;
            const itemTotal = item.price * item.quantity;
            const itemPlatformFee = itemTotal * (categoryFee / 100);
            return `
                    <li style="margin-left: 20px;">
                      ${item.productName} (${categoryFee}% fee): ₦${itemPlatformFee.toLocaleString()}
                      <br><small style="color: #666;">Item Total: ₦${itemTotal.toLocaleString()}</small>
                    </li>
                  `;
          }).join('')}
                <li style="margin-top: 5px;">Total Platform Fees: ₦${totalPlatformFee.toLocaleString()}</li>
                
                <li style="margin-top: 10px;">Payment Processing Fee (1.5%): ₦${paymentProcessingFee.toLocaleString()}</li>
                <li>Total Deductions: ₦${totalDeductions.toLocaleString()}</li>
                <li style="margin-top: 10px; font-weight: bold;">Amount Released: ₦${sellerAmount.toLocaleString()}</li>
               
              </ul>
              <p>The platform fees have been deducted based on your products' category rates, and a 1.5% payment processing fee has been applied.</p>
              <p>Best regards,<br>The Auqli Team</p>
            </div>
          `
        };

        console.log('Attempting to send email with full config:', {
          to: sellerEmail.to,
          from: sellerEmail.from,
          subject: sellerEmail.subject,
          apiKey: process.env.SENDGRID_API_KEY ? 'Present' : 'Missing'
        });

        // Send directly with sgMail instead of using the notification controller
        await sgMail.send(sellerEmail);

        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Email sending failed:', {
          error: emailError.message,
          details: emailError.response?.body?.errors,
          stack: emailError.stack
        });
        // Continue execution despite email error
      }

    } catch (error) {
      console.error('Error in order close middleware:', {
        error: error.message,
        stack: error.stack
      });
      return next(error);
    }
  }
  next();
});

// Update the existing auto-close middleware
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Order = this.constructor;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate a new orderId
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let newOrderId = 'OR';
      for (let i = 0; i < 5; i++) {
        newOrderId += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if this orderId already exists
      const existingOrder = await Order.findOne({ order_id: newOrderId });
      if (!existingOrder) {
        this.order_id = newOrderId;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      next(new Error('Could not generate unique orderId after maximum attempts'));
      return;
    }
  }

  // Continue with the existing pre-save middleware for status history
  const order = this;
  order.items.forEach(item => {
    if (item.isModified('status')) {
      item.statusHistory.push({
        status: item.status,
        timestamp: new Date(),
      });
    }
  });

  try {
    // Check if there's any return request for this order
    const Return = mongoose.model('Return');
    const returnRequest = await Return.findOne({ order: this._id });

    if (returnRequest) {
      this.orderStatus.hasReturn = true;
      this.orderStatus.hasDispute = returnRequest.status === 'DISPUTED';
      this.orderStatus.hasRefund = returnRequest.status === 'REFUNDED';
    } else {
      this.orderStatus.hasReturn = false;
      this.orderStatus.hasDispute = false;
      this.orderStatus.hasRefund = false;
    }
  } catch (error) {
    console.error('Error checking return status:', error);
  }

  next();
});

orderSchema.pre('save', async function (next) {
  // Check if refund request status is being changed to approved
  if (this.isModified('refundRequest.status') && this.refundRequest.status === 'approved') {
    // Close the order
    this.isOpen = false;
    this.closedAt = new Date();
    this.closedBy = 'admin';
    this.closedReason = 'Order closed after refund approval';
  }
  next();
});

// Add a compound index to prevent duplicate orders
orderSchema.index({ order_id: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
