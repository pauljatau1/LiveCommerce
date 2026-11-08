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
const BadRequestException = require('./utils/errors/BadRequestException');

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const sellerRoutesV2 = require('./modules/seller/routes/seller.routes');
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
const blipsRoutesV2 = require('./modules/blipsv2/routes/blips.routes');
const productRoutesV2 = require('./modules/productv2/routes/product.routes');
const NotFoundException = require('./utils/errors/NotFoundException');
const ForbiddenException = require('./utils/errors/ForbiddenException');

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

// -----------------------------------------------------------------------------
// Global Monitoring Middleware
// -----------------------------------------------------------------------------
const { sendRawHTMLEmail } = require('./services/termiiEmailService');

const MONITOR_CONFIG = {
  RECIPIENTS: ['bolu@auqli.com', 'dan@auqli.com', 'todimu@auqli.com', 'emmanuel@auqli.com'],
  ERROR_STATUSES: [500, 502, 503, 504, 408, 429],
  TIMEOUT_MS: 15000 // 15 seconds for production
};

app.use((req, res, next) => {
  const start = Date.now();
  let responseBody = null;

  // Intercept response body for logging purposes
  const originalSend = res.send;
  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    // Determine Environment first
    const host = req.get('host') || '';
    let environment = 'Local Development';
    let baseUrl = 'http://localhost:8000';

    if (host.includes('api.staging.auqli.live')) {
      environment = 'Staging';
      baseUrl = 'https://api.staging.auqli.live';
    } else if (host.includes('api.auqli.live')) {
      environment = 'Production';
      baseUrl = 'https://api.auqli.live';
    }

    // ONLY send alerts in Production
    if (environment !== 'Production') {
      return;
    }

    const duration = Date.now() - start;
    const status = res.statusCode;

    const isError = MONITOR_CONFIG.ERROR_STATUSES.includes(status);
    const isSlow = duration > MONITOR_CONFIG.TIMEOUT_MS;

    if (isError || isSlow) {
      try {
        const fullUrl = `${baseUrl}${req.originalUrl}`;
        const timestamp = new Date().toISOString();
        const reason = isError ? `Error Status: ${status}` : `Slow Request (${duration}ms)`;

        // Construct Email HTML
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">
              ⚠️ API Alert: ${reason}
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; font-weight: bold; width: 30%;">Environment:</td>
                <td style="padding: 10px;">${environment}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Timestamp:</td>
                <td style="padding: 10px;">${timestamp}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; font-weight: bold;">Endpoint:</td>
                <td style="padding: 10px;"><a href="${fullUrl}" style="color: #0275d8;">${req.method} ${req.originalUrl}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold;">Status Code:</td>
                <td style="padding: 10px;">${status}</td>
              </tr>
              <tr style="background-color: #f9f9f9;">
                <td style="padding: 10px; font-weight: bold;">Duration:</td>
                <td style="padding: 10px;">${duration}ms ${isSlow ? '(Exceeded 15000ms)' : ''}</td>
              </tr>
            </table>

            <div style="margin-top: 20px;">
              <h3 style="background-color: #333; color: #fff; padding: 5px 10px; border-radius: 3px;">Request Payload</h3>
              <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto;">${JSON.stringify(req.body, null, 2) || '{}'}</pre>
            </div>

            <div style="margin-top: 20px;">
              <h3 style="background-color: #333; color: #fff; padding: 5px 10px; border-radius: 3px;">Response Body</h3>
              <pre style="background-color: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; max-height: 300px;">${(() => {
            try {
              // responseBody might be a string or object. Safely stringify.
              return typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : responseBody;
            } catch (e) { return 'Could not parse response body'; }
          })()}</pre>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px; color: #777; border-top: 1px solid #e0e0e0; padding-top: 10px;">
              Automated Alert from Auqli Server Monitoring
            </div>
          </div>
        `;

        // Send Email to all recipients (Fire and forget)
        MONITOR_CONFIG.RECIPIENTS.forEach(email => {
          sendRawHTMLEmail({
            email,
            subject: `[${environment}] API Alert: ${req.method} ${req.originalUrl} - ${isError ? status : 'Slow Response'}`,
            html: emailHtml
          }).catch(err => {
            console.error(`[Monitor] Failed to send alert to ${email}:`, err.message);
          });
        });

      } catch (err) {
        console.error('[Monitor] Error constructing/sending alert:', err);
      }
    }
  });

  next();
});


// Middleware
// Only our own sites may call the API from a browser (ALLOWED_ORIGINS, see config/cors.js)
app.use(cors(require('./config/cors').corsOptions));
// JSON bodies are capped at 25 MB (file uploads use multipart, not JSON). The raw
// bytes are kept on req.rawBody, which webhook signature checks need.
app.use(express.json({
  limit: '25mb',
  parameterLimit: 1000000,
  extended: true,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({
  limit: '25mb',
  parameterLimit: 1000000,
  extended: true
}));

// Configure express-session middleware
app.use(session({
  // Required in production (checked at startup in config/env.js)
  secret: process.env.SESSION_SECRET || 'dev-only-session-secret',
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
    environment: process.env.APP_ENV || 'unset',
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




// Referral routes
const buyerReferralRoutes = require('./modules/referral/routes/buyer.referral.routes');
const sellerReferralRoutes = require('./modules/referral/routes/seller.referral.routes');

// Use routes
// Routes for features outside the MVP are mounted only when listed in EXTRA_FEATURES
const { mountOptional } = require('./config/optionalFeatures');

app.use('/api/admin', adminRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/order', orderRoutes);
// app.use('/api/v2/order', orderRoutesv2);
mountOptional(app, 'messaging', '/api/messages', messageRoutes);
mountOptional(app, 'messaging', '/api/conversations', conversationRoutes);
mountOptional(app, 'posts', '/api/posts', postRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/webhooks', webhookRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/streams', streamRoutes);
mountOptional(app, 'coupons', '/api/coupons', couponRoutes);
mountOptional(app, 'flashSales', '/api/flash-sales', flashSaleRoutes);
mountOptional(app, 'campaigns', '/api/campaigns', campaignRoutes);
mountOptional(app, 'returns', '/api/returns', returnRoutes);
mountOptional(app, 'returns', '/api/v2/returns', returnRoutesv2);
app.use('/api/pickup', pickupRoutes);

// example routes for refactoring
app.use('/api/users', userRoutes);
mountOptional(app, 'listings', '/api/users/:userId/listings', listingRoutes);
app.use('/api/v2/buyers', buyerRoutesV2);
app.use('/api/v2/orders', orderRoutesV2);
app.use('/api/v2/admin', adminRoutesV2);
app.use('/api/v2/sellers', sellerRoutesV2);
mountOptional(app, 'blips', '/api/v2/blips', blipsRoutesV2);
app.use('/api/v2/products', productRoutesV2);
app.use('/api/v2/ai', require('./routes/aiRoutes'));
app.use('/api/v2/deliveries', require('./routes/deliveryRoutes'));

// Mount referral routes
mountOptional(app, 'referrals', '/api/v2/buyers/referral', buyerReferralRoutes);
mountOptional(app, 'referrals', '/api/v2/sellers/referral', sellerReferralRoutes);

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

  if (err instanceof ForbiddenException) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof BadRequestException) {
    return res.status(err.statusCode).json({
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
