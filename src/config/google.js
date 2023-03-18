const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Configure Google OAuth2 using passport
passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/callback",
      },
      function (accessToken, refreshToken, profile, cb) {
       return cb(null, profile);
      }
    )
  );