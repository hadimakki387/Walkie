const { DogOwner, DogWalker, walkingPost } = require("../src/user/userModels");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const index = (req,res)=>{
    res.render("dogWalkerSignUp");
}

const create = async (req, res) => {
  const { Fname, Lname, password, Email, Tel } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const fullName = `${Fname} ${Lname}`;
  const id = uuidv4();
  const dogWalker = new DogWalker({
    Fname: Fname,
    Lname: Lname,
    name: fullName,
    password: hashedPassword,
    email: Email,
    telNumber: Tel,
    id: id,
  });

  try {
    const foundUser = await DogWalker.findOne({ email: Email });
    if (foundUser) {
      req.session.user = {
        name: foundUser.name,
        id: foundUser.id,
        phone: foundUser.telNumber,
        email: foundUser.email
      };
    } else {
      await dogWalker.save();
      req.session.user = {
        name: fullName,
        id: id,
        phone: Tel,
        email: Email
      };
    }
  } catch (err) {
    console.log(err);
  }

  res.redirect("/posts");
};


module.exports = {
    index,
    create
}