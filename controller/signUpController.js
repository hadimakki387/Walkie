const { DogOwner } = require("../src/user/userModels");

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

module.exports = {
  index
};
