require('dotenv').config();
const express = require('express');
const cors = require('cors');

const session = require('express-session');
const { swaggerUi, specs } = require('../swagger');
const http = require('http');
const initializeSocket = require('./socket/socketManager');
const compression = require('compression');
const passport = require('./config/passport');


// Import routes
const adminRoutes = require('./routes/adminRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const postRoutes = require('./routes/postRoutes');
const returnRoutes = require('./routes/returnRoutes');

const publicRoutes = require('./routes/publicRoutes')
const notificationRoutes = require('./routes/notificationRoutes');

const webhookRoutes = require('./routes/webhookRoutes');
const locationRoutes = require('./routes/locationRoutes');
const streamRoutes = require('./routes/streamRoutes');
const couponRoutes = require('./routes/couponRoutes');
const flashSaleRoutes = require('./routes/flashSaleRoutes');
const campaignRoutes = require('./routes/campaignRoutes');


const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

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
   res.json({ message: 'Hello Auqli' });
});

// Use routes
app.use('/api/admin', adminRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/webhooks', webhookRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/returns', returnRoutes);

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Basic error handling
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Store io instance for use in other parts of the application
app.set('io', io);

// Add passport middleware
app.use(passport.initialize());
app.use(passport.session());

module.exports = { app, server };
