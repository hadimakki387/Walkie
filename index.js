const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose');
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session')
require('dotenv').config()
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const fs = require('fs')


app.set('view engine','ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false,maxAge: 1000 * 60 * 60  }
  }))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb://127.0.0.1:27017/walkie')

const dogOwnerSchema = new mongoose.Schema({
    name: String,
    email: String,
    id: String,
    address: String,
    dogs: [String],
})

const dogWalkerSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    availability: [String],
    specialSkills: [String]
})

const walkingPostSchema = new mongoose.Schema({
  ownerName:String,
  id: String,
  dogName:String,
  dogBreed:String,
  address:String,
  img:Buffer

})



const DogOwner = mongoose.model('DogOwner', dogOwnerSchema)
const DogWalker = mongoose.model('DogWalker', dogWalkerSchema)
const walkingPost = mongoose.model('walkingPost', walkingPostSchema)


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    cb(null,profile)
  }
));

passport.serializeUser((user,done)=>{
    done(null,user)
})
passport.deserializeUser((user,done)=>{
    done(null,user)
})


function isLoggedIn(req,res,next){
    req.user ? next() : res.sendStatus(401)
}

app.get('/',(req,res)=>{
    let name = null
    let id = null
    let img = null
    res.render('home',{name:name,img:img})
})

app.get('/signIn',(req,res)=>{
    res.render('signIn')
})

app.get('/signUp',(req,res)=>{
    res.render('signUp')
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
  ));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/signUp' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/home');
  });

app.get('/home', isLoggedIn, (req,res)=>{
    let name = req.user.displayName;
    let id = req.user.id;
    let img = req.user.photos[0].value;

    const dogOwner = new DogOwner({
       name: name,
       id: id
    })

    DogOwner.findOne({ id: id })
      .then(foundDogOwner => {
        if(foundDogOwner){
            setTimeout(()=>{
              res.render('dashboard',{img,name})
            },3000) 
        } else {
            dogOwner.save()
            setTimeout(()=>{
              res.render('dashboard',{img,name})
            },3000) 
        }
      }).catch(err => {
          console.log(err)
          res.sendStatus(500)
      });
});

app.get('/home/walk-your-dog',(req,res)=>{   
    res.render('walkForm')
})

app.get('/dog-walker',(req,res)=>{
  res.render('dogWalkerSignUp')
})

app.post('/signIn',(req,res)=>{
    res.render('signIn')
})

app.post('/home/walk-your-dog',isLoggedIn,multer().single('image'),(req,res)=>{

  let id = req.user.id
  let address = req.body.address
  let dogsName = req.body.dogName
  let dogBreed = req.body.dogBreed
  let name = req.user.displayName;
  const imgBuffered = req.file.buffer

  const walkPost = new walkingPost({
    id: id,
    ownerName:name,
    dogName:dogsName,
    dogBreed:dogBreed,
    address:address,
    img: imgBuffered
  })

  walkingPost.findOne({id:id})
  .then(foundPost=>{
    if(foundPost){
      res.redirect('/home')
    }else{
      walkPost.save()
      res.redirect('/home')
    }
  })
  
})

app.listen(3000,()=>{
    console.log("listening on port 3000")
})
