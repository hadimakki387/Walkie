const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
require("dotenv").config();
const path = require('path')
const upload = require('./middleware/multer')
 const isLoggedIn = require('./middleware/isLoggedIn')
const fs = require("fs");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const { DogOwner, DogWalker, walkingPost } = require("./src/user/userModels");
const { devNull } = require("os");
const _ = require('lodash');
require("./src/config/google");
require("./src/config/passport");
const connectToDatabase = require("./src/db");



// Set view engine
app.set("view engine", "ejs");

// Use body parser middleware and session management
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: false,
  })
);

// Serve static files from public directory
app.use(express.static("public"));
app.use(express.json());





// Enable passport initialization and session handling
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB database
// Set the desired environment ('local' or 'production')
const environment = 'local';

connectToDatabase(environment)
  .then(() => {
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`mongodb is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection error: ${error}`);
  });



// ROUTERS
const Home = require('./routes/home')
app.use('/',Home);

const signIn = require('./routes/signIn');
app.use('/signIn',signIn)

const signUp = require('./routes/signUp');
app.use('/signUp',signUp)

const walkerProfile = require('./routes/walkerProfile');
app.use('/walkerProfile',walkerProfile)

const dashboard = require('./routes/dashboard')
app.use('/dashboard',dashboard);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signIn" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);



// Render form for creating a walking post
app.get("/walk-your-dog", (req, res) => {
  res.render("walkForm");
});

// Render sign-up page for dog walkers
app.get("/dog-walker", (req, res) => {
  res.render("dogWalkerSignUp");
});

//the route that will display the dogs posts
app.get("/posts",isLoggedIn,async (req, res) => {
  const {id} = req.session.user
    if(req.query.dogBreed){
      const dog = req.query.dogBreed
      await walkingPost.find({dogBreed:dog})
        .then(async foundPosts=>{
          const postsCount = foundPosts.filter(posts=>posts.availability===true).length;
          await DogWalker.findOne({id:id})
            .then(foundWalker=>{
              
              if(foundWalker.profile){
                let profile =foundWalker.profile?foundWalker.profile:null  
                res.render("posts",{foundPosts,postsCount,profile});
              }else{
                let profile
                res.render("posts",{foundPosts,postsCount,profile});
              }
              
            })
            .catch(err=>{
              if(err){
                console.log(err)
              }
            })
          
        })
        .catch(err=>{
          console.log(err)
        })
    }else{
    await walkingPost.find()
    .then(foundPosts=>{
      const postsCount = foundPosts.filter(posts=>posts.availability===true).length;
      DogWalker.findOne({id:id})
      .then(foundWalker=>{
        let profile =foundWalker.profile?foundWalker.profile:null  
        res.render("posts",{foundPosts,postsCount,profile});
      })
      .catch(err=>{
        if(err){
          console.log(err)
        }
      })
    })
    .catch(err=>{
      console.log(err)
    })
    }
    
    
});



app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});

app.get('/profile',async (req,res)=>{
  let coverImg 
  let profile 
  let description
  let name 
  let address
  await DogWalker.findOne({id:req.query.id})
  .then(foundWalker=>{
    if(foundWalker){
      res.render('profileWhenVisited',{foundWalker})
    }else{
      res.render('profileWhenVisited',{profile,coverImg,description,name,address})
    }
  })
  
})

app.post('/WalkerProfile', upload.fields([
  { name: 'profile', maxCount: 1 },
  { name: 'coverImg', maxCount: 1 }
]), async (req, res) => {
  let { fullName, description, address } = req.body;
  let id = req.session.user.id;

  if (req.files && req.files.profile) {
    const profile = req.files['profile'][0].filename;
    const dogWalker = await DogWalker.findOne({ id: id });
  
    if (dogWalker && dogWalker.profile && dogWalker.profile !== profile) {
      const filePath = `public/uploads/${dogWalker.profile}`;
      fs.unlink(filePath, async (err) => {
        if (err) {
          console.log(err);
        }
  
        await DogWalker.findOneAndUpdate({ id: id }, { profile: profile });
        res.redirect('/WalkerProfile');
      });
    } else if (!dogWalker || !dogWalker.profile) {
      await DogWalker.findOneAndUpdate({ id: id }, { profile: profile });
      res.redirect('/WalkerProfile');
    } else {
      res.redirect('/WalkerProfile');
    }
  } else if (req.files && req.files.coverImg) {
    const cover = req.files['coverImg'][0].filename;
    await DogWalker.findOneAndUpdate({ id: id }, { coverImg: cover });
    res.redirect('/WalkerProfile');
  } else if (fullName) {
    await DogWalker.findOneAndUpdate({ id: id }, { name: fullName });
    res.redirect('/WalkerProfile');
  } else if (description) {
    await DogWalker.findOneAndUpdate({ id: id }, { description: description });
    res.redirect('/WalkerProfile');
  } else if (address) {
    await DogWalker.findOneAndUpdate({ id: id }, { address: address });
    res.redirect('/WalkerProfile');
  }
});



//recieved the data from the form of adding pic
app.post("/dashboard", upload.single("profileImg"), async (req, res) => {
  const { user } = req.session;
  let { name, id, email, img } = user;
  const profImg = req.file.filename; // Get the path of the uploaded file

  await DogOwner.findOneAndUpdate(
    { email: email },
    { profImg: profImg } // Save the file path in the profImg field
  ).catch((err) => {
    console.log(err);
  });

  res.redirect("/dashboard");
});

//recieved data from the dog walker form
app.post("/dog-walker", async (req, res) => {
  const { Fname, Lname, password, Email, Tel } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const fullName = Fname + " " + Lname;
  const id = uuidv4();
  const dogWalker = new DogWalker({
    Fname: Fname,
    Lname: Lname,
    name:fullName,
    password: hashedPassword,
    email: Email,
    telNumber: Tel,
    id: id,
  });

  await DogWalker.findOne({ email: Email })
    .then((foundUser) => {
      if (foundUser) {
        req.session.user = {
          name: foundUser.name,
          id: foundUser.id,
          phone:foundUser.telNumber,
          email:foundUser.email
        };;
      } else {
        dogWalker.save();
        
        req.session.user = {
          name: fullName,
          id: id,
          Phone:Tel,
          email:Email
        };
      }
    })
    .catch((err) => {
      console.log(err);
    });

  res.redirect("/posts");
});

app.post('/posts',async (req,res)=>{
  
  const id=req.body.id
  await walkingPost.findOneAndUpdate({id:id},{availability:false,submittedBy:req.session.user.id})
    .then(err=>{
      console.log(err)
    })
  await DogOwner.findOneAndUpdate({id:req.session.user.id},{notification:true})
  .then(err=>{
    console.log(err)
  })

})



//adding a account for the user and checking if it existed
app.post("/signUp", async (req, res) => {
  const { Fname, Lname, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const fullName = Fname + " " + Lname;

  const dogOwner = new DogOwner({
    Fname: Fname,
    Lname: Lname,
    name: fullName,
    id: id,
    email: email,
    password: hashedPassword,
  });

  await DogOwner.findOne({ email: email })
    .then((foundOwner) => {
      if (!foundOwner) {
        dogOwner.save();
        const user = {
          name: fullName,
          id: id,
          email: email,
        };
        req.session.user = user;
        res.redirect("/dashboard");
      } else {
        res.redirect("/signIn?error=account-existing");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post(
  "/walk-your-dog",
  isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    // Handles posting walk data
    const id=req.user?req.user.id:req.session.user.id
    const name = req.user?req.user.displayName:req.session.user.name

    const { address, dogName, dogBreed, DogDescription } = req.body;
    const dogImage = req.file.filename;

    const walkPost = new walkingPost({
      id: id,
      ownerName: name,
      dogName: dogName,
      dogBreed: _.capitalize(dogBreed),
      address: address,
      descriptions: DogDescription,
      availability:true,
      img: dogImage, // Set image with uploaded file converted to base64 format string
    });

    await walkingPost
      .findOne({ id: id }) // Searches for an existing post by user ID
      .then((foundPost) => {
        if (foundPost) {
          // Post exists so redirect back to homepage
          setTimeout(() => {
            res.redirect("/dashboard");
          }, 2000);
        } else {
          // Save new post item and redirect
          walkPost.save();
          setTimeout(() => {
            res.redirect("/dashboard");
          }, 2000);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
);

//in production 4001
const port = 3000
app.listen(port, () => {
  console.log("listening on port " + port);
});
