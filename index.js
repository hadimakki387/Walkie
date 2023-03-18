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
const {DogOwner, DogWalker, walkingPost} = require('./src/user/userModels')
require('./src/config/google')
require('./src/config/passport')

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


app.get('/auth/google', passport.authenticate('google', { scope: ["profile", "email"] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signIn' }), (req, res) => {

  res.redirect('/home');
   
});



// Render dashboard page after successful authentication
app.get("/home", isLoggedIn, (req, res) => {
  let name = req.user.displayName;
  let Fname = req.user.name.givenName;
  let Lname = req.user.name.familyName;
  let img = req.user.photos[0].value;
  let email = req.user.emails[0].value;
  let id = req.user.id

  
  console.log(Lname)

  const dogOwner = new DogOwner({
    Fname:Fname,
    Lname:Lname,
    name: name,
    id: id,
    email:email
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

    res.redirect('/posts')
    
  
})

app.get('/posts',(req,res)=>{
  res.render('posts')
})

app.post("/signIn",(req, res) => {
  res.render("signIn"); // Render view for sign in page
});

app.post('/signUp',async (req,res)=>{
  const {Fname,Lname,email,password} = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const id = uuidv4()
  const fullName= Fname + "" + Lname

  const dogOwner = new DogOwner({
    Fname:Fname,
    Lname:Lname,
    name: fullName,
    id: id,
    email:email
  })
  
  DogOwner.findOne({email:email})
    .then(foundOwner=>{
      if(!foundOwner){
        dogOwner.save()
        const user = {
          name:fullName,
          id : id
        }
        req.session.user = user
        res.redirect('/posts')
      }else{
        res.redirect('/signIn')
      }
    })

})

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
