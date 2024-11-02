const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

passport.use(new GoogleStrategy({
    clientID: '891315649612-vn2tvirb74gnd2ggbrp4i4pd9b9p7vq3.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: "http://localhost:8000/api/buyer/google-callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let buyer = await Buyer.findOne({ email: profile.emails[0].value });
      if (!buyer) {
        buyer = new Buyer({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          username: profile.displayName,
          email: profile.emails[0].value,
          country: 'NG',
          phoneNumber: '00000',
          password: '', // Leave password empty for Google OAuth users
          profileImage: {
            url: profile.photos ? profile.photos[0].value : '',
            public_id: '',
          },
        });
        await buyer.save();
      }
      const token = generateToken(buyer._id);
      return done(null, { user: buyer, token });
    } catch (error) {
      return done(error, false);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const buyer = await Buyer.findById(id);
    done(null, buyer);
  } catch (error) {
    done(error, false);
  }
});

module.exports = passport;

