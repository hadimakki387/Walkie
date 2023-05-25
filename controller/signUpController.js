const { DogOwner } = require("../src/user/userModels");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const index = async (req, res) => {
  if (req.query.error === "account-not-existing") {
    return res.render("signUp", { error: "You do not have an account. Please Sign Up" });
  }

  if (req.isAuthenticated()) {
    const id = req.user.id;
    const foundDogOwner = await DogOwner.findOne({ id: id });

    if (foundDogOwner) {
      return res.redirect("/dashboard");
    }

    const name = req.user.displayName;
    const img = req.user.photos[0].value;

    const dogOwner = new DogOwner({
      name: name,
      id: id,
    });

    try {
      await dogOwner.save();
      res.redirect("/dashboard");
    } catch (error) {
      console.log(error);
      res.render("signUp", { error: "An error occurred while creating your account" });
    }
  } else {
    let error
    res.render("signUp",{error});
  }
};

const create = async(req,res)=>{
  //adding a account for the user and checking if it existed

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

}

module.exports = {
  index,
  create
};
