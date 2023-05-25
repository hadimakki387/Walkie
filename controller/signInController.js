const { DogOwner, DogWalker, walkingPost } = require("../src/user/userModels");
const bcrypt = require("bcrypt");

// signInController.js
const index = (req, res) => {
  // Handling the error from the parameters if it exists
  let error;
  if (req.query.error === 'account-existing') {
    error = 'Already have an account. Please sign in to get access.';
  } else if (req.query.error === 'wrong-credentials') {
    error = 'Wrong password or email. Please try again.';
  } else if (req.query.error === 'found-account-google') {
    error = 'You already signed up using Google. Use Google Sign In to access.';
  }
  res.render('signIn/index', { error: error });
  
};

const create = async (req, res) => {
    const { email, password } = req.body;
    try {
      const foundOwner = await DogOwner.findOne({ email: email });
      if (foundOwner) {
        if (!foundOwner.password) {
          res.redirect("signIn?error=found-account-google");
        } else {
          await handleUserAuthentication(password, foundOwner, req, res, "/dashboard");
        }
      } else {
        const foundWalker = await DogWalker.findOne({ email: email });
        if (foundWalker) {
          if (!foundWalker.password) {
            res.redirect("signIn?error=found-account-google");
          } else {
            await handleUserAuthentication(password, foundWalker, req, res, "/posts");
          }
        } else {
          res.redirect("/signUp?error=account-not-existing");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };



  //usable functions
  const handleUserAuthentication = async (password, user, req, res, redirectUrl) => {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.user = {
        name: user.name,
        id: user.id,
        img: user.profImg,
        email: user.email,
        telNumber: user.telNumber // Assuming `telNumber` is common for both DogOwner and DogWalker
      };
      res.redirect(redirectUrl);
    } else {
      res.redirect("signIn?error=wrong-credentials");
    }
  };

module.exports = {
  index,
  create
};
