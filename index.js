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
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');

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
  Fname: String,
  Lname: String,
  email: String,
  password: String,
  address: String,
  telNumber: Number,
  address:String,
  age: Number,
  id:String,
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
    res.render('signIn');
});

// After successful sign-in, render sign-up page if it is a new user or
// redirect to dashboard if user already exists
app.get('/signUp', (req, res) => {
  if (req.isAuthenticated()) {
    const id = req.user.id;
    DogOwner.findOne({ id: id }).then((foundDogOwner) => {
      if (foundDogOwner) {
        res.redirect('/home');
      } else {
        let name = req.user.displayName;
        let img = req.user.photos[0].value;
        let id = req.user.id

        const dogOwner = new DogOwner({
          name: name,
          id: id,
        });

        DogOwner.findOne({id:id})
          .then(foundOwnrer=>{
            if(!foundOwnrer){
              dogOwner.save()
            }
          })
          .catch(err=>{
            console.log(err);
          })
        res.redirect('/signIn');
      }
    });
  } else {
    // User is not authenticated
    res.render('signUp');
  }
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signIn' }), (req, res) => {
  const id = req.user.id;

  DogOwner.findOne({ id: id }).then((foundDogOwner) => {
    if (!foundDogOwner) {
      res.redirect('/signUp');
    } else {
      res.redirect('/home');
    }
  });
});



// Render dashboard page after successful authentication
app.get("/home", isLoggedIn, (req, res) => {
  let name = req.user.displayName;
  let img = req.user.photos[0].value;
  let id = req.user.id

  const dogOwner = new DogOwner({
    name: name,
    id: id,
  });

  DogOwner.findOne({id:id})
    .then(foundOwnrer=>{
      if(!foundOwnrer){
        dogOwner.save()
      }
    })
    .catch(err=>{
      console.log(err);
    })

  
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


app.post('/dog-walker',async (req,res)=>{
  const {Fname,Lname,password,Email,Tel} = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const fullName = Fname +" "+ Lname
  const id = uuidv4()
  const dogWalker = new DogWalker({
    Fname:Fname,
    Lname:Lname,
    password:hashedPassword,
    email:Email,
    telNumber:Tel,
    id:id
  })

  DogWalker.findOne({email:Email})
    .then(foundUser=>{
      if(foundUser){
        const user = {
          name:foundUser.Lname + " " + foundUser.Fname,
          id:foundUser.id
        }
        req.session.user = user
      }else{
        dogWalker.save()
        const user = {
          name:fullName,
          id : id
        }
        req.session.user = user
      }
    })
    .catch(err=>{
      console.log(err)
    })

    res.send("hello")
    
  
})

app.post("/signIn", (req, res) => {
  res.render("signIn"); // Render view for sign in page
});

app.post(
  "/home/walk-your-dog",
  isLoggedIn,
  multer().single("image"),
  (req, res) => {
    // Handles posting walk data
    let id = req.user.id
    const {address,dogsName,dogBreed,name} = req.body
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
