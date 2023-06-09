const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const passport = require("passport");
const session = require("express-session");
const isLoggedIn = require('./middleware/isLoggedIn');
const { DogOwner, DogWalker, walkingPost,Review } = require("./src/user/userModels");
const FileStore = require("session-file-store")(session);
const connectToDatabase = require("./src/db");
const mongoose = require("mongoose");


// Set view engine
app.set("view engine", "ejs");

// Use body parser middleware and session management
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: false,
    store: new FileStore(),
    cookie: {
      maxAge: 3600000, // Set the expiration time for the session cookie to 1 hour (in milliseconds)
    },
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
const environment = 'production';

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
const Home = require('./routes/home');
app.use('/', Home);

const signIn = require('./routes/signIn');
app.use('/signIn', signIn);

const signUp = require('./routes/signUp');
app.use('/signUp', signUp);

const walkerProfile = require('./routes/walkerProfile');
app.use('/walkerProfile', walkerProfile);

const dashboard = require('./routes/dashboard');
app.use('/dashboard', dashboard);

const walkYourDog = require('./routes/walkYourDogs');
app.use('/walk-your-dog', walkYourDog);

const posts = require('./routes/posts');
app.use('/posts', posts);

const profile = require('./routes/profile');
app.use('/profile', profile);

const dogWalker = require('./routes/dogWalker');
app.use('/dog-walker', dogWalker);

const logout = require('./routes/logout');
app.use('/logout', logout);


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

const port = 4001;
app.listen(port, () => {
  console.log("listening on port " + port);
});
