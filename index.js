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
const { v4: uuidv4 } = require("uuid");
const { DogOwner, DogWalker, walkingPost } = require("./src/user/userModels");
const { devNull } = require("os");
const _ = require('lodash');
require("./src/config/google");
require("./src/config/passport");
const Home = require('./routes/home')
const signIn = require('./routes/signIn');
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
app.use('/',Home);
app.use('/signIn',signIn)




// Enable passport initialization and session handling
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB database
// Set the desired environment ('local' or 'production')
const environment = 'local';

// Call the connectToDatabase function with the environment
connectToDatabase(environment)
  .then(() => {
    // Start your server or perform other operations
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`mongodb is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection error: ${error}`);
  });

// Middleware function to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.user || req.session.user) {
    next();
  } else {
    res.redirect("/signIn");
  }
}



// Render sign-in page


// After successful sign-in, render sign-up page if it is a new user or
// redirect to dashboard if user already exists
app.get("/signUp", async (req, res) => {
  //handling the error from the paameters is existed
  let error;
  if (req.query.error === "account-not-existing") {
    error = "You do not have a account, Please Sign Up";
  }

  if (req.isAuthenticated()) {
    const id = req.user.id;
    await DogOwner.findOne({ id: id }).then(async(foundDogOwner) => {
      if (foundDogOwner) {
        res.redirect("/home");
      } else {
        let name = req.user.displayName;
        let img = req.user.photos[0].value;
        let id = req.user.id;

        const dogOwner = new DogOwner({
          name: name,
          id: id,
        });

        await DogOwner.findOne({ id: id })
          .then((foundOwnrer) => {
            if (!foundOwnrer) {
              dogOwner.save();
            }
          })
          .catch((err) => {
            console.log(err);
          });
        res.redirect("/home");
      }
    });
  } else {
    // User is not authenticated
    res.render("signUp", { error: error });
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signIn" }),
  (req, res) => {
    res.redirect("/home");
  }
);

// Render dashboard page after successful authentication
app.get("/home", isLoggedIn, async (req, res) => {
  if (req.user) {
    let name = req.user.displayName;
    let Fname = req.user.name.givenName;
    let Lname = req.user.name.familyName;
    let img = req.user.photos[0].value;
    let email = req.user.emails[0].value;
    let id = req.user.id;
    let  foundPost

    const dogOwner = new DogOwner({
      Fname: Fname,
      Lname: Lname,
      name: name,
      id: id,
      email: email,
    });

    await DogOwner.findOne({ id: id })
      .then((foundOwnrer) => {
        if (!foundOwnrer) {
          dogOwner.save();
        }
      })
      .catch((err) => {
        console.log(err);
      });
    
    res.render("dashboard", { img, name,foundPost });
  } else {
    const { user } = req.session;
    const { name, id, email, img } = user;
    await DogOwner.findOne({ email: email }).then(async (foundOwner) => {
      if (foundOwner) {
        let imageSrc;
        if (img) {
          const base64Image = Buffer.from(img).toString("base64");
          imageSrc = `data:image/png;base64,${base64Image}`;
        } else {
          await DogOwner.findOne({ email: email })
            .then((foundOwner) => {
              if (foundOwner.profImg) {
                const base64Image = Buffer.from(foundOwner.profImg).toString(
                  "base64"
                );
                imageSrc = `data:image/png;base64,${base64Image}`;
              } else {
                const imageSrc = null;
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }

      // check if there is a user that requested for the post this user posted
       await walkingPost.findOne({id:id})
        .then(async foundPost=>{
          if( foundPost){
            const walkerId = foundPost.submittedBy
            console.log(walkerId)
            await DogWalker.findOne({id:walkerId})
              .then(foundwalker=>{
                  res.render("dashboard", { img: imageSrc, name,foundwalker,foundPost });
              })
              .catch(err=>{
                console.log(err)
              })
          }else{
            let foundPost
            let foundwalker
            res.render("dashboard", { img: imageSrc, name ,foundPost,foundwalker});
          }
      })

        
      } else {
        res.redirect("/signUp?error=account-not-existing");
      }
    });
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
                let profile =foundWalker.profile?Buffer.from(foundWalker.profile).toString('base64'):null  
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
        let profile =foundWalker.profile?Buffer.from(foundWalker.profile).toString('base64'):null  
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

app.get('/WalkerProfile',isLoggedIn,async (req,res)=>{
  const {id} = req.session.user
  console.log(id)
  await DogWalker.findOne({id:id})
    .then(foundWalker=>{
      if(foundWalker){
        let name = foundWalker.name
        let coverImg =foundWalker.coverImg?Buffer.from(foundWalker.coverImg).toString('base64'):null 
        let profile =foundWalker.profile?Buffer.from(foundWalker.profile).toString('base64'):null  
        let description = foundWalker.description
        let address = foundWalker.address

        res.render('WalkerProfile',{profile,coverImg,description,name,address})
      }else {
        let coverImg 
        let profile 
        let description
        let name 
        let address
        res.render('WalkerProfile',{profile,coverImg,description,name,address})
      }
      
    })
  
})

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

app.post('/WalkerProfile',upload.fields([
  { name: 'profile', maxCount: 1 },
  { name: 'coverImg', maxCount: 1 }
]),async(req,res)=>{
  let {fullName,description,address} = req.body
  let  id  = req.session.user.id

  
  if(req.files && req.files.profile){
    const profileBuffered = req.files['profile'][0].buffer
    await DogWalker.findOneAndUpdate({id:id},{profile:profileBuffered})
      res.redirect('/WalkerProfile')
  }else if(req.files && req.files.coverImg){
    
    const coverBuffered = req.files['coverImg'][0].buffer
    await DogWalker.findOneAndUpdate({id:id},{coverImg:coverBuffered})
      
      res.redirect('/WalkerProfile')
  } else if(fullName){
    await DogWalker.findOneAndUpdate({id:id},{name:fullName})
      
      res.redirect('/WalkerProfile')
  }else if(description){

    await DogWalker.findOneAndUpdate({id:id},{description:description})
      
      res.redirect('/WalkerProfile')
  }else if(address){
    await DogWalker.findOneAndUpdate({id:id},{address:address})
      
      res.redirect('/WalkerProfile')
  }
})



//recieved the data from the form of adding pic
app.post("/home", multer().single("profileImg"),async (req, res) => {
  const { user } = req.session;
  let { name, id, email, img } = user;
  const profImgBuffered = req.file.buffer;
  await DogOwner.findOneAndUpdate(
    { email: email },
    { profImg: profImgBuffered }
  ).then((err, document) => {
    if (err) {
      console.log(err);
    }
  });

  res.redirect("/home");
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
  console.log(id)
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
        res.redirect("/home");
      } else {
        res.redirect("/signIn?error=account-existing");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post(
  "/home/walk-your-dog",
  isLoggedIn,
  multer().single("image"),
  async (req, res) => {
    // Handles posting walk data
    const id=req.user?req.user.id:req.session.user.id
    const name = req.user?req.user.displayName:req.session.user.name
    console.log(id)

    const { address, dogName, dogBreed, DogDescription } = req.body;
    const imgBuffered = req.file.buffer;

    const walkPost = new walkingPost({
      id: id,
      ownerName: name,
      dogName: dogName,
      dogBreed: _.capitalize(dogBreed),
      address: address,
      descriptions: DogDescription,
      availability:true,
      img: imgBuffered, // Set image with uploaded file converted to base64 format string
    });

    await walkingPost
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
