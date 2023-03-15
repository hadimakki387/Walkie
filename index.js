const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
require("dotenv").config();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fs = require("fs");

// Set view engine
app.set("view engine", "ejs");

// Serve static files from public directory
app.use(express.static("public"));

// Use body parser middleware and session management
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 },
  })
);

// Enable passport initialization and session handling
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB database
mongoose.connect("mongodb://127.0.0.1:27017/walkie");

// Define dog owner schema
const dogOwnerSchema = new mongoose.Schema({
  name: String,
  email: String,
  id: String,
  address: String,
  dogs: [String],
});

// Define dog walker schema
const dogWalkerSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  address: String,
  availability: [String],
  specialSkills: [String],
});

// Define walking post schema
const walkingPostSchema = new mongoose.Schema({
  ownerName: String,
  id: String,
  dogName: String,
  dogBreed: String,
  address: String,
  img: Buffer,
});

// Create models for each schema
const DogOwner = mongoose.model("DogOwner", dogOwnerSchema);
const DogWalker = mongoose.model("DogWalker", dogWalkerSchema);
const walkingPost = mongoose.model("walkingPost", walkingPostSchema);

// Configure Google OAuth2 using passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, cb) {
      cb(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware function to check if user is authenticated
function isLoggedIn(req, res, next) {
  req.user ? next() : res.redirect("/signIn");
}

// Render initial page with no user information
app.get("/", (req, res) => {
  let name = null;
  let id = null;
  let img = null;
  res.render("home", { name: name, img: img });
});

// Render sign-in page
app.get("/signIn", (req, res) => {
  res.render("signIn");
});

// After successful sign-in, render sign-up page if it is a new user or
// redirect to dashboard if user already exists
app.get("/signUp", isLoggedIn, (req, res) => {
  let name = req.user.displayName;
  let id = req.user.id;
  let img = req.user.photos[0].value;

  const dogOwner = new DogOwner({
    name: name,
    id: id,
  });
  dogOwner.save();
  res.render("signUp");
});

// Start Google OAuth2 flow
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// Complete Google OAuth2 flow and redirect to homepage
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signUp" }),
  function (req, res) {
    // Successful authentication, redirect home.
    let id = req.user.id;
    DogOwner.findOne({ id: id }).then((foundDogOwner) => {
      if (foundDogOwner) {
        res.redirect("/home");
      } else res.redirect("/signUp");
    });
  }
);

// Render dashboard page after successful authentication
app.get("/home", isLoggedIn, (req, res) => {
  let name = req.user.displayName;
  let img = req.user.photos[0].value;
  console.log(img);
  res.render("dashboard", { img, name });
});

// Render form for creating a walking post
app.get("/home/walk-your-dog", (req, res) => {
  res.render("walkForm");
});

// Render sign-up page for dog walkers
app.get("/dog-walker", (req, res) => {
  res.render("dogWalkerSignUp");
});

app.post("/signIn", (req, res) => {
  res.render("signIn"); // Render view for sign in page
});

app.post(
  "/home/walk-your-dog",
  isLoggedIn,
  multer().single("image"),
  (req, res) => {
    // Handles posting walk data

    let address = req.body.address;
    let dogsName = req.body.dogName;
    let dogBreed = req.body.dogBreed;
    let name = req.user.displayName;
    const imgBuffered = req.file.buffer;

    const walkPost = new walkingPost({
      id: id,
      ownerName: name,
      dogName: dogsName,
      dogBreed: dogBreed,
      address: address,
      img: imgBuffered.toString("base64"), // Set image with uploaded file converted to base64 format string
    });

    walkingPost
      .findOne({ id: id }) // Searches for an existing post by user ID
      .then((foundPost) => {
        if (foundPost) {
          // Post exists so redirect back to homepage
          setTimeout(() => {
            res.redirect("/home");
          }, 2000);
        } else {
          // Save new post item and redirect
          walkPost.save();
          setTimeout(() => {
            res.redirect("/home");
          }, 2000);
        }
      });
  }
);

app.listen(process.env.PORT || 3000, () => {
  console.log("listening on port 3000");
});
