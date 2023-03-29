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

// Set view engine
app.set("view engine", "ejs");

// Serve static files from public directory
app.use(express.static("public"));
app.use(express.json());

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
  if (req.user || req.session.user) {
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
  if (req.query.error === "account-existing") {
    error = "already have an account please SignIn to get access";
  } else if (req.query.error === "wrong-credentials") {
    error = "Wrong Password or E-mail, please try again";
  }else if(req.query.error === "found-account-google"){
    error = "You already Signed up using google. Use google sign In to access"
  }
  res.render("signIn", { error: error });
});

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
    DogOwner.findOne({ id: id }).then((foundDogOwner) => {
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

        DogOwner.findOne({ id: id })
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

    res.render("dashboard", { img, name });
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

        res.render("dashboard", { img: imageSrc, name });
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
app.get("/posts",isLoggedIn, (req, res) => {
  const {id} = req.session.user
  
    if(req.query.dogBreed){
      const dog = req.query.dogBreed
      walkingPost.find({dogBreed:dog})
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
    }else{
      walkingPost.find()
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

app.get('/WalkerProfile',isLoggedIn,(req,res)=>{
  const {id} = req.session.user
  console.log(id)
  DogWalker.findOne({id:id})
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


app.post('/WalkerProfile',upload.fields([
  { name: 'profile', maxCount: 1 },
  { name: 'coverImg', maxCount: 1 }
]),async(req,res)=>{
  let {fullName,description,address} = req.body
  let  id  = req.session.user.id
 console.log(req.files)

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
app.post("/home", multer().single("profileImg"), (req, res) => {
  const { user } = req.session;
  let { name, id, email, img } = user;
  const profImgBuffered = req.file.buffer;
  DogOwner.findOneAndUpdate(
    { email: email },
    { profImg: profImgBuffered }
  ).then((err, document) => {
    if (err) {
      console.log(err);
    }
  });

  console.log(email);
  console.log(req.file.buffer);
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

  DogWalker.findOne({ email: Email })
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

app.post('/posts',(req,res)=>{
  console.log(req.body.id);
  const id=req.body.id
  walkingPost.findOneAndUpdate({id:id},{availability:false})
    .then(err=>{
      console.log(err)
    })
  DogOwner.findOneAndUpdate({id:req.session.user.id},{notification:true})
  .then(err=>{
    console.log(err)
  })

})

//recieving the data from the user and checking them in the database
app.post("/signIn", async (req, res) => {
  const { email, password } = req.body;

  await DogOwner.findOne({ email: email })
    .then(async (foundOwner) => {
      if (foundOwner) {

        //check if the user is from google oAuth or not
        if(!foundOwner.password){
          //if he is 
          res.redirect("signIn?error=found-account-google");
        }else{
          //if he is not
          const isMatch = await bcrypt.compare(password, foundOwner.password);
          if (isMatch) {
          req.session.user = {
            name: foundOwner.name,
            id: foundOwner.id,
            img: foundOwner.profImg,
            email: foundOwner.email,
          };
          res.redirect("/home");
        } else {
          res.redirect("signIn?error=wrong-credentials");
        }
        }
        
      } else {
        await DogWalker.findOne({ email: email })
          .then(async (foundWalker) => {
            if (foundWalker) {
              if(!foundWalker.password){
                res.redirect("signIn?error=found-account-google");
              }else{
                const isMatch = await bcrypt.compare(
                password,
                foundWalker.password
              );
              if (isMatch) {
                req.session.user = {
                  name: foundWalker.name,
                  id: foundWalker.id,
                  telNumber:foundWalker.telNumber,
                  email:foundWalker.email
                };
                res.redirect("/posts");
              } else {
                res.redirect("signIn?error=Wrong-credentials");
              }
              }
              
            } else {
              res.redirect("/signUp?error=account-not-existing");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

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

  DogOwner.findOne({ email: email })
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
  (req, res) => {
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
      .catch((err) => {
        console.log(err);
      });
  }
);

app.listen(process.env.PORT || 3000, () => {
  console.log("listening on port 3000");
});
