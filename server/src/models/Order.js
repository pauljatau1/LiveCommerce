const mongoose = require('mongoose');
const notificationController = require('../controllers/notificationController');
const Transaction = require('./Transaction');

// Define the address schema to match Terminal Africa's format
const addressSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true }, 
  zip: { type: String, required: true }
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
    default: function() {
      // Generate a random 5-character alphanumeric string
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'OR';
      for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
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
    paidAt: Date
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
    enum: ['admin', 'buyer', 'auto'],
  },
  closedReason: String,
});

// Add a pre-save middleware to handle seller wallet updates
orderSchema.pre('save', async function(next) {
  // Only proceed if the order's isOpen status is changing from true to false
  if (this.isModified('isOpen') && !this.isOpen) {
    try {
      const Seller = mongoose.model('Seller');
      
      // Calculate total amount for seller (excluding shipping fees)
      const totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);

      // Calculate platform fee (8%) and seller amount (92%)
      const platformFee = totalAmount * 0.08;
      const sellerAmount = totalAmount * 0.92;

      // Create transaction records
      await Promise.all([
        // Create order payment transaction
        Transaction.create({
          seller: this.seller,
          type: 'order_payment',
          amount: totalAmount,
          orderId: this._id,
          description: `Payment for order #${this.order_id}`,
          status: 'completed'
        }),
        
        // Create platform fee transaction
        Transaction.create({
          seller: this.seller,
          type: 'platform_fee',
          amount: platformFee,
          orderId: this._id,
          description: `Platform fee for order #${this.order_id} (8%)`,
          status: 'completed'
        })
      ]);

      // Update seller's wallet balance with 92% of the total
      const updatedSeller = await Seller.findByIdAndUpdate(
        this.seller,
        { $inc: { walletBalance: sellerAmount } },
        { new: true }
      );

      // Create notification for order closure and wallet update
      await notificationController.createNotification(this.seller, 'order_closed', {
        orderId: this._id,
        order_id: this.order_id,
        amount: sellerAmount,
        platformFee: platformFee,
        newWalletBalance: updatedSeller.walletBalance
      });

      // Send email notification
      const sellerEmail = {
        to: updatedSeller.email,
        from: 'Auqli Payments <joseph@auqli.com>',
        subject: 'Order Closed and Payment Released - Auqli',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Order Closed and Payment Released</h2>
            <p>Dear ${updatedSeller.firstName},</p>
            <p>Order #${this.order_id} has been closed and the payment has been released to your wallet.</p>
            <p><strong>Payment Details:</strong></p>
            <ul>
              <li>Total Order Amount: ₦${totalAmount.toLocaleString()}</li>
              <li>Platform Fee (8%): ₦${platformFee.toLocaleString()}</li>
              <li>Amount Released: ₦${sellerAmount.toLocaleString()}</li>
              <li>New Wallet Balance: ₦${updatedSeller.walletBalance.toLocaleString()}</li>
            </ul>
            <p>The platform fee has been deducted from the total amount.</p>
            <p>Best regards,<br>The Auqli Team</p>
          </div>
        `
      };

      await notificationController.sendEmailNotification(updatedSeller, sellerEmail);

    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Update the existing auto-close middleware
orderSchema.pre('save', async function(next) {
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

  // Check if order should be auto-closed
  if (this.isOpen && 
      this.items.every(item => item.status === 'delivered') && 
      this.items[0].statusHistory.find(h => h.status === 'delivered')) {
    
    const deliveredDate = this.items[0].statusHistory.find(h => h.status === 'delivered').timestamp;
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    if (deliveredDate <= twoDaysAgo) {
      this.isOpen = false;
      this.closedAt = new Date();
      this.closedBy = 'auto';
      this.closedReason = 'Auto-closed after 2 days of delivery with no action';
      // The wallet update will be triggered by the isOpen change in the middleware above
    }
  }

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

module.exports = mongoose.model('Order', orderSchema);
