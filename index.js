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
const {DogOwner, DogWalker, walkingPost} = require('./src/user/userModels');
const { devNull } = require("os");
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
  console.log("middleware is triggered")
  if (req.user || req.session.user) {
    console.log("user is authenticated");
    next();
  } else {
    res.redirect("/signIn");
  }
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
  //handling the error from the paameters is existed
  let error;
  if(req.query.error==="account-existing"){
    error = "already have an account please SignIn to get access";
  }else if(req.query.error==="wrong-credentials"){
    error = "Wrong Password or E-mail, please try again";
  }
  res.render('signIn',{error:error})
});

// After successful sign-in, render sign-up page if it is a new user or
// redirect to dashboard if user already exists
app.get('/signUp',async (req, res) => {

  //handling the error from the paameters is existed
  let error;
  if(req.query.error==="account-not-existing"){
    error = "You do not have a account, Please Sign Up";
  }

  if (req.isAuthenticated()) {
    const id = req.user.id;
    DogOwner.findOne({ id: id }).then((foundDogOwner) => {
      if ( foundDogOwner) {
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
        res.redirect('/home');
      }
    });
  } else {
    // User is not authenticated
    res.render('signUp',{error:error});
  }
});


app.get('/auth/google', passport.authenticate('google', { scope: ["profile", "email"] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signIn' }), (req, res) => {

  res.redirect('/home');
   
});



// Render dashboard page after successful authentication
app.get("/home", isLoggedIn, (req, res) => {
  console.log("Home triggered");
  if(req.user){
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
  }else{
    res.render('dashboard',{img:null})
  }
  
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
    
  
})//the route that will display the dogs posts
app.get('/posts',(req,res)=>{
  res.render('posts')
})

//recieving the data from the user and checking them in the database 
app.post("/signIn",async (req, res) => {
  const {email,password}=req.body
  

  await DogOwner.findOne({email:email})
    .then(async foundOwner=>{
      if (foundOwner) {
        const isMatch = await bcrypt.compare(password, foundOwner.password);
        if (isMatch) {           
          req.session.user={
            name:foundOwner.fullName,
            id:foundOwner.id
          }
          res.redirect('/home')
        } else {
          res.redirect('signIn?error=wrong-credentials')
        }
      } else {
        await DogWalker.findOne({email:email})
          .then(async foundWalker=>{
            if (foundWalker) {
              const isMatch = await bcrypt.compare(password, foundWalker.password);
              if (isMatch) {
                req.session.user={
                  name:foundWalker.fullName,
                  id:foundWalker.id
                }
                res.redirect('/posts')
              } else {
                res.redirect('signIn?error=Wrong-credentials')
              }
            } else {
              res.redirect('/signUp?error=account-not-existing')
            }
          })
          .catch(err=>{
            console.log(err)
          })
      }
    })
    .catch(err=>{
      console.log(err)
    })
});


//adding a account for the user and checking if it existed
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
    email:email,
    password:hashedPassword
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
        res.redirect('/home')
      }else{
        res.redirect('/signIn?error=account-existing')
      }
    })
    .catch(err=>{
      console.log(err)
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
      })
      .catch(err=>{
        console.log(err)
      })
  }
);

app.listen(process.env.PORT || 3000, () => {
  console.log("listening on port 3000");
});
