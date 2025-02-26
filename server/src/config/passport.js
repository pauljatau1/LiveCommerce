const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');

// Add this helper function
const generateToken = (userId, role = 'Buyer') => {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Buyer.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: '891315649612-vn2tvirb74gnd2ggbrp4i4pd9b9p7vq3.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: "http://localhost:8000/api/buyer/google-callback",
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if buyer exists
      let buyer = await Buyer.findOne({ email: profile.emails[0].value });
      
      if (!buyer) {
        // Create new buyer if doesn't exist
        buyer = new Buyer({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          email: profile.emails[0].value,
          username: `${profile.name.givenName.toLowerCase()}${profile.name.familyName.toLowerCase()}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`, 
          emailVerified: true, // Email is verified through Google
          profileImage: {
            url: profile.photos[0].value,
            public_id: 'google_profile_photo'
          },
          country: 'NG', // Default value
          phoneNumber: 'Unknown', // Default value
          expoPushToken: req.query.expoPushToken || null,
          authProvider: 'google', // Add this field to track auth provider
          googleId: profile.id, // Store Google ID
          password: null
        });
        
        await buyer.save();
      }

      // Generate token
      const token = generateToken(buyer._id);
      buyer.token = token; // Attach token to user object

      return done(null, buyer);
    } catch (error) {
      console.error('Google Auth Error:', error);
      return done(error, null);
    }
  }
));

module.exports = passport; 