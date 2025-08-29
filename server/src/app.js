require('dotenv').config();
const express = require('express');
const cors = require('cors');

const session = require('express-session');
const { swaggerUi, specs } = require('../swagger');
const http = require('http');
const socketManager = require('./socket/socketManager');
const compression = require('compression');
const passport = require('./config/passport');
const mongoose = require('mongoose');
const mixpanelClient = require('./config/mixpanel');
const responseFormatter = require('./middlewares/response.middleware');
const ValidationError = require('./utils/errors/ValidationError');
const InvalidObjectIdException = require('./utils/errors/InvalidObjectIdException');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
// const orderRoutesv2 = require('./routes/orderRoutesv2');
const messageRoutes = require('./routes/messageRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const postRoutes = require('./routes/postRoutes');
const returnRoutes = require('./routes/returnRoutes');
const returnRoutesv2 = require('./routes/returnRoutesv2');
const pickupRoutes = require('./routes/pickupRoutes');
const publicRoutes = require('./routes/publicRoutes')
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const webhookRoutes = require('./routes/webhookRoutes');
const locationRoutes = require('./routes/locationRoutes');
const streamRoutes = require('./routes/streamRoutes');
const couponRoutes = require('./routes/couponRoutes');
const flashSaleRoutes = require('./routes/flashSaleRoutes');
const campaignRoutes = require('./routes/campaignRoutes');

// Example routes for refactoring
const userRoutes = require('./modules/user/routes/user.routes');
const listingRoutes = require('./modules/listing/routes/listing.route');
const buyerRoutesV2 = require('./modules/buyer/routes/buyer.routes');
const orderRoutesV2 = require('./modules/orderv2/routes/order.routes');
const adminRoutesV2 = require('./modules/adminv2/routes/admin.routes');
const NotFoundException = require('./utils/errors/NotFoundException');

const app = express();
const server = http.createServer(app);

// Only initialize socket manager if not in test environment
if (process.env.NODE_ENV !== 'test') {
  socketManager.initializeSocket(server);
}

// add reponse formatter
app.use(responseFormatter);

// Get the socket.io instance and store it in the app
const io = socketManager.getIO();
app.set('io', io);

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({
  limit: '1024mb', // 1GB
  parameterLimit: 1000000,
  extended: true
}));
app.use(express.urlencoded({
  limit: '1024mb', // 1GB
  parameterLimit: 1000000,
  extended: true
}));

// Configure express-session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));



// Add compression middleware
app.use(compression());

// After initializing io
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});

// Basic route
app.get('/', (req, res) => {
   res.json({ 
       message: 'Welcome to the Auqli API!', 
       description: 'This API provides a range of functionalities for managing products, orders, and user interactions within the Auqli application. Explore our endpoints for, buyer, seller, and public access to enhance your experience new one' 
   });
});

// Enhanced health check route
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const status = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    dbState: dbStates[dbState] || 'unknown',
    nodeEnv: process.env.NODE_ENV,
    memoryUsage: process.memoryUsage()
  };
  
  if (dbState === 1) {
    res.status(200).json(status);
  } else {
    // If database is not connected, return 503 Service Unavailable
    res.status(503).json({
      ...status,
      message: 'Database connection is not ready'
    });
  }
});

// Use routes
app.use('/api/admin', adminRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/order', orderRoutes);
// app.use('/api/v2/order', orderRoutesv2);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/webhooks', webhookRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/v2/returns', returnRoutesv2);
app.use('/api/pickup', pickupRoutes);

// example routes for refactoring
app.use('/api/users', userRoutes);
app.use('/api/users/:userId/listings', listingRoutes);
app.use('/api/v2/buyers', buyerRoutesV2);
app.use('/api/v2/orders', orderRoutesV2);
app.use('/api/v2/admin', adminRoutesV2);

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));


// Basic error handling
app.use((err, req, res, next) => {
   console.error(err);

   // Handle JSON parsing errors
   if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      error: 'Bad Request'
    });
  }

   if (err instanceof ValidationError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof NotFoundException) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Handle CastError (invalid ObjectId format)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'Bad Request'
    });
  }

  if (err instanceof InvalidObjectIdException) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err.status === 403 || err.status === 401) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

   res.status(500).json({ error: 'Something went wrong!' });
});

// Add passport middleware
app.use(passport.initialize());
app.use(passport.session());

module.exports = { app, server, mixpanel: mixpanelClient };
